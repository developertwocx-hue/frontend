"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { vehicleService, vehicleTypeService, Vehicle, VehicleType } from "@/lib/vehicles";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Pencil, Trash2, Plus, FileText, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { PageLoading } from "@/components/ui/loading-overlay";

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(true);

  // Temporary filter values (before apply)
  const [tempNameFilter, setTempNameFilter] = useState("");
  const [tempTypeFilter, setTempTypeFilter] = useState<string>("all");
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all");
  const [tempDateFromFilter, setTempDateFromFilter] = useState("");
  const [tempDateToFilter, setTempDateToFilter] = useState("");

  // Applied filter values (after clicking apply)
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

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
    loadData();
  }, []);

  const loadData = async (filters?: {
    vehicle_name?: string;
    vehicle_type_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    try {
      setLoading(true);
      const [vehiclesResponse, typesResponse] = await Promise.all([
        vehicleService.getAll(filters),
        vehicleTypeService.getAll(),
      ]);
      setVehicles(vehiclesResponse.data || []);
      setVehicleTypes(typesResponse.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await vehicleService.delete(id);
      // Refresh with current filters
      await applyFilters();
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary/20 text-primary border-primary/50";
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/50";
      case "inactive":
        return "bg-gray-500/20 text-gray-700 border-gray-500/50";
      case "sold":
        return "bg-blue-500/20 text-blue-700 border-blue-500/50";
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

    // Clear applied values
    setNameFilter("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFromFilter("");
    setDateToFilter("");

    setShowSuggestions(false);

    // Reload data without filters
    await loadData();
  };

  const hasActiveFilters = nameFilter || typeFilter !== "all" || statusFilter !== "all" || dateFromFilter || dateToFilter;

  const columns: ColumnDef<Vehicle>[] = [
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
        const status = row.getValue("status") as string;
        return (
          <Badge className={`${getStatusColor(status)} capitalize`}>
            {status}
          </Badge>
        );
      },
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
                router.push(`/dashboard/vehicles/${vehicle.id}/documents`);
              }}
              title="Manage Documents"
            >
              <FileText className="h-4 w-4" />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
            <p className="text-muted-foreground mt-2">Manage your fleet vehicles</p>
          </div>
          <Button onClick={() => router.push("/dashboard/vehicles/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
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
                      {[nameFilter, typeFilter !== "all", statusFilter !== "all", dateFromFilter || dateToFilter].filter(Boolean).length} active
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Name Filter */}
                <div id="name-filter-container" className="space-y-2 relative">
                  <Label htmlFor="name-filter">Vehicle Name</Label>
                  <Input
                    id="name-filter"
                    placeholder="Vehicle Name"
                    value={tempNameFilter}
                    onChange={(e) => setTempNameFilter(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (tempNameFilter.length >= 2 && vehicleNameSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="h-9"
                    autoComplete="off"
                  />
                  {showSuggestions && vehicleNameSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {vehicleNameSuggestions.map((name, index) => (
                        <div
                          key={index}
                          className={`px-3 py-2 cursor-pointer text-sm ${
                            index === selectedSuggestionIndex
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
                  <p className="text-xs text-muted-foreground">
                    Search by vehicle name
                  </p>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <Label htmlFor="type-filter">Vehicle Type</Label>
                  <Select value={tempTypeFilter} onValueChange={setTempTypeFilter}>
                    <SelectTrigger id="type-filter" className="h-9">
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
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={tempStatusFilter} onValueChange={setTempStatusFilter}>
                    <SelectTrigger id="status-filter" className="h-9">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <Label>Created Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={tempDateFromFilter}
                      onChange={(e) => setTempDateFromFilter(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="From"
                    />
                    <Input
                      type="date"
                      value={tempDateToFilter}
                      onChange={(e) => setTempDateToFilter(e.target.value)}
                      className="h-9 text-xs"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>

              {/* Apply and Clear Buttons */}
              <div className="pt-4 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters && (
                    <>
                      Showing <span className="font-medium text-foreground">{vehicles.length}</span> vehicles
                    </>
                  )}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters && !tempNameFilter && tempTypeFilter === "all" && tempStatusFilter === "all" && !tempDateFromFilter && !tempDateToFilter}
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
    </DashboardLayout>
  );
}
