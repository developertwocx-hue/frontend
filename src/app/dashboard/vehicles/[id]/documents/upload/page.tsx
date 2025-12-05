"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  createVehicleDocument,
  getDocumentTypesForVehicle,
  type DocumentType,
  type CreateDocumentData,
} from "@/lib/api/vehicleDocuments";
import api from "@/lib/api";
import { vehicleService, type Vehicle } from "@/lib/vehicles";
import { Upload, FileText, ChevronLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UploadDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = parseInt(params?.id as string);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCreateTypeDialog, setShowCreateTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [creatingType, setCreatingType] = useState(false);

  const form = useForm<CreateDocumentData>({
    defaultValues: {
      vehicle_id: vehicleId,
      document_name: "",
      document_number: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (vehicleId) {
      loadData();
    }
  }, [vehicleId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingTypes(true);
      const [vehicleResponse, types] = await Promise.all([
        vehicleService.getOne(vehicleId),
        getDocumentTypesForVehicle(vehicleId),
      ]);
      setVehicle(vehicleResponse.data);
      setDocumentTypes(types);
    } catch (error: any) {
      toast.error("Failed to load data", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setLoading(false);
      setLoadingTypes(false);
    }
  };

  const getVehicleName = () => {
    if (!vehicle?.field_values) return `Vehicle #${vehicleId}`;
    const nameField = vehicle.field_values.find((fv) => fv.field?.key === "name");
    return nameField?.value || `Vehicle #${vehicleId}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 10MB",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCreateDocumentType = async () => {
    if (!newTypeName.trim()) {
      toast.error("Please enter a document type name");
      return;
    }

    try {
      setCreatingType(true);
      const response = await api.post("/document-types", {
        name: newTypeName,
        description: newTypeDescription,
        vehicle_type_id: vehicle?.vehicle_type_id || null,
        is_required: false,
        sort_order: 100,
      });

      toast.success("Document type created successfully");
      setDocumentTypes([...documentTypes, response.data.data]);
      setNewTypeName("");
      setNewTypeDescription("");
      setShowCreateTypeDialog(false);
    } catch (error: any) {
      toast.error("Failed to create document type", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setCreatingType(false);
    }
  };

  const onSubmit = async (data: CreateDocumentData) => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);
      await createVehicleDocument(vehicleId, {
        ...data,
        file: selectedFile,
      });

      toast.success("Document uploaded successfully");
      router.push(`/dashboard/vehicles/${vehicleId}/documents`);
    } catch (error: any) {
      toast.error("Failed to upload document", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/documents`)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
            <p className="text-muted-foreground mt-1">
              {getVehicleName()} - {vehicle.vehicle_type?.name || "Unknown Type"}
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
            <CardDescription>Fill in the details for this document</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTypes ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="document_type_id"
                    rules={{ required: "Document type is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Document Type *</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreateTypeDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Custom Type
                          </Button>
                        </div>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {documentTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name} ({type.scope_type}
                                {type.is_required ? " • Required" : ""})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the type of document you're uploading or create a custom one
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="document_name"
                    rules={{ required: "Document name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Insurance Certificate 2025" {...field} />
                        </FormControl>
                        <FormDescription>A descriptive name for this document</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="document_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., INS-2025-12345" {...field} />
                        </FormControl>
                        <FormDescription>Official document number or reference</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>Document File *</FormLabel>
                    <div className="mt-2">
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      >
                        {selectedFile ? (
                          <div className="flex flex-col items-center">
                            <FileText className="h-8 w-8 text-primary mb-2" />
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PDF, Image (max 10MB)
                            </p>
                          </div>
                        )}
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.gif"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issue_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issue Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about this document..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/documents`)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={uploading || !selectedFile}>
                      {uploading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Custom Document Type Dialog */}
      <Dialog open={showCreateTypeDialog} onOpenChange={setShowCreateTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Document Type</DialogTitle>
            <DialogDescription>
              Create a new document type specific to your organization{vehicle?.vehicle_type?.name ? ` for ${vehicle.vehicle_type.name}` : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type Name *</label>
              <Input
                placeholder="e.g., Custom Inspection Certificate"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe what this document type is for..."
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateTypeDialog(false)}
              disabled={creatingType}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateDocumentType} disabled={creatingType || !newTypeName.trim()}>
              {creatingType ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Type
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
