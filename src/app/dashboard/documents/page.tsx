"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getAllDocuments,
  deleteVehicleDocument,
  getDocumentTypes,
  getDocumentNameSuggestions,
  getDocumentNumberSuggestions,
  type VehicleDocument,
  type DocumentType
} from "@/lib/api/vehicleDocuments";
import { vehicleService, type Vehicle } from "@/lib/vehicles";
import { Download, Pencil, Trash2, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ vehicleId: number; docId: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(true);

  // Temporary filter values (before apply)
  const [tempDocNameFilter, setTempDocNameFilter] = useState("");
  const [tempDocNumberFilter, setTempDocNumberFilter] = useState("");
  const [tempVehicleNameFilter, setTempVehicleNameFilter] = useState("");
  const [tempDocTypeFilter, setTempDocTypeFilter] = useState<string>("all");
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all");

  // Applied filter values (after clicking apply)
  const [docNameFilter, setDocNameFilter] = useState("");
  const [docNumberFilter, setDocNumberFilter] = useState("");
  const [vehicleNameFilter, setVehicleNameFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Autocomplete states
  const [showDocNameSuggestions, setShowDocNameSuggestions] = useState(false);
  const [docNameSuggestions, setDocNameSuggestions] = useState<string[]>([]);
  const [selectedDocNameIndex, setSelectedDocNameIndex] = useState(-1);

  const [showDocNumberSuggestions, setShowDocNumberSuggestions] = useState(false);
  const [docNumberSuggestions, setDocNumberSuggestions] = useState<string[]>([]);
  const [selectedDocNumberIndex, setSelectedDocNumberIndex] = useState(-1);

  const [showVehicleNameSuggestions, setShowVehicleNameSuggestions] = useState(false);
  const [vehicleNameSuggestions, setVehicleNameSuggestions] = useState<string[]>([]);
  const [selectedVehicleNameIndex, setSelectedVehicleNameIndex] = useState(-1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, vehiclesResponse, typesData] = await Promise.all([
        getAllDocuments(),
        vehicleService.getAll(),
        getDocumentTypes(),
      ]);
      setDocuments(docsData);
      setVehicles(vehiclesResponse.data);
      setDocumentTypes(typesData);
    } catch (error: any) {
      toast.error("Failed to load documents", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  // Close autocomplete dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#doc-name-filter-container')) {
        setShowDocNameSuggestions(false);
      }
      if (!target.closest('#doc-number-filter-container')) {
        setShowDocNumberSuggestions(false);
      }
      if (!target.closest('#vehicle-name-filter-container')) {
        setShowVehicleNameSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.field_values?.find((fv) => fv.field?.key === "name")?.value || `Vehicle #${vehicleId}`;
  };

  const getDocumentTypeName = (doc: VehicleDocument) => {
    if (typeof doc.document_type === 'string') return doc.document_type;
    // Check both document_type_info and documentType (from backend)
    if (doc.document_type_info?.name) return doc.document_type_info.name;
    if (doc.documentType?.name) return doc.documentType.name;
    if ((doc as any).document_type?.name) return (doc as any).document_type.name;
    return doc.document_type || 'Unknown';
  };

  // Autocomplete for document name (backend API)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (tempDocNameFilter.length >= 2) {
        try {
          const suggestions = await getDocumentNameSuggestions(tempDocNameFilter);
          setDocNameSuggestions(suggestions);
          setShowDocNameSuggestions(suggestions.length > 0);
          setSelectedDocNameIndex(-1);
        } catch (error) {
          console.error('Failed to fetch document name suggestions:', error);
          setDocNameSuggestions([]);
          setShowDocNameSuggestions(false);
        }
      } else {
        setShowDocNameSuggestions(false);
        setDocNameSuggestions([]);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [tempDocNameFilter]);

  // Autocomplete for document number (backend API)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (tempDocNumberFilter.length >= 2) {
        try {
          const suggestions = await getDocumentNumberSuggestions(tempDocNumberFilter);
          setDocNumberSuggestions(suggestions);
          setShowDocNumberSuggestions(suggestions.length > 0);
          setSelectedDocNumberIndex(-1);
        } catch (error) {
          console.error('Failed to fetch document number suggestions:', error);
          setDocNumberSuggestions([]);
          setShowDocNumberSuggestions(false);
        }
      } else {
        setShowDocNumberSuggestions(false);
        setDocNumberSuggestions([]);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [tempDocNumberFilter]);

  // Autocomplete for vehicle name (backend API)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (tempVehicleNameFilter.length >= 2) {
        try {
          const suggestions = await vehicleService.getNameSuggestions(tempVehicleNameFilter);
          setVehicleNameSuggestions(suggestions);
          setShowVehicleNameSuggestions(suggestions.length > 0);
          setSelectedVehicleNameIndex(-1);
        } catch (error) {
          console.error('Failed to fetch vehicle name suggestions:', error);
          setVehicleNameSuggestions([]);
          setShowVehicleNameSuggestions(false);
        }
      } else {
        setShowVehicleNameSuggestions(false);
        setVehicleNameSuggestions([]);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [tempVehicleNameFilter]);

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      setDeleting(true);
      await deleteVehicleDocument(documentToDelete.vehicleId, documentToDelete.docId);
      toast.success("Document deleted successfully");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete document", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (document: VehicleDocument) => {
    // Remove /api from the URL to get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const fileUrl = `${baseUrl}/storage/${document.file_path}`;
    window.open(fileUrl, "_blank");
  };

  const getStatusBadge = (doc: VehicleDocument) => {
    if (doc.is_expired) {
      return <Badge className="bg-red-500/20 text-red-700 border-red-500/50">Expired</Badge>;
    }
    if (doc.expiry_date) {
      const daysUntilExpiry = Math.floor(
        (new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 30) {
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50">Expiring Soon</Badge>;
      }
      return <Badge className="bg-primary/20 text-primary border-primary/50">Valid</Badge>;
    }
    return <Badge variant="outline">No Expiry</Badge>;
  };

  const applyFilters = async () => {
    // Close all autocomplete dropdowns
    setShowDocNameSuggestions(false);
    setShowDocNumberSuggestions(false);
    setShowVehicleNameSuggestions(false);

    // Update applied filters
    setDocNameFilter(tempDocNameFilter);
    setDocNumberFilter(tempDocNumberFilter);
    setVehicleNameFilter(tempVehicleNameFilter);
    setDocTypeFilter(tempDocTypeFilter);
    setStatusFilter(tempStatusFilter);

    // Build filter object for backend API
    const filters: any = {};

    if (tempDocNameFilter) {
      filters.document_name = tempDocNameFilter;
    }

    if (tempDocNumberFilter) {
      filters.document_number = tempDocNumberFilter;
    }

    // For vehicle name filter, we need to find the vehicle ID from the name
    if (tempVehicleNameFilter) {
      const matchingVehicle = vehicles.find((v) => {
        const vehicleName = getVehicleName(v.id);
        return vehicleName.toLowerCase() === tempVehicleNameFilter.toLowerCase();
      });
      if (matchingVehicle) {
        filters.vehicle_id = matchingVehicle.id;
      }
    }

    if (tempDocTypeFilter !== "all") {
      filters.document_type_id = parseInt(tempDocTypeFilter);
    }

    if (tempStatusFilter !== "all") {
      filters.status = tempStatusFilter;
    }

    // Reload data with filters
    await loadData(filters);
  };

  const clearFilters = async () => {
    setTempDocNameFilter("");
    setTempDocNumberFilter("");
    setTempVehicleNameFilter("");
    setTempDocTypeFilter("all");
    setTempStatusFilter("all");

    setDocNameFilter("");
    setDocNumberFilter("");
    setVehicleNameFilter("");
    setDocTypeFilter("all");
    setStatusFilter("all");

    setShowDocNameSuggestions(false);
    setShowDocNumberSuggestions(false);
    setShowVehicleNameSuggestions(false);

    // Reload data without filters
    await loadData();
  };

  const hasActiveFilters = docNameFilter || docNumberFilter || vehicleNameFilter || docTypeFilter !== "all" || statusFilter !== "all";

  // Keyboard navigation handlers
  const createKeyDownHandler = (
    suggestions: string[],
    selectedIndex: number,
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    setShow: React.Dispatch<React.SetStateAction<boolean>>,
    showSuggestions: boolean
  ) => {
    return (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          setValue(suggestions[selectedIndex]);
          setShow(false);
          setSelectedIndex(-1);
        }
      } else if (e.key === 'Escape') {
        setShow(false);
        setSelectedIndex(-1);
      }
    };
  };

  const columns: ColumnDef<VehicleDocument>[] = [
    {
      accessorKey: "document_type",
      header: "Document Type",
      cell: ({ row }) => {
        const typeName = getDocumentTypeName(row.original);
        return <Badge variant="outline">{typeName}</Badge>;
      },
    },
    {
      accessorKey: "document_name",
      header: "Document Name",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("document_name")}</div>;
      },
    },
    {
      accessorKey: "document_number",
      header: "Document Number",
      cell: ({ row }) => {
        const docNumber = row.getValue("document_number") as string;
        return docNumber ? (
          <span className="text-sm text-muted-foreground">{docNumber}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => {
        const vehicleName = getVehicleName(row.original.vehicle_id);
        return <span className="text-sm text-muted-foreground">{vehicleName}</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        return getStatusBadge(row.original);
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(doc);
              }}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/vehicles/${doc.vehicle_id}/documents/${doc.id}/edit`);
              }}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDocumentToDelete({ vehicleId: doc.vehicle_id, docId: doc.id });
                setDeleteDialogOpen(true);
              }}
              className="hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Documents</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all vehicle documents across your fleet
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              All documents from all vehicles in one place
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters Section */}
            <div className="rounded-lg border bg-muted/50 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-8 px-2"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="font-semibold">Filters</span>
                    {showFilters ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                  {hasActiveFilters && (
                    <Badge variant="secondary">
                      {[docNameFilter, docNumberFilter, vehicleNameFilter, docTypeFilter !== "all", statusFilter !== "all"].filter(Boolean).length} active
                    </Badge>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  showFilters ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
                style={{ overflow: showFilters ? 'visible' : 'hidden' }}
              >
                <div className="px-4 pb-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Document Name Filter */}
                    <div id="doc-name-filter-container" className="space-y-2 relative">
                      <Label htmlFor="doc-name-filter">Document Name</Label>
                      <Input
                        id="doc-name-filter"
                        placeholder="Search document name..."
                        value={tempDocNameFilter}
                        onChange={(e) => setTempDocNameFilter(e.target.value)}
                        onKeyDown={createKeyDownHandler(
                          docNameSuggestions,
                          selectedDocNameIndex,
                          setSelectedDocNameIndex,
                          setTempDocNameFilter,
                          setShowDocNameSuggestions,
                          showDocNameSuggestions
                        )}
                        onFocus={() => {
                          if (tempDocNameFilter.length >= 2 && docNameSuggestions.length > 0) {
                            setShowDocNameSuggestions(true);
                          }
                        }}
                        className="h-9"
                        autoComplete="off"
                      />
                      {showDocNameSuggestions && docNameSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          {docNameSuggestions.map((name, index) => (
                            <div
                              key={index}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                index === selectedDocNameIndex
                                  ? 'bg-accent'
                                  : 'hover:bg-accent'
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setTempDocNameFilter(name);
                                setShowDocNameSuggestions(false);
                                setSelectedDocNameIndex(-1);
                              }}
                              onMouseEnter={() => setSelectedDocNameIndex(index)}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Min. 2 characters
                      </p>
                    </div>

                    {/* Document Number Filter */}
                    <div id="doc-number-filter-container" className="space-y-2 relative">
                      <Label htmlFor="doc-number-filter">Document Number</Label>
                      <Input
                        id="doc-number-filter"
                        placeholder="Search document number..."
                        value={tempDocNumberFilter}
                        onChange={(e) => setTempDocNumberFilter(e.target.value)}
                        onKeyDown={createKeyDownHandler(
                          docNumberSuggestions,
                          selectedDocNumberIndex,
                          setSelectedDocNumberIndex,
                          setTempDocNumberFilter,
                          setShowDocNumberSuggestions,
                          showDocNumberSuggestions
                        )}
                        onFocus={() => {
                          if (tempDocNumberFilter.length >= 2 && docNumberSuggestions.length > 0) {
                            setShowDocNumberSuggestions(true);
                          }
                        }}
                        className="h-9"
                        autoComplete="off"
                      />
                      {showDocNumberSuggestions && docNumberSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          {docNumberSuggestions.map((number, index) => (
                            <div
                              key={index}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                index === selectedDocNumberIndex
                                  ? 'bg-accent'
                                  : 'hover:bg-accent'
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setTempDocNumberFilter(number);
                                setShowDocNumberSuggestions(false);
                                setSelectedDocNumberIndex(-1);
                              }}
                              onMouseEnter={() => setSelectedDocNumberIndex(index)}
                            >
                              {number}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Min. 2 characters
                      </p>
                    </div>

                    {/* Vehicle Name Filter */}
                    <div id="vehicle-name-filter-container" className="space-y-2 relative">
                      <Label htmlFor="vehicle-name-filter">Vehicle Name</Label>
                      <Input
                        id="vehicle-name-filter"
                        placeholder="Search vehicle..."
                        value={tempVehicleNameFilter}
                        onChange={(e) => setTempVehicleNameFilter(e.target.value)}
                        onKeyDown={createKeyDownHandler(
                          vehicleNameSuggestions,
                          selectedVehicleNameIndex,
                          setSelectedVehicleNameIndex,
                          setTempVehicleNameFilter,
                          setShowVehicleNameSuggestions,
                          showVehicleNameSuggestions
                        )}
                        onFocus={() => {
                          if (tempVehicleNameFilter.length >= 2 && vehicleNameSuggestions.length > 0) {
                            setShowVehicleNameSuggestions(true);
                          }
                        }}
                        className="h-9"
                        autoComplete="off"
                      />
                      {showVehicleNameSuggestions && vehicleNameSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          {vehicleNameSuggestions.map((name, index) => (
                            <div
                              key={index}
                              className={`px-3 py-2 cursor-pointer text-sm ${
                                index === selectedVehicleNameIndex
                                  ? 'bg-accent'
                                  : 'hover:bg-accent'
                              }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setTempVehicleNameFilter(name);
                                setShowVehicleNameSuggestions(false);
                                setSelectedVehicleNameIndex(-1);
                              }}
                              onMouseEnter={() => setSelectedVehicleNameIndex(index)}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Min. 2 characters
                      </p>
                    </div>

                    {/* Document Type Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="doc-type-filter">Document Type</Label>
                      <Select value={tempDocTypeFilter} onValueChange={setTempDocTypeFilter}>
                        <SelectTrigger id="doc-type-filter" className="h-9">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="status-filter">Status</Label>
                      <Select value={tempStatusFilter} onValueChange={setTempStatusFilter}>
                        <SelectTrigger id="status-filter" className="h-9">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="expiring">Expiring Soon (30 days)</SelectItem>
                          <SelectItem value="valid">Valid</SelectItem>
                          <SelectItem value="no_expiry">No Expiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Apply and Clear Buttons */}
                  <div className="pt-4 border-t flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters && (
                        <>
                          Showing <span className="font-medium text-foreground">{documents.length}</span> documents
                        </>
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters && !tempDocNameFilter && !tempDocNumberFilter && !tempVehicleNameFilter && tempDocTypeFilter === "all" && tempStatusFilter === "all"}
                      >
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        onClick={applyFilters}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DataTable
              columns={columns}
              data={documents}
              searchKey="document_name"
              searchPlaceholder="Search documents..."
              showPagination={true}
              pageSize={20}
            />
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
