"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { vehicleService, vehicleTypeService, Vehicle, VehicleType } from "@/lib/vehicles";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Pencil, Trash2, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageLoading } from "@/components/ui/loading-overlay";

export default function VehiclesByTypePage() {
  const params = useParams();
  const router = useRouter();
  const vehicleTypeId = Number(params.id);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch vehicle type details
      const typeResponse = await vehicleTypeService.getAll();
      const type = typeResponse.data?.find((t: VehicleType) => t.id === vehicleTypeId);
      setVehicleType(type || null);

      // Fetch all vehicles and filter by type
      const vehiclesResponse = await vehicleService.getAll();
      const filteredVehicles = (vehiclesResponse.data || []).filter(
        (v: Vehicle) => v.vehicle_type_id === vehicleTypeId
      );
      setVehicles(filteredVehicles);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch vehicle type details
        const typeResponse = await vehicleTypeService.getAll();
        const type = typeResponse.data?.find((t: VehicleType) => t.id === vehicleTypeId);

        // Fetch all vehicles and filter by type
        const vehiclesResponse = await vehicleService.getAll();
        const filteredVehicles = (vehiclesResponse.data || []).filter(
          (v: Vehicle) => v.vehicle_type_id === vehicleTypeId
        );

        if (isMounted) {
          setVehicleType(type || null);
          setVehicles(filteredVehicles);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch data:", error);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [vehicleTypeId]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await vehicleService.delete(id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete vehicle:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
      case 'sold':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      default:
        return '';
    }
  };

  const columns: ColumnDef<Vehicle>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/vehicle-types')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {vehicleType?.name || "Vehicle Type"} Vehicles
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage vehicles of type: {vehicleType?.name}
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/dashboard/vehicles/create?type=${vehicleTypeId}`)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vehicle
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={vehicles}
          searchKey="id"
          searchPlaceholder="Search by ID..."
        />
      </div>
    </DashboardLayout>
  );
}
