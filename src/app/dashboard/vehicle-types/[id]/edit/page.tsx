"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  vehicleTypeService,
  vehicleTypeFieldService,
  VehicleType,
  VehicleTypeField,
} from "@/lib/vehicles";
import { ChevronLeft, Plus, Pencil, Trash2, AlertCircle, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageLoading } from "@/components/ui/loading-overlay";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";

export default function EditVehicleTypePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleTypeId = parseInt(params?.id as string);

  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [fields, setFields] = useState<VehicleTypeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<VehicleTypeField | null>(null);
  const [viewingField, setViewingField] = useState<VehicleTypeField | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);

  const {
    register: registerField,
    handleSubmit: handleFieldSubmit,
    setValue: setFieldValue,
    watch: watchField,
    reset: resetField,
  } = useForm();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!vehicleTypeId) return;

      try {
        setLoading(true);

        // Fetch vehicle type
        const typeResponse = await vehicleTypeService.getOne(vehicleTypeId);

        // Fetch fields (default + custom)
        const fieldsResponse = await vehicleTypeFieldService.getForType(vehicleTypeId, true);

        if (isMounted) {
          setVehicleType(typeResponse.data);
          setFields(fieldsResponse.data || []);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch data:", error);
          setError("Failed to load vehicle type data");
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [vehicleTypeId]);

  const handleOpenFieldDialog = (field?: VehicleTypeField) => {
    if (field) {
      setEditingField(field);
      setFieldValue("name", field.name);
      setFieldValue("key", field.key);
      setFieldValue("field_type", field.field_type);
      setFieldValue("unit", field.unit || "");
      setFieldValue("description", field.description || "");
      setFieldValue("is_required", field.is_required);
      setFieldValue("sort_order", field.sort_order);

      // Handle options for select fields
      if (field.field_type === "select" && field.options) {
        const optionsString = Object.entries(field.options)
          .map(([key, value]) => `${key}:${value}`)
          .join("\n");
        setFieldValue("options", optionsString);
      }
    } else {
      setEditingField(null);
      resetField({
        name: "",
        key: "",
        field_type: "text",
        unit: "",
        description: "",
        is_required: false,
        sort_order: 100,
        options: "",
      });
    }
    setFieldDialogOpen(true);
  };

  const handleViewField = (field: VehicleTypeField) => {
    setViewingField(field);
    setViewDialogOpen(true);
  };

  const handleSaveField = async (data: any) => {
    try {
      setSavingField(true);
      // Parse options if field type is select
      let options: Record<string, string> | null = null;
      if (data.field_type === "select" && data.options) {
        options = {};
        const lines = data.options.split("\n").filter((line: string) => line.trim());
        lines.forEach((line: string) => {
          const [key, value] = line.split(":").map((s: string) => s.trim());
          if (key && value && options) {
            options[key] = value;
          }
        });
      }

      const fieldData = {
        vehicle_type_id: vehicleTypeId,
        name: data.name,
        key: data.key,
        field_type: data.field_type,
        unit: data.unit || null,
        description: data.description || null,
        is_required: data.is_required || false,
        sort_order: parseInt(data.sort_order) || 100,
        options,
      };

      if (editingField) {
        await vehicleTypeFieldService.update(editingField.id, fieldData);
      } else {
        await vehicleTypeFieldService.create(fieldData);
      }

      // Refresh fields
      const fieldsResponse = await vehicleTypeFieldService.getForType(vehicleTypeId, true);
      setFields(fieldsResponse.data || []);

      setFieldDialogOpen(false);
      resetField();
    } catch (error: any) {
      console.error("Failed to save field:", error);
      alert(error.response?.data?.message || "Failed to save field");
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!confirm("Are you sure you want to delete this field?")) return;

    try {
      await vehicleTypeFieldService.delete(fieldId);

      // Refresh fields
      const fieldsResponse = await vehicleTypeFieldService.getForType(vehicleTypeId, true);
      setFields(fieldsResponse.data || []);
    } catch (error: any) {
      console.error("Failed to delete field:", error);
      alert(error.response?.data?.message || "Failed to delete field");
    }
  };

  // Define columns for DataTable
  const columns: ColumnDef<VehicleTypeField>[] = [
    {
      accessorKey: "name",
      header: "Field Name",
      cell: ({ row }) => {
        const field = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{field.name}</span>
            {field.is_required && (
              <span className="text-destructive text-xs">*</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "key",
      header: "Key",
      cell: ({ row }) => {
        return (
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {row.getValue("key")}
          </code>
        );
      },
    },
    {
      accessorKey: "field_type",
      header: "Type",
      cell: ({ row }) => {
        return (
          <Badge variant="outline" className="capitalize">
            {row.getValue("field_type")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => {
        const unit = row.getValue("unit") as string;
        return unit ? (
          <Badge variant="secondary" className="text-xs">
            {unit}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        );
      },
    },
    {
      accessorKey: "tenant_id",
      header: "Source",
      cell: ({ row }) => {
        const isCustom = row.getValue("tenant_id") !== null;
        return (
          <Badge
            variant={isCustom ? "default" : "secondary"}
            className={isCustom ? "bg-primary/20 text-primary border-primary/50" : ""}
          >
            {isCustom ? "Custom" : "Default"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sort_order",
      header: "Order",
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {row.getValue("sort_order")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const field = row.original;
        const isDefault = field.tenant_id === null;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewField(field)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!isDefault && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenFieldDialog(field)}
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteField(field.id)}
                  className="hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {isDefault && (
              <span className="text-xs text-muted-foreground px-2">Read-only</span>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading message="Loading vehicle type data..." />
      </DashboardLayout>
    );
  }

  if (!vehicleType) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <h2 className="text-2xl font-bold">Vehicle Type Not Found</h2>
          <Button onClick={() => router.push("/dashboard/vehicle-types")}>
            Back to Vehicle Types
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Fields</h1>
              <p className="text-muted-foreground mt-1">{vehicleType.name}</p>
            </div>
          </div>
          <Button onClick={() => handleOpenFieldDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Fields Configuration</CardTitle>
            <CardDescription>
              Manage default and custom fields for {vehicleType.name} vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={fields}
              searchKey="name"
              searchPlaceholder="Search fields..."
            />
          </CardContent>
        </Card>
      </div>

      {/* Field Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleFieldSubmit(handleSaveField)}>
            <DialogHeader>
              <DialogTitle>
                {editingField ? "Edit Custom Field" : "Add Custom Field"}
              </DialogTitle>
              <DialogDescription>
                {editingField
                  ? "Update the custom field details"
                  : "Add a new custom field for this vehicle type"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="field_name">Field Name *</Label>
                  <Input
                    id="field_name"
                    {...registerField("name", { required: true })}
                    placeholder="e.g., License Plate, Color"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_key">Field Key *</Label>
                  <Input
                    id="field_key"
                    {...registerField("key", {
                      required: true,
                      pattern: /^[a-z0-9_]+$/,
                    })}
                    placeholder="e.g., license_plate, color"
                    disabled={!!editingField}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and underscores only
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="field_type">Field Type *</Label>
                  <Select
                    value={watchField("field_type")}
                    onValueChange={(value) => setFieldValue("field_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="select">Select (Dropdown)</SelectItem>
                      <SelectItem value="boolean">Boolean (Yes/No)</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit (optional)</Label>
                  <Input
                    id="unit"
                    {...registerField("unit")}
                    placeholder="e.g., kg, meters, hours"
                  />
                </div>
              </div>

              {watchField("field_type") === "select" && (
                <div className="space-y-2">
                  <Label htmlFor="options">Options (one per line) *</Label>
                  <Textarea
                    id="options"
                    {...registerField("options")}
                    placeholder="key:Label&#10;red:Red&#10;blue:Blue&#10;green:Green"
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: key:Label (e.g., red:Red, blue:Blue)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="field_description">Description (optional)</Label>
                <Textarea
                  id="field_description"
                  {...registerField("description")}
                  placeholder="Additional information about this field..."
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    {...registerField("sort_order")}
                    placeholder="100"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="is_required"
                    {...registerField("is_required")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_required" className="cursor-pointer">
                    Required field
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFieldDialogOpen(false)}
                disabled={savingField}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingField}>
                {savingField ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {editingField ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  editingField ? "Update Field" : "Add Field"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Field Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Field Details</DialogTitle>
            <DialogDescription>
              View detailed information about this field
            </DialogDescription>
          </DialogHeader>
          {viewingField && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Field Name</Label>
                  <p className="font-medium">{viewingField.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Field Key</Label>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {viewingField.key}
                  </code>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Field Type</Label>
                    <Badge variant="outline" className="capitalize">
                      {viewingField.field_type}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Unit</Label>
                    {viewingField.unit ? (
                      <Badge variant="secondary">{viewingField.unit}</Badge>
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </div>
                </div>
                {viewingField.description && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Description</Label>
                    <p className="text-sm">{viewingField.description}</p>
                  </div>
                )}
                {viewingField.field_type === "select" && viewingField.options && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Options</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(viewingField.options).map(([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {key}: {value as string}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Required</Label>
                    <p className="text-sm">
                      {viewingField.is_required ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Sort Order</Label>
                    <p className="text-sm">{viewingField.sort_order}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">Source</Label>
                    <Badge
                      variant={viewingField.tenant_id ? "default" : "secondary"}
                      className={viewingField.tenant_id ? "bg-primary/20 text-primary border-primary/50" : ""}
                    >
                      {viewingField.tenant_id ? "Custom" : "Default"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
