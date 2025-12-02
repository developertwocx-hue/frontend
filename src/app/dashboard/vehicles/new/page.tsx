"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, vehicleTypeService, VehicleType } from "@/lib/vehicles";

export default function NewVehiclePage() {
  const router = useRouter();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const response = await vehicleTypeService.getAll();
        setVehicleTypes(response.data || []);
      } catch (error) {
        console.error("Failed to fetch vehicle types:", error);
      }
    };
    fetchVehicleTypes();
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await vehicleService.create({
        ...data,
        vehicle_type_id: selectedTypeId,
      });
      router.push("/dashboard/vehicles");
    } catch (error) {
      console.error("Failed to create vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Add New Vehicle
            </h1>
            <p className="text-muted-foreground mt-1">Fill in the details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vehicle Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Crane #1"
                    {...register("name", { required: true })}
                  />
                  {errors.name && <p className="text-sm text-destructive">Name is required</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_type_id">Vehicle Type *</Label>
                  <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="make">Make/Manufacturer</Label>
                  <Input id="make" placeholder="e.g., Caterpillar" {...register("make")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" placeholder="e.g., 320D" {...register("model")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" placeholder="2024" {...register("year")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_number">Registration Number</Label>
                  <Input id="registration_number" placeholder="ABC-1234" {...register("registration_number")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vin">VIN</Label>
                  <Input id="vin" placeholder="Vehicle Identification Number" {...register("vin")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input id="serial_number" placeholder="Serial Number" {...register("serial_number")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input id="capacity" type="number" step="0.01" placeholder="50" {...register("capacity")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity_unit">Capacity Unit</Label>
                  <Select defaultValue="tons" {...register("capacity_unit")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="lbs">Pounds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="specifications">Specifications</Label>
                  <Textarea
                    id="specifications"
                    rows={3}
                    placeholder="Additional specifications..."
                    {...register("specifications")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue="active" {...register("status")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input id="purchase_date" type="date" {...register("purchase_date")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price</Label>
                  <Input id="purchase_price" type="number" step="0.01" placeholder="50000" {...register("purchase_price")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_service_date">Last Service Date</Label>
                  <Input id="last_service_date" type="date" {...register("last_service_date")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="next_service_date">Next Service Date</Label>
                  <Input id="next_service_date" type="date" {...register("next_service_date")} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" rows={3} placeholder="Additional notes..." {...register("notes")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Vehicle"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
