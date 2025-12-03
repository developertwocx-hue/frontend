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
import { Truck, ChevronRight } from "lucide-react";

export default function VehicleTypesPage() {
  const router = useRouter();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
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
    fetchVehicleTypes();
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
    router.push(`/dashboard/vehicle-types/${typeId}/vehicles`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
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
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>View vehicles</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}

          {vehicleTypes.length === 0 && !loading && (
            <Card className="col-span-full border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
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
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingType ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
