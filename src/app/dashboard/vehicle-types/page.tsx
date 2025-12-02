"use client";

import { useEffect, useState } from "react";
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

export default function VehicleTypesPage() {
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
            <Card key={type.id} className="hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">
                      {type.name}
                    </CardTitle>
                    {type.description && (
                      <CardDescription className="mt-2">
                        {type.description}
                      </CardDescription>
                    )}
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(type)}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="flex-1 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </Button>
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
