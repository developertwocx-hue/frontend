"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { DataTable } from "@/components/data-table";
import { vehicleService, vehicleTypeService, Vehicle, VehicleType } from "@/lib/vehicles";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Pencil, Trash2, Plus, FileText, X, Filter, ChevronDown, ChevronUp, Truck, CheckCircle, Wrench, XCircle, Upload } from "lucide-react";
import { PageLoading } from "@/components/ui/loading-overlay";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";


import { ComplianceScoreBadge } from "@/components/vehicles/compliance-score-badge";

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [quickStats, setQuickStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    inactive: 0,
  });

  // Delete confirmation states
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);

  // Temporary filter values (before apply)
  const [tempNameFilter, setTempNameFilter] = useState("");
  const [tempTypeFilter, setTempTypeFilter] = useState<string>("all");
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all");
  const [tempDateFromFilter, setTempDateFromFilter] = useState("");
  const [tempDateToFilter, setTempDateToFilter] = useState("");
  const [tempComplianceFilter, setTempComplianceFilter] = useState<string>("all");

  // Applied filter values (after clicking apply)
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [complianceFilter, setComplianceFilter] = useState<string>("all");

  // Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [vehicleNameSuggestions, setVehicleNameSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#name-filter-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      // Check if there's a compliance filter from navigation
      const savedComplianceFilter = sessionStorage.getItem('vehicleComplianceFilter');

      if (savedComplianceFilter && savedComplianceFilter !== 'all') {
        console.log('Applying compliance filter from navigation:', savedComplianceFilter);
        setTempComplianceFilter(savedComplianceFilter);
        setComplianceFilter(savedComplianceFilter);
        setShowFilters(true);

        const filters: any = { compliance_filter: savedComplianceFilter };
        await loadData(filters);

        // Clear the saved filter after applying
        sessionStorage.removeItem('vehicleComplianceFilter');
      } else {
        await loadData();
      }
    };

    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async (filters?: {
    vehicle_name?: string;
    vehicle_type_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
    compliance_filter?: string;
  }) => {
    try {
      setLoading(true);
      console.log('Loading vehicles with filters:', filters);

      // Fetch data sequentially
      const vehiclesResponse = await vehicleService.getAll(filters);
      console.log('Vehicles loaded:', vehiclesResponse.data?.length || 0);
      setVehicles(vehiclesResponse.data || []);

      const typesResponse = await vehicleTypeService.getAll();
      setVehicleTypes(typesResponse.data || []);

      const statsResponse = await vehicleService.getStats(filters);
      console.log('Stats loaded:', statsResponse.data);
      setQuickStats(statsResponse.data || {
        total: 0,
        active: 0,
        maintenance: 0,
        inactive: 0,
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setVehicleToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      await vehicleService.delete(vehicleToDelete);
      toast.success("Vehicle deleted successfully!");
      // Refresh with current filters
      await applyFilters();
    } catch (error: any) {
      console.error("Failed to delete vehicle:", error);
      toast.error("Failed to delete vehicle", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setConfirmDeleteOpen(false);
      setVehicleToDelete(null);
    }
  };

  const handleBulkDeleteClick = () => {
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (selectedIds.length > 0) {
      setConfirmBulkDeleteOpen(true);
    }
  };

  const confirmBulkDelete = async () => {
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]).map(Number);

    if (selectedIds.length === 0) return;

    try {
      setLoading(true);
      await vehicleService.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} vehicle(s) deleted successfully!`);
      setSelectedRows({});
      // Refresh with current filters
      await applyFilters();
    } catch (error: any) {
      console.error("Failed to delete vehicles:", error);
      toast.error("Failed to delete some vehicles", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setLoading(false);
      setConfirmBulkDeleteOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary/15 text-primary border-primary/50";
      case "maintenance":
        return "bg-yellow-500/15 text-yellow-700 border-yellow-500/50";
      case "inactive":
        return "bg-gray-500/15 text-gray-700 border-gray-500/50";
      default:
        return "";
    }
  };

  const getVehicleName = (vehicle: Vehicle) => {
    // Find the 'name' field from field_values
    const nameField = vehicle.field_values?.find(fv =>
      fv.field?.key === 'name'
    );
    return nameField?.value || null;
  };


  // Handle name input change and fetch suggestions from backend
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (tempNameFilter.length >= 2) {
        try {
          const suggestions = await vehicleService.getNameSuggestions(tempNameFilter);
          setVehicleNameSuggestions(suggestions);
          setShowSuggestions(suggestions.length > 0);
          setSelectedSuggestionIndex(-1);
        } catch (error) {
          console.error('Failed to fetch vehicle name suggestions:', error);
          setVehicleNameSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
        setVehicleNameSuggestions([]);
        setSelectedSuggestionIndex(-1);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [tempNameFilter]);

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || vehicleNameSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < vehicleNameSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < vehicleNameSuggestions.length) {
        setTempNameFilter(vehicleNameSuggestions[selectedSuggestionIndex]);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const applyFilters = async () => {
    setShowSuggestions(false);

    // Update applied filter states
    setNameFilter(tempNameFilter);
    setTypeFilter(tempTypeFilter);
    setStatusFilter(tempStatusFilter);
    setDateFromFilter(tempDateFromFilter);
    setDateToFilter(tempDateToFilter);
    setComplianceFilter(tempComplianceFilter);

    // Build filter object for backend
    const filters: any = {};

    if (tempNameFilter) {
      filters.vehicle_name = tempNameFilter;
    }

    if (tempTypeFilter !== "all") {
      filters.vehicle_type_id = parseInt(tempTypeFilter);
    }

    if (tempStatusFilter !== "all") {
      filters.status = tempStatusFilter;
    }

    if (tempDateFromFilter) {
      filters.date_from = tempDateFromFilter;
    }

    if (tempDateToFilter) {
      filters.date_to = tempDateToFilter;
    }

    if (tempComplianceFilter !== "all") {
      filters.compliance_filter = tempComplianceFilter;
    }

    // Call backend API with filters
    await loadData(filters);
  };

  const clearFilters = async () => {
    // Clear temporary values
    setTempNameFilter("");
    setTempTypeFilter("all");
    setTempStatusFilter("all");
    setTempDateFromFilter("");
    setTempDateToFilter("");
    setTempComplianceFilter("all");

    // Clear applied values
    setNameFilter("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setComplianceFilter("all");

    setShowSuggestions(false);

    // Reload data without filters
    await loadData();
  };

  const hasActiveFilters = nameFilter || typeFilter !== "all" || statusFilter !== "all" || dateFromFilter || dateToFilter || complianceFilter !== "all";

  const columns: ColumnDef<Vehicle>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            const newSelectedRows: Record<string, boolean> = {};
            if (value) {
              table.getRowModel().rows.forEach((row) => {
                newSelectedRows[row.original.id] = true;
              });
            }
            setSelectedRows(newSelectedRows);
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows[row.original.id] || false}
          onCheckedChange={(value) => {
            setSelectedRows((prev) => ({
              ...prev,
              [row.original.id]: !!value,
            }));
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        return (
          <div className="font-medium text-muted-foreground">
            #{row.getValue("id")}
          </div>
        );
      },
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => {
        const vehicle = row.original;
        const name = getVehicleName(vehicle);
        return name ? (
          <div className="font-medium">{name}</div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: "vehicle_type.name",
      header: "Vehicle Type",
      cell: ({ row }) => {
        const typeName = row.original.vehicle_type?.name;
        return typeName ? (
          <Badge variant="outline" className="capitalize">
            {typeName}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Unknown</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <Badge className={getStatusColor(vehicle.status)} variant="outline">
            {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "compliance_score",
      header: "Compliance",
      cell: ({ row }) => (
        <div className="w-[60px]">
          <ComplianceScoreBadge score={row.original.compliance_score || 0} size="sm" showLabel={false} />
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created Date",
      cell: ({ row }) => {
        const createdAt = row.getValue("created_at") as string;
        if (!createdAt) return <span className="text-muted-foreground text-sm">-</span>;

        const date = new Date(createdAt);
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const vehicle = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/vehicles/${vehicle.id}`);
              }}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/vehicles/${vehicle.id}/edit`);
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
                handleDelete(vehicle.id);
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
        <PageLoading message="Loading vehicles..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Vehicles" }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
            <p className="text-muted-foreground mt-2">Manage your fleet vehicles</p>
          </div>
          <div className="flex items-center gap-2">
            {Object.values(selectedRows).filter(Boolean).length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDeleteClick}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({Object.values(selectedRows).filter(Boolean).length})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/vehicles/import")}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Vehicles
            </Button>
            <Button onClick={() => router.push("/dashboard/vehicles/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters ? 'Filtered results' : 'All vehicles'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.active}</div>
              <p className="text-xs text-muted-foreground">Currently operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.maintenance}</div>
              <p className="text-xs text-muted-foreground">Under maintenance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quickStats.inactive}</div>
              <p className="text-xs text-muted-foreground">Not in use</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Vehicles</CardTitle>
            <CardDescription>
              View and manage all vehicles in your fleet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters Section */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-9 px-3 hover:bg-muted"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="font-medium">Filters</span>
                    {showFilters ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                  {hasActiveFilters && (
                    <Badge variant="default" className="h-6">
                      {[nameFilter, typeFilter !== "all", statusFilter !== "all", dateFromFilter || dateToFilter, complianceFilter !== "all"].filter(Boolean).length} active
                    </Badge>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>

              <div
                className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                style={{ overflow: showFilters ? 'visible' : 'hidden' }}
              >
                <div className="p-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Name Filter */}
                    <div id="name-filter-container" className="space-y-2 relative">
                      <Label htmlFor="name-filter" className="text-sm font-medium">Vehicle Name</Label>
                      <Input
                        id="name-filter"
                        placeholder="Search by name..."
                        value={tempNameFilter}
                        onChange={(e) => setTempNameFilter(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                          if (tempNameFilter.length >= 2 && vehicleNameSuggestions.length > 0) {
                            setShowSuggestions(true);
                          }
                        }}
                        className="h-10"
                        autoComplete="off"
                      />
                      {showSuggestions && vehicleNameSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                          {vehicleNameSuggestions.map((name, index) => (
                            <div
                              key={index}
                              className={`px-3 py-2 cursor-pointer text-sm ${index === selectedSuggestionIndex
                                ? 'bg-accent'
                                : 'hover:bg-accent'
                                }`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setTempNameFilter(name);
                                setShowSuggestions(false);
                                setSelectedSuggestionIndex(-1);
                              }}
                              onMouseEnter={() => setSelectedSuggestionIndex(index)}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Type Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="type-filter" className="text-sm font-medium">Vehicle Type</Label>
                      <Select value={tempTypeFilter} onValueChange={setTempTypeFilter}>
                        <SelectTrigger id="type-filter" className="h-10">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="status-filter" className="text-sm font-medium">Status</Label>
                      <Select value={tempStatusFilter} onValueChange={setTempStatusFilter}>
                        <SelectTrigger id="status-filter" className="h-10">
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Compliance Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="compliance-filter" className="text-sm font-medium">Compliance</Label>
                      <Select value={tempComplianceFilter} onValueChange={setTempComplianceFilter}>
                        <SelectTrigger id="compliance-filter" className="h-10">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="at_risk">At Risk</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="expiring">Expiring Soon</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Date Range Filter - Separate Row */}
                  <div className="flex gap-4">
                    <div className="space-y-2 w-64">
                      <Label className="text-sm font-medium">Created Date From</Label>
                      <DatePicker
                        value={tempDateFromFilter}
                        onChange={(date) => setTempDateFromFilter(date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Select start date"
                        className="h-10 w-full"
                      />
                    </div>

                    <div className="space-y-2 w-64">
                      <Label className="text-sm font-medium">Created Date To</Label>
                      <DatePicker
                        value={tempDateToFilter}
                        onChange={(date) => setTempDateToFilter(date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Select end date"
                        className="h-10 w-full"
                        fromDate={tempDateFromFilter ? new Date(tempDateFromFilter) : undefined}
                      />
                    </div>
                  </div>

                  {/* Apply and Clear Buttons */}
                  <div className="pt-6 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {hasActiveFilters && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{vehicles.length}</span>
                          <span>vehicles found</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters && !tempNameFilter && tempTypeFilter === "all" && tempStatusFilter === "all" && !tempDateFromFilter && !tempDateToFilter && tempComplianceFilter === "all"}
                        className="h-10 px-4"
                      >
                        Reset Filters
                      </Button>
                      <Button
                        onClick={applyFilters}
                        className="h-10 px-6"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DataTable */}
            <DataTable
              columns={columns}
              data={vehicles}
              searchKey="id"
              searchPlaceholder="Search by ID..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={confirmBulkDeleteOpen} onOpenChange={setConfirmBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {Object.values(selectedRows).filter(Boolean).length} vehicle(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {Object.values(selectedRows).filter(Boolean).length} vehicle(s) and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
