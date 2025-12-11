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
import { Upload, FileText, ChevronLeft, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";
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
  const { setCustomLabel } = useBreadcrumb();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Batch upload states
  const [batchDocuments, setBatchDocuments] = useState<{
    file: File;
    document_type_id?: number;
    document_name: string;
    document_number?: string;
    issue_date?: string;
    expiry_date?: string;
    notes?: string;
  }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: 'pending' | 'uploading' | 'success' | 'error'}>({});

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

      // Fetch data sequentially
      const vehicleResponse = await vehicleService.getOne(vehicleId);
      const vehicleData = vehicleResponse.data;
      setVehicle(vehicleData);

      const types = await getDocumentTypesForVehicle(vehicleId);
      setDocumentTypes(types);

      // Set custom breadcrumb label with vehicle name
      const nameField = vehicleData.field_values?.find((fv: any) =>
        fv.field && fv.field.key && fv.field.key.toLowerCase() === 'name'
      );
      const vehicleName = nameField?.value || `Vehicle #${vehicleData.id}`;
      setCustomLabel(`/dashboard/vehicles/${vehicleId}`, vehicleName);
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
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);

      // Validate file sizes
      const invalidFiles = filesArray.filter(file => file.size > 10 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        toast.error("Some files are too large", {
          description: `Maximum file size is 10MB. ${invalidFiles.length} file(s) exceeded this limit.`,
        });
        e.target.value = ''; // Reset input
        return;
      }

      // Initialize batch documents with file names
      const newBatchDocs = filesArray.map(file => ({
        file,
        document_name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      }));
      setBatchDocuments(newBatchDocs);

      // Initialize upload progress
      const progress: {[key: string]: 'pending' | 'uploading' | 'success' | 'error'} = {};
      filesArray.forEach(file => {
        progress[file.name] = 'pending';
      });
      setUploadProgress(progress);
    }

    // Reset input value after processing to allow selecting the same files again
    e.target.value = '';
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

  const onSubmit = async () => {
    if (batchDocuments.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    // Validate each document has required fields
    const missingType = batchDocuments.find(doc => !doc.document_type_id);
    if (missingType) {
      toast.error("Please select a document type for all files");
      return;
    }

    const missingName = batchDocuments.find(doc => !doc.document_name?.trim());
    if (missingName) {
      toast.error("Please provide a document name for all files");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    // Upload each document sequentially
    for (const doc of batchDocuments) {
      try {
        setUploadProgress(prev => ({ ...prev, [doc.file.name]: 'uploading' }));

        await createVehicleDocument(vehicleId, {
          vehicle_id: vehicleId,
          document_type_id: doc.document_type_id!,
          document_name: doc.document_name,
          document_number: doc.document_number,
          issue_date: doc.issue_date,
          expiry_date: doc.expiry_date,
          notes: doc.notes,
          file: doc.file,
        });

        setUploadProgress(prev => ({ ...prev, [doc.file.name]: 'success' }));
        successCount++;
      } catch (error: any) {
        console.error(`Failed to upload ${doc.file.name}:`, error);
        setUploadProgress(prev => ({ ...prev, [doc.file.name]: 'error' }));
        errorCount++;
      }
    }

    setUploading(false);

    // Show result and redirect
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Successfully uploaded ${successCount} document${successCount > 1 ? 's' : ''}`);
      router.push(`/dashboard/vehicles/${vehicleId}`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Uploaded ${successCount} document${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    } else {
      toast.error("Failed to upload documents");
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
            <h1 className="text-3xl font-bold tracking-tight">Upload Documents</h1>
            <p className="text-muted-foreground mt-1">
              {getVehicleName()} - {vehicle.vehicle_type?.name || "Unknown Type"}
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
            <CardDescription>
              {batchDocuments.length > 0
                ? `Fill in the details for ${batchDocuments.length} document${batchDocuments.length > 1 ? 's' : ''}`
                : "Select one or more files to upload"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTypes ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Upload Zone */}
                <div>
                  <Label>Document Files *</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                    >
                      {batchDocuments.length > 0 ? (
                        <div className="flex flex-col items-center">
                          <FileText className="h-8 w-8 text-primary mb-2" />
                          <p className="text-sm font-medium">
                            {batchDocuments.length} file{batchDocuments.length > 1 ? 's' : ''} selected
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(batchDocuments.reduce((acc, doc) => acc + doc.file.size, 0) / 1024 / 1024).toFixed(2)} MB total
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click to select different files
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, Image (max 10MB per file) - Multiple files supported
                          </p>
                        </div>
                      )}
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.gif"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                {/* Batch Documents Grid */}
                {batchDocuments.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Documents to Upload</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBatchDocuments([]);
                          setUploadProgress({});
                        }}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {batchDocuments.map((doc, index) => (
                        <Card key={`${doc.file.name}-${index}`} className="relative">
                          <CardHeader className="pb-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium break-all line-clamp-2" title={doc.file.name}>
                                      {doc.file.name}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={() => {
                                    const newDocs = batchDocuments.filter((_, i) => i !== index);
                                    setBatchDocuments(newDocs);
                                    const newProgress = { ...uploadProgress };
                                    delete newProgress[doc.file.name];
                                    setUploadProgress(newProgress);
                                  }}
                                  disabled={uploading}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">
                                  {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {uploadProgress[doc.file.name] && (
                                  <Badge
                                    variant={
                                      uploadProgress[doc.file.name] === 'success' ? 'default' :
                                      uploadProgress[doc.file.name] === 'error' ? 'destructive' :
                                      uploadProgress[doc.file.name] === 'uploading' ? 'secondary' :
                                      'outline'
                                    }
                                  >
                                    {uploadProgress[doc.file.name]}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label>Document Type *</Label>
                              <Select
                                value={doc.document_type_id?.toString() || ""}
                                onValueChange={(value) => {
                                  const newDocs = [...batchDocuments];
                                  newDocs[index].document_type_id = parseInt(value);
                                  setBatchDocuments(newDocs);
                                }}
                                disabled={uploading}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {documentTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Document Name *</Label>
                              <Input
                                value={doc.document_name}
                                onChange={(e) => {
                                  const newDocs = [...batchDocuments];
                                  newDocs[index].document_name = e.target.value;
                                  setBatchDocuments(newDocs);
                                }}
                                placeholder="e.g., Insurance Certificate 2025"
                                disabled={uploading}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Document Number</Label>
                              <Input
                                value={doc.document_number || ""}
                                onChange={(e) => {
                                  const newDocs = [...batchDocuments];
                                  newDocs[index].document_number = e.target.value;
                                  setBatchDocuments(newDocs);
                                }}
                                placeholder="e.g., INS-2025-12345"
                                disabled={uploading}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Issue Date</Label>
                                <DatePicker
                                  value={doc.issue_date}
                                  onChange={(date) => {
                                    const newDocs = [...batchDocuments];
                                    newDocs[index].issue_date = date ? date.toISOString().split('T')[0] : undefined;
                                    setBatchDocuments(newDocs);
                                  }}
                                  placeholder="Select issue date"
                                  disabled={uploading}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Expiry Date</Label>
                                <DatePicker
                                  value={doc.expiry_date}
                                  onChange={(date) => {
                                    const newDocs = [...batchDocuments];
                                    newDocs[index].expiry_date = date ? date.toISOString().split('T')[0] : undefined;
                                    setBatchDocuments(newDocs);
                                  }}
                                  placeholder="Select expiry date"
                                  disabled={uploading}
                                  fromDate={doc.issue_date ? new Date(doc.issue_date) : undefined}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Notes</Label>
                              <Textarea
                                value={doc.notes || ""}
                                onChange={(e) => {
                                  const newDocs = [...batchDocuments];
                                  newDocs[index].notes = e.target.value;
                                  setBatchDocuments(newDocs);
                                }}
                                placeholder="Additional notes..."
                                rows={2}
                                disabled={uploading}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateTypeDialog(true)}
                        disabled={uploading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Custom Type
                      </Button>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/vehicles/${vehicleId}`)}
                          disabled={uploading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={onSubmit}
                          disabled={uploading || batchDocuments.length === 0}
                        >
                          {uploading ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload {batchDocuments.length} Document{batchDocuments.length > 1 ? 's' : ''}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
