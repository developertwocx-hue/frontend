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
import { Truck, ChevronRight, Settings, Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageLoading } from "@/components/ui/loading-overlay";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { toast } from "sonner";
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

export default function VehicleTypesPage() {
  const router = useRouter();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [deletingType, setDeletingType] = useState<VehicleType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
        toast.success("Vehicle type updated successfully!");
      } else {
        await vehicleTypeService.create(data);
        toast.success("Vehicle type created successfully!");
      }
      setDialogOpen(false);
      fetchVehicleTypes();
      reset();
    } catch (error: any) {
      console.error("Failed to save vehicle type:", error);
      toast.error(
        editingType ? "Failed to update vehicle type" : "Failed to create vehicle type",
        {
          description: error.response?.data?.message || "Please try again",
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (type: VehicleType, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingType(type);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingType) return;

    try {
      setDeleting(true);
      await vehicleTypeService.delete(deletingType.id);
      toast.success("Vehicle type deleted successfully!");
      setDeleteDialogOpen(false);
      setDeletingType(null);
      fetchVehicleTypes();
    } catch (error: any) {
      console.error("Failed to delete vehicle type:", error);
      toast.error("Failed to delete vehicle type", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (type: VehicleType, e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpenDialog(type);
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
              className="hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer group relative"
              onClick={() => handleCardClick(type.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                          {type.name}
                        </CardTitle>
                        {!type.tenant_id && (
                          <Badge variant="outline" className="text-xs">
                            Global
                          </Badge>
                        )}
                      </div>
                      {type.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {type.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge
                      variant={type.is_active ? "default" : "secondary"}
                      className={type.is_active ? "bg-primary/20 text-primary border-primary/50" : ""}
                    >
                      {type.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                {type.tenant_id && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEdit(type, e)}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleOpenDeleteDialog(type, e)}
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vehicle type "{deletingType?.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
