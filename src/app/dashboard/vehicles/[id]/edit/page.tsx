"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleService, vehicleTypeService, vehicleTypeFieldService, Vehicle, VehicleType, VehicleTypeField, VehicleFieldValue } from "@/lib/vehicles";
import { ChevronLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingOverlay, PageLoading } from "@/components/ui/loading-overlay";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = parseInt(params?.id as string);
  const { setCustomLabel } = useBreadcrumb();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [fields, setFields] = useState<VehicleTypeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch vehicle
        const vehicleResponse = await vehicleService.getOne(vehicleId);
        const vehicleData = vehicleResponse.data;
        setVehicle(vehicleData);

        // Set status
        setValue('status', vehicleData.status);

        // Fetch fields for this vehicle type
        const fieldsResponse = await vehicleTypeFieldService.getForType(vehicleData.vehicle_type_id);
        setFields(fieldsResponse.data || []);

        // Pre-populate field values
        vehicleData.field_values?.forEach((fv: VehicleFieldValue) => {
          if (fv.field) {
            setValue(`field_${fv.field.key}`, fv.value);
          }
        });

        // Set custom breadcrumb label with vehicle name
        const nameField = vehicleData.field_values?.find((fv: any) =>
          fv.field && fv.field.key && fv.field.key.toLowerCase() === 'name'
        );
        const vehicleName = nameField?.value || vehicleData.field_values?.find((fv: any) =>
          fv.field && fv.field.name && fv.field.name.toLowerCase() === 'name'
        )?.value || `Vehicle #${vehicleData.id}`;
        setCustomLabel(`/dashboard/vehicles/${vehicleId}`, vehicleName);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchData();
    }
  }, [vehicleId, setValue]);

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);

      // Build field_values object
      const fieldValues: Record<string, any> = {};
      fields.forEach((field) => {
        const value = data[`field_${field.key}`];
        if (value !== undefined && value !== '') {
          fieldValues[field.key] = value;
        }
      });

      // Update vehicle
      await vehicleService.update(vehicleId, {
        status: data.status,
        field_values: fieldValues,
      });

      router.push(`/dashboard/vehicles/${vehicleId}`);
    } catch (error) {
      console.error("Failed to update vehicle:", error);
      alert("Failed to update vehicle. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading message="Loading vehicle data..." />
      </DashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <h2 className="text-2xl font-bold">Vehicle Not Found</h2>
          <Button onClick={() => router.push("/dashboard/vehicles")}>
            Back to Vehicles
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Get vehicle name from field_values for display
  const nameField = vehicle.field_values?.find((fv: any) =>
    fv.field && fv.field.key && fv.field.key.toLowerCase() === 'name'
  );
  const vehicleName = nameField?.value || vehicle.field_values?.find((fv: any) =>
    fv.field && fv.field.name && fv.field.name.toLowerCase() === 'name'
  )?.value || `Vehicle #${vehicle.id}`;

  return (
    <DashboardLayout>
      <div className="relative space-y-6">
        <LoadingOverlay isLoading={submitting} message="Updating vehicle..." />

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            disabled={submitting}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit {vehicleName}</h1>
            <p className="text-muted-foreground mt-1">
              {vehicle.vehicle_type?.name || "Unknown Type"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={`field_${field.key}`}>
                      {field.name}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                      {field.unit && <span className="text-muted-foreground ml-1">({field.unit})</span>}
                    </Label>

                    {field.field_type === 'text' && (
                      <Input
                        id={`field_${field.key}`}
                        {...register(`field_${field.key}`, { required: field.is_required })}
                        placeholder={field.description || field.name}
                      />
                    )}

                    {field.field_type === 'number' && (
                      <Input
                        id={`field_${field.key}`}
                        type="number"
                        step="0.01"
                        {...register(`field_${field.key}`, { required: field.is_required })}
                        placeholder={field.description || field.name}
                      />
                    )}

                    {field.field_type === 'date' && (
                      <Input
                        id={`field_${field.key}`}
                        type="date"
                        {...register(`field_${field.key}`, { required: field.is_required })}
                      />
                    )}

                    {field.field_type === 'textarea' && (
                      <Textarea
                        id={`field_${field.key}`}
                        {...register(`field_${field.key}`, { required: field.is_required })}
                        placeholder={field.description || field.name}
                        rows={3}
                      />
                    )}

                    {field.field_type === 'select' && field.options && (
                      <Select
                        value={watch(`field_${field.key}`)}
                        onValueChange={(value) => setValue(`field_${field.key}`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(field.options).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label as string}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.field_type === 'boolean' && (
                      <Select
                        value={watch(`field_${field.key}`)}
                        onValueChange={(value) => setValue(`field_${field.key}`, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Yes</SelectItem>
                          <SelectItem value="0">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update Vehicle"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
