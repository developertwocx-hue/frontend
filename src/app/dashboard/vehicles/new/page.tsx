"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  vehicleService,
  vehicleTypeService,
  vehicleTypeFieldService,
  VehicleType,
  VehicleTypeField,
} from "@/lib/vehicles";
import { ChevronLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingOverlay, PageLoading } from "@/components/ui/loading-overlay";

export default function NewVehiclePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedTypeId = searchParams.get("type");

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [fields, setFields] = useState<VehicleTypeField[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState(preSelectedTypeId || "");
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      status: "active",
    },
  });

  // Fetch vehicle types
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

  // Fetch fields when vehicle type is selected
  useEffect(() => {
    const fetchFields = async () => {
      if (!selectedTypeId) {
        setFields([]);
        setLoadingFields(false);
        return;
      }

      try {
        setLoadingFields(true);
        const response = await vehicleTypeFieldService.getForType(
          parseInt(selectedTypeId),
          true
        );
        setFields(response.data || []);
      } catch (error) {
        console.error("Failed to fetch fields:", error);
      } finally {
        setLoadingFields(false);
      }
    };

    fetchFields();
  }, [selectedTypeId]);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    setError(null);

    try {
      // Build field_values object
      const fieldValues: Record<string, any> = {};
      fields.forEach((field) => {
        const value = data[`field_${field.key}`];
        if (value !== undefined && value !== "") {
          fieldValues[field.key] = value;
        }
      });

      await vehicleService.create({
        vehicle_type_id: parseInt(selectedTypeId),
        status: data.status,
        field_values: fieldValues,
      });

      router.push("/dashboard/vehicles");
    } catch (error: any) {
      console.error("Failed to create vehicle:", error);
      setError(error.response?.data?.message || "Failed to create vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  // Sort fields by sort_order
  const sortedFields = [...fields].sort((a, b) => a.sort_order - b.sort_order);

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading message="Loading vehicle form..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative space-y-6">
        <LoadingOverlay isLoading={submitting} message="Creating vehicle..." />

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} disabled={submitting}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Vehicle</h1>
            <p className="text-muted-foreground mt-1">
              Fill in the vehicle details below
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Vehicle Type and Status */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Select vehicle type and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type_id">Vehicle Type *</Label>
                  <Select
                    value={selectedTypeId}
                    onValueChange={(value) => {
                      setSelectedTypeId(value);
                      setValue("vehicle_type_id", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedTypeId && (
                    <p className="text-sm text-muted-foreground">
                      Select a vehicle type to see available fields
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value) => setValue("status", value)}
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

          {/* Loading Fields */}
          {selectedTypeId && loadingFields && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="text-sm font-medium text-muted-foreground mt-4 animate-pulse">
                  Loading vehicle type fields...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Fields - All Fields Combined */}
          {selectedTypeId && !loadingFields && sortedFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Information</CardTitle>
                <CardDescription>
                  Fill in the vehicle details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sortedFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`field_${field.key}`}>
                        {field.name}
                        {field.is_required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                        {field.unit && (
                          <span className="text-muted-foreground ml-1">
                            ({field.unit})
                          </span>
                        )}
                      </Label>

                      {/* Text Field */}
                      {field.field_type === "text" && (
                        <Input
                          id={`field_${field.key}`}
                          {...register(`field_${field.key}`, {
                            required: field.is_required,
                          })}
                          placeholder={field.description || field.name}
                        />
                      )}

                      {/* Number Field */}
                      {field.field_type === "number" && (
                        <Input
                          id={`field_${field.key}`}
                          type="number"
                          step="0.01"
                          {...register(`field_${field.key}`, {
                            required: field.is_required,
                            valueAsNumber: true,
                          })}
                          placeholder={field.description || field.name}
                        />
                      )}

                      {/* Date Field */}
                      {field.field_type === "date" && (
                        <Input
                          id={`field_${field.key}`}
                          type="date"
                          {...register(`field_${field.key}`, {
                            required: field.is_required,
                          })}
                        />
                      )}

                      {/* Textarea Field */}
                      {field.field_type === "textarea" && (
                        <Textarea
                          id={`field_${field.key}`}
                          {...register(`field_${field.key}`, {
                            required: field.is_required,
                          })}
                          placeholder={field.description || field.name}
                          rows={3}
                        />
                      )}

                      {/* Select Field */}
                      {field.field_type === "select" && field.options && (
                        <Select
                          value={watch(`field_${field.key}`)}
                          onValueChange={(value) =>
                            setValue(`field_${field.key}`, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select ${field.name}`}
                            />
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

                      {/* Boolean Field */}
                      {field.field_type === "boolean" && (
                        <Select
                          value={watch(`field_${field.key}`)}
                          onValueChange={(value) =>
                            setValue(`field_${field.key}`, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select ${field.name}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Yes</SelectItem>
                            <SelectItem value="0">No</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {field.description && (
                        <p className="text-xs text-muted-foreground">
                          {field.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No fields message */}
          {selectedTypeId && !loadingFields && fields.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Fields Configured</h3>
                <p className="text-sm text-muted-foreground text-center">
                  This vehicle type has no fields configured yet.
                  <br />
                  Contact your administrator to add fields.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedTypeId}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Vehicle"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
