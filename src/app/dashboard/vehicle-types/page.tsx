"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { vehicleTypeService, VehicleType } from "@/lib/vehicles";
import { useForm } from "react-hook-form";
import { Truck, ChevronRight, Settings, Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageLoading } from "@/components/ui/loading-overlay";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function VehicleTypesPage() {
  const router = useRouter();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchVehicleTypes = async () => {
    try {
      const response = await vehicleTypeService.getAll();
      setVehicleTypes(response.data || []);
    } catch (error) {
      console.error("Failed to fetch vehicle types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await vehicleTypeService.getAll();
        if (isMounted) {
          setVehicleTypes(response.data || []);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch vehicle types:", error);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenDialog = (type?: VehicleType) => {
    if (type) {
      setEditingType(type);
      setValue("name", type.name);
      setValue("description", type.description);
    } else {
      setEditingType(null);
      reset();
    }
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      setSubmitting(true);
      if (editingType) {
        await vehicleTypeService.update(editingType.id, data);
      } else {
        await vehicleTypeService.create(data);
      }
      setDialogOpen(false);
      fetchVehicleTypes();
      reset();
    } catch (error) {
      console.error("Failed to save vehicle type:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this vehicle type?")) return;

    try {
      await vehicleTypeService.delete(id);
      fetchVehicleTypes();
    } catch (error) {
      console.error("Failed to delete vehicle type:", error);
    }
  };

  const handleCardClick = (typeId: number) => {
    router.push(`/dashboard/vehicle-types/${typeId}/edit`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading message="Loading vehicle types..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Vehicle Types" }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Vehicle Types
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage vehicle types for your fleet
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle Type
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicleTypes.map((type) => (
            <Card
              key={type.id}
              className="hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => handleCardClick(type.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {type.name}
                      </CardTitle>
                      {type.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {type.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={type.is_active ? "default" : "secondary"}
                    className={type.is_active ? "bg-primary/20 text-primary border-primary/50" : ""}
                  >
                    {type.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}

          {vehicleTypes.length === 0 && (
            <Card className="col-span-full border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Truck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No vehicle types yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Get started by creating your first vehicle type
                </p>
                <Button onClick={() => handleOpenDialog()}>
                  Add Vehicle Type
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit(handleSave)}>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingType ? "Edit Vehicle Type" : "Add Vehicle Type"}
              </DialogTitle>
              <DialogDescription>
                {editingType
                  ? "Update the vehicle type details"
                  : "Add a new vehicle type to your fleet"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Mobile Crane, Tower Crane"
                  {...register("name", { required: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the vehicle type..."
                  rows={3}
                  {...register("description")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {editingType ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editingType ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
