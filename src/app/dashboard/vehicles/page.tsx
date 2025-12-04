"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { vehicleService, Vehicle } from "@/lib/vehicles";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Pencil, Trash2, Plus } from "lucide-react";
import { PageLoading } from "@/components/ui/loading-overlay";

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicles = async () => {
      try {
        const response = await vehicleService.getAll();
        if (isMounted) {
          setVehicles(response.data || []);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch vehicles:", error);
          setLoading(false);
        }
      }
    };

    fetchVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await vehicleService.delete(id);
      // Refresh the list
      const response = await vehicleService.getAll();
      setVehicles(response.data || []);
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
          <CardContent>
            <DataTable
              columns={columns}
              data={vehicles}
              searchKey="id"
              searchPlaceholder="Search vehicles..."
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
