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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getVehicleDocument,
  updateVehicleDocument,
  getDocumentTypesForVehicle,
  type VehicleDocument,
  type UpdateDocumentData,
  type DocumentType,
} from "@/lib/api/vehicleDocuments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vehicleService, type Vehicle } from "@/lib/vehicles";
import { ChevronLeft, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = parseInt(params?.id as string);
  const documentId = parseInt(params?.documentId as string);
  const { setCustomLabel } = useBreadcrumb();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [document, setDocument] = useState<VehicleDocument | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<number | null>(null);

  const form = useForm<UpdateDocumentData>({
    defaultValues: {
      document_name: "",
      document_number: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (vehicleId && documentId) {
      loadData();
    }
  }, [vehicleId, documentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehicleResponse, documentData, types] = await Promise.all([
        vehicleService.getOne(vehicleId),
        getVehicleDocument(vehicleId, documentId),
        getDocumentTypesForVehicle(vehicleId),
      ]);
      const vehicleData = vehicleResponse.data;
      setVehicle(vehicleData);
      setDocument(documentData);
      setDocumentTypes(types);
      setSelectedDocumentTypeId(documentData.document_type_id);

      // Set custom breadcrumb label with vehicle name
      const nameField = vehicleData.field_values?.find((fv: any) =>
        fv.field && fv.field.key && fv.field.key.toLowerCase() === 'name'
      );
      const vehicleName = nameField?.value || `Vehicle #${vehicleData.id}`;
      setCustomLabel(`/dashboard/vehicles/${vehicleId}`, vehicleName);

      // Populate form with existing data
      form.reset({
        document_name: documentData.document_name,
        document_number: documentData.document_number || "",
        issue_date: documentData.issue_date || "",
        expiry_date: documentData.expiry_date || "",
        notes: documentData.notes || "",
      });
    } catch (error: any) {
      toast.error("Failed to load data", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setLoading(false);
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

  const onSubmit = async (data: UpdateDocumentData) => {
    try {
      setUpdating(true);
      const updateData: UpdateDocumentData = { ...data };
      if (selectedFile) {
        updateData.file = selectedFile;
      }
      if (selectedDocumentTypeId) {
        updateData.document_type_id = selectedDocumentTypeId;
      }

      await updateVehicleDocument(vehicleId, documentId, updateData);

      toast.success("Document updated successfully");
      router.push(`/dashboard/vehicles/${vehicleId}/documents`);
    } catch (error: any) {
      toast.error("Failed to update document", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getDocumentTypeName = () => {
    if (!document) return 'Unknown';
    if (typeof document.document_type === 'string') return document.document_type;
    return document.document_type_info?.name || document.document_type?.name || 'Unknown';
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

  if (!vehicle || !document) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <h2 className="text-2xl font-bold">Document Not Found</h2>
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Document</h1>
            <p className="text-muted-foreground mt-1">
              {getVehicleName()} - {vehicle.vehicle_type?.name || "Unknown Type"}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
            <CardDescription>Update the details for this document</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <FormLabel>Document Type *</FormLabel>
                  <Select
                    value={selectedDocumentTypeId?.toString() || ""}
                    onValueChange={(value) => setSelectedDocumentTypeId(parseInt(value))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name} ({type.scope_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    You can change the document type if needed
                  </p>
                </div>

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
                  <FormLabel>Replace Document File</FormLabel>
                  <div className="mt-2">
                    <div className="rounded-lg border p-4 bg-muted/50 mb-3">
                      <p className="text-sm font-medium mb-1">Current File</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>{document.file_path.split('/').pop()}</span>
                        {document.file_size && (
                          <span className="text-xs">
                            ({(document.file_size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        )}
                      </div>
                    </div>
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
                            Click to upload a new file (optional)
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
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Update Document
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
