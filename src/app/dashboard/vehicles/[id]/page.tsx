"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vehicleService, Vehicle } from "@/lib/vehicles";
import { ChevronLeft, FileText, Pencil, QrCode, Download, Upload, Trash2, Plus, X, Eye } from "lucide-react";
import { PageLoading, LoadingOverlay } from "@/components/ui/loading-overlay";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  getVehicleDocuments,
  deleteVehicleDocument,
  createVehicleDocument,
  updateVehicleDocument,
  getDocumentTypesForVehicle,
  type VehicleDocument,
  type DocumentType,
  type CreateDocumentData
} from "@/lib/api/vehicleDocuments";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = parseInt(params?.id as string);
  const { setCustomLabel, clearCustomLabel } = useBreadcrumb();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Document management states
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<VehicleDocument | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editFile, setEditFile] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);

  // Upload form states - Batch upload support
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadForm, setUploadForm] = useState<Partial<CreateDocumentData>>({
    vehicle_id: vehicleId,
    document_name: "",
    document_number: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });
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
  const [pendingUploads, setPendingUploads] = useState<{
    file: File;
    document_type_id: number;
    document_name: string;
  }[]>([]);

  // Custom type creation
  const [showCreateTypeDialog, setShowCreateTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [creatingType, setCreatingType] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingDocuments(true);
        const [vehicleResponse, docsData, typesData] = await Promise.all([
          vehicleService.getOne(vehicleId),
          getVehicleDocuments(vehicleId),
          getDocumentTypesForVehicle(vehicleId),
        ]);
        const vehicleData = vehicleResponse.data;
        setVehicle(vehicleData);
        setDocuments(docsData);
        setDocumentTypes(typesData);

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
        toast.error("Failed to load vehicle data");
      } finally {
        setLoading(false);
        setLoadingDocuments(false);
      }
    };

    if (vehicleId) {
      fetchData();
    }
  }, [vehicleId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-700 border-green-500/50";
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/50";
      case "inactive":
        return "bg-gray-500/20 text-gray-700 border-gray-500/50";
      case "sold":
        return "bg-blue-500/20 text-blue-700 border-blue-500/50";
      default:
        return "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);

      // Initialize batch documents with file names
      const newBatchDocs = filesArray.map(file => ({
        file,
        document_name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        document_type_id: uploadForm.document_type_id,
      }));
      setBatchDocuments(newBatchDocs);

      // Initialize upload progress
      const progress: {[key: string]: 'pending' | 'uploading' | 'success' | 'error'} = {};
      filesArray.forEach(file => {
        progress[file.name] = 'pending';
      });
      setUploadProgress(progress);
    }
  };

  const handleBatchUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (batchDocuments.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    // Validate each document has a type
    const missingType = batchDocuments.find(doc => !doc.document_type_id);
    if (missingType) {
      toast.error("Please select a document type for all files");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    // Upload each document
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

    // Show result toast
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Successfully uploaded ${successCount} document${successCount > 1 ? 's' : ''}`);
      setShowUploadDialog(false);
      resetUploadForm();
      // Reload documents
      const docsData = await getVehicleDocuments(vehicleId);
      setDocuments(docsData);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Uploaded ${successCount} document${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    } else {
      toast.error("Failed to upload documents");
    }
  };

  const resetUploadForm = () => {
    setSelectedFiles([]);
    setBatchDocuments([]);
    setUploadProgress({});
    setUploadForm({
      vehicle_id: vehicleId,
      document_name: "",
      document_number: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
    });
  };

  const handleCreateCustomType = async () => {
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

      const newType = response.data.data;
      setDocumentTypes([...documentTypes, newType]);
      setUploadForm({ ...uploadForm, document_type_id: newType.id });

      toast.success("Custom document type created successfully");
      setShowCreateTypeDialog(false);
      setNewTypeName("");
      setNewTypeDescription("");
    } catch (error: any) {
      console.error("Failed to create document type:", error);
      toast.error(error.response?.data?.message || "Failed to create document type");
    } finally {
      setCreatingType(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      setDeleting(true);
      await deleteVehicleDocument(vehicleId, documentToDelete);
      toast.success("Document deleted successfully");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      // Reload documents
      const docsData = await getVehicleDocuments(vehicleId);
      setDocuments(docsData);
    } catch (error: any) {
      console.error("Failed to delete document:", error);
      toast.error(error.response?.data?.message || "Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (document: VehicleDocument) => {
    // Remove /api from the URL to get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const fileUrl = `${baseUrl}/storage/${document.file_path}`;
    window.open(fileUrl, "_blank");
  };

  const handlePreview = (document: VehicleDocument) => {
    // Remove /api from the URL to get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const fileUrl = `${baseUrl}/storage/${document.file_path}`;
    window.open(fileUrl, "_blank");
  };

  const handleEditDocument = (document: VehicleDocument) => {
    setDocumentToEdit(document);
    setEditForm({
      document_type_id: document.document_type_id,
      document_name: document.document_name,
      document_number: document.document_number || "",
      issue_date: document.issue_date || "",
      expiry_date: document.expiry_date || "",
      notes: document.notes || "",
    });
    setEditFile(null);
    setShowEditDialog(true);
  };

  const handleUpdateDocument = async () => {
    if (!documentToEdit) return;

    try {
      setUpdating(true);
      const updateData: any = { ...editForm };
      if (editFile) {
        updateData.file = editFile;
      }

      await updateVehicleDocument(vehicleId, documentToEdit.id, updateData);
      toast.success("Document updated successfully");

      // Refresh documents
      const docsData = await getVehicleDocuments(vehicleId);
      setDocuments(docsData);

      // Close dialog
      setShowEditDialog(false);
      setDocumentToEdit(null);
      setEditForm({});
      setEditFile(null);
    } catch (error: any) {
      toast.error("Failed to update document", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickUpload = async () => {
    // First add current selection to queue if exists
    let allDocs = [...pendingUploads];
    if (selectedFiles.length > 0) {
      if (!uploadForm.document_type_id) {
        toast.error("Please select a document type");
        return;
      }
      allDocs.push({
        file: selectedFiles[0],
        document_type_id: uploadForm.document_type_id,
        document_name: uploadForm.document_name || selectedFiles[0].name.replace(/\.[^/.]+$/, ""),
      });
    }

    if (allDocs.length === 0) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setUploading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const doc of allDocs) {
        try {
          await createVehicleDocument(vehicleId, {
            vehicle_id: vehicleId,
            document_type_id: doc.document_type_id,
            document_name: doc.document_name,
            file: doc.file,
          });
          successCount++;
        } catch (error) {
          console.error("Upload failed:", error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Uploaded ${successCount} document(s) successfully`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} document(s)`);
      }

      // Refresh documents list
      const docsData = await getVehicleDocuments(vehicleId);
      setDocuments(docsData);

      // Clear form and pending uploads
      setSelectedFiles([]);
      setPendingUploads([]);
      setUploadForm({
        vehicle_id: vehicleId,
        document_name: "",
        document_number: "",
        issue_date: "",
        expiry_date: "",
        notes: "",
      });
    } catch (error: any) {
      toast.error("Failed to upload documents", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddAnother = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select a file");
      return;
    }

    if (!uploadForm.document_type_id) {
      toast.error("Please select a document type");
      return;
    }

    // Add current selection to pending uploads
    setPendingUploads([
      ...pendingUploads,
      {
        file: selectedFiles[0],
        document_type_id: uploadForm.document_type_id,
        document_name: uploadForm.document_name || selectedFiles[0].name.replace(/\.[^/.]+$/, ""),
      }
    ]);

    // Clear current selection for next document
    setSelectedFiles([]);
    setUploadForm({
      ...uploadForm,
      document_name: "",
      document_type_id: undefined,
    });

    toast.success("Document added to queue");
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

  const getDocumentStatus = (doc: VehicleDocument) => {
    if (!doc.expiry_date) {
      return { status: "active", label: "Active", className: "bg-green-500/20 text-green-700" };
    }

    const expiryDate = new Date(doc.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (doc.is_expired || daysUntilExpiry < 0) {
      return { status: "expired", label: "Expired", className: "bg-red-500/20 text-red-700" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring", label: `Expires in ${daysUntilExpiry} days`, className: "bg-yellow-500/20 text-yellow-700" };
    } else {
      return { status: "active", label: "Active", className: "bg-green-500/20 text-green-700" };
    }
  };

  // Define columns for documents table
  const documentColumns: ColumnDef<VehicleDocument>[] = [
    {
      accessorKey: "document_name",
      header: "Document Name",
      cell: ({ row }) => {
        const fullName = row.original.document_name;
        const displayName = fullName.length > 25
          ? fullName.substring(0, 25) + "..."
          : fullName;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-default">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">{displayName}</span>
                </div>
              </TooltipTrigger>
              {fullName.length > 25 && (
                <TooltipContent>
                  <p>{fullName}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "document_type",
      header: "Type",
      cell: ({ row }) => {
        const docType = row.original.document_type;
        const typeName = typeof docType === 'string' ? docType : docType?.name || "N/A";
        return <Badge variant="outline">{typeName}</Badge>;
      },
    },
    {
      accessorKey: "document_number",
      header: "Number",
      cell: ({ row }) => row.original.document_number || "-",
    },
    {
      accessorKey: "expiry_date",
      header: "Expiry Date",
      cell: ({ row }) => {
        const status = getDocumentStatus(row.original);
        return row.original.expiry_date ? (
          <div className="flex flex-col gap-1">
            <span>{formatDate(row.original.expiry_date)}</span>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
        ) : "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview(row.original);
            }}
            title="Preview document"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(row.original);
            }}
            title="Download document"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditDocument(row.original);
            }}
            title="Edit document"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDocumentToDelete(row.original.id);
              setDeleteDialogOpen(true);
            }}
            className="text-destructive hover:text-destructive"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Group fields by default vs custom
  const defaultFields = vehicle?.field_values?.filter(fv => fv.field?.tenant_id === null) || [];
  const customFields = vehicle?.field_values?.filter(fv => fv.field?.tenant_id !== null) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading message="Loading vehicle details..." />
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {vehicleName}
              </h1>
              <p className="text-muted-foreground mt-1">
                {vehicle.vehicle_type?.name || "Unknown Type"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(vehicle.status)} capitalize border font-medium`}>
              {vehicle.status}
            </Badge>
            <Button
              onClick={() => setShowQRDialog(true)}
              variant="outline"
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/edit`)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Two Column Layout: Vehicle Info + Upload Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[...defaultFields, ...customFields].length > 0 ? (
                <div className="divide-y">
                  {[...defaultFields, ...customFields].map((fv) => (
                    <div key={fv.id} className="flex items-center py-3 px-6">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">
                          {fv.field?.name}
                        </p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-semibold">
                          {fv.value}
                          {fv.field?.unit && ` ${fv.field.unit}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Field Data</h3>
                  <p className="text-sm text-muted-foreground">
                    No fields have been configured for this vehicle
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>Add documents to this vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action Buttons at Top */}
              <div className="flex justify-between gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setUploadForm({
                      vehicle_id: vehicleId,
                      document_name: "",
                      document_number: "",
                      issue_date: "",
                      expiry_date: "",
                      notes: "",
                    });
                    setPendingUploads([]);
                  }}
                  disabled={uploading}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleQuickUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>

              {/* File Upload Dropzone */}
              <div>
                <label
                  htmlFor="quick-file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                >
                  {selectedFiles.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium">{selectedFiles[0].name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFiles[0].size / 1024 / 1024).toFixed(2)} MB
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
                    id="quick-file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("File too large", {
                            description: "Maximum file size is 10MB",
                          });
                          return;
                        }
                        setSelectedFiles([file]);
                        setUploadForm({
                          ...uploadForm,
                          document_name: file.name.replace(/\.[^/.]+$/, ""),
                        });
                      }
                      e.target.value = '';
                    }}
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Document Type Toggles */}
              <div className="space-y-2">
                <Label>Document Type *</Label>
                {loadingDocuments ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {documentTypes.map((type) => (
                      <Badge
                        key={type.id}
                        variant={
                          uploadForm.document_type_id === type.id ? "default" : "outline"
                        }
                        className="cursor-pointer hover:bg-primary/80 transition-colors px-3 py-1"
                        onClick={() => {
                          if (!uploading) {
                            setUploadForm({
                              ...uploadForm,
                              document_type_id:
                                uploadForm.document_type_id === type.id ? undefined : type.id,
                            });
                          }
                        }}
                      >
                        {type.name}
                      </Badge>
                    ))}
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors px-3 py-1"
                      onClick={() => setShowCreateTypeDialog(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New Type
                    </Badge>
                  </div>
                )}
              </div>

              {/* Pending Uploads List */}
              {pendingUploads.length > 0 && (
                <div className="space-y-2">
                  <Label>Ready to Upload ({pendingUploads.length})</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {pendingUploads.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-accent/50 rounded"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.document_name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {documentTypes.find(t => t.id === doc.document_type_id)?.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => {
                            setPendingUploads(pendingUploads.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Another Document Button */}
              <Button
                variant="outline"
                onClick={handleAddAnother}
                disabled={uploading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Document
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Documents</CardTitle>
            <CardDescription>Manage all documents related to this vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDocuments ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : documents.length > 0 ? (
              <DataTable columns={documentColumns} data={documents} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload documents like insurance, registration, etc.
                </p>
                <Button onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/documents/upload`)} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload First Document
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) resetUploadForm();
      }}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload one or multiple documents for this vehicle
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBatchUploadSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="document_type_id">Document Type *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateTypeDialog(true)}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Create Custom Type
                </Button>
              </div>
              <Select
                value={uploadForm.document_type_id?.toString() || ""}
                onValueChange={(value) =>
                  setUploadForm({ ...uploadForm, document_type_id: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
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
              <Label>Document Files * (Select multiple files)</Label>
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
              >
                {selectedFiles.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <p className="text-sm font-medium">{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, Image - Multiple files supported (max 10MB each)
                    </p>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileChange}
                  multiple
                  required
                />
              </label>
            </div>

            {/* Batch Documents List */}
            {batchDocuments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-base font-semibold">Files to Upload ({batchDocuments.length})</Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
                  {batchDocuments.map((doc, index) => (
                    <div key={index} className="border-2 rounded-lg p-4 space-y-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{doc.file.name}</span>
                          {uploadProgress[doc.file.name] && (
                            <Badge
                              variant={
                                uploadProgress[doc.file.name] === 'success' ? 'default' :
                                uploadProgress[doc.file.name] === 'error' ? 'destructive' :
                                uploadProgress[doc.file.name] === 'uploading' ? 'secondary' : 'outline'
                              }
                              className="ml-auto flex-shrink-0"
                            >
                              {uploadProgress[doc.file.name] === 'success' && '✓ Uploaded'}
                              {uploadProgress[doc.file.name] === 'error' && '✗ Failed'}
                              {uploadProgress[doc.file.name] === 'uploading' && 'Uploading...'}
                              {uploadProgress[doc.file.name] === 'pending' && 'Pending'}
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBatchDocuments(prev => prev.filter((_, i) => i !== index));
                            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Document Name *</Label>
                          <Input
                            placeholder="e.g., Insurance Certificate 2025"
                            value={doc.document_name}
                            onChange={(e) => {
                              const newDocs = [...batchDocuments];
                              newDocs[index].document_name = e.target.value;
                              setBatchDocuments(newDocs);
                            }}
                            disabled={uploading}
                            className="text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Document Type *</Label>
                          <Select
                            value={doc.document_type_id?.toString() || ""}
                            onValueChange={(value) => {
                              const newDocs = [...batchDocuments];
                              newDocs[index].document_type_id = parseInt(value);
                              setBatchDocuments(newDocs);
                            }}
                            disabled={uploading}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select document type" />
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

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Document Number</Label>
                          <Input
                            placeholder="e.g., INS-2025-12345"
                            value={doc.document_number || ''}
                            onChange={(e) => {
                              const newDocs = [...batchDocuments];
                              newDocs[index].document_number = e.target.value;
                              setBatchDocuments(newDocs);
                            }}
                            disabled={uploading}
                            className="text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Issue Date</Label>
                            <Input
                              type="date"
                              value={doc.issue_date || ''}
                              onChange={(e) => {
                                const newDocs = [...batchDocuments];
                                newDocs[index].issue_date = e.target.value;
                                setBatchDocuments(newDocs);
                              }}
                              disabled={uploading}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                            <Input
                              type="date"
                              value={doc.expiry_date || ''}
                              onChange={(e) => {
                                const newDocs = [...batchDocuments];
                                newDocs[index].expiry_date = e.target.value;
                                setBatchDocuments(newDocs);
                              }}
                              disabled={uploading}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Notes</Label>
                          <Textarea
                            placeholder="Additional notes about this document..."
                            value={doc.notes || ''}
                            onChange={(e) => {
                              const newDocs = [...batchDocuments];
                              newDocs[index].notes = e.target.value;
                              setBatchDocuments(newDocs);
                            }}
                            disabled={uploading}
                            className="text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || batchDocuments.length === 0}>
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Uploading {batchDocuments.length} file{batchDocuments.length > 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {batchDocuments.length} Document{batchDocuments.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Update document information and optionally replace the file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Document Type */}
            <div className="space-y-2">
              <Label>Document Type *</Label>
              <Select
                value={editForm.document_type_id?.toString() || ""}
                onValueChange={(value) => setEditForm({ ...editForm, document_type_id: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                  <div className="border-t mt-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowCreateTypeDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Type
                    </Button>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Document Name */}
            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input
                value={editForm.document_name || ""}
                onChange={(e) => setEditForm({ ...editForm, document_name: e.target.value })}
                placeholder="e.g., Insurance Certificate 2025"
              />
            </div>

            {/* Document Number */}
            <div className="space-y-2">
              <Label>Document Number</Label>
              <Input
                value={editForm.document_number || ""}
                onChange={(e) => setEditForm({ ...editForm, document_number: e.target.value })}
                placeholder="e.g., INS-2025-12345"
              />
            </div>

            {/* Current File Info */}
            {documentToEdit && (
              <div className="space-y-2">
                <Label>Current File</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{documentToEdit.file_path.split('/').pop()}</span>
                </div>
              </div>
            )}

            {/* Replace File */}
            <div className="space-y-2">
              <Label>Replace File (Optional)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("File too large", {
                        description: "Maximum file size is 10MB",
                      });
                      return;
                    }
                    setEditFile(file);
                  }
                }}
              />
              {editFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {editFile.name} ({(editFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Issue Date */}
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input
                type="date"
                value={editForm.issue_date || ""}
                onChange={(e) => setEditForm({ ...editForm, issue_date: e.target.value })}
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={editForm.expiry_date || ""}
                onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes about this document..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateDocument}
              disabled={updating || !editForm.document_name || !editForm.document_type_id}
            >
              {updating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                "Update Document"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vehicle QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to view vehicle details and documents
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {vehicle.qr_code_token && (
              <>
                <div className="bg-white p-6 rounded-lg">
                  <QRCodeSVG
                    value={`${window.location.origin}/v/${vehicle.qr_code_token}`}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {window.location.origin}/v/{vehicle.qr_code_token}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const svg = document.querySelector('svg');
                      if (svg) {
                        // Convert SVG to canvas to download as PNG
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const img = new Image();

                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          const url = canvas.toDataURL('image/png');
                          const link = document.createElement('a');
                          link.download = `vehicle-${vehicle.id}-qr.png`;
                          link.href = url;
                          link.click();
                        };

                        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/v/${vehicle.qr_code_token}`);
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Custom Document Type Dialog */}
      <Dialog open={showCreateTypeDialog} onOpenChange={setShowCreateTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Document Type</DialogTitle>
            <DialogDescription>
              Create a new document type specific to your organization
              {vehicle?.vehicle_type?.name ? ` for ${vehicle.vehicle_type.name}` : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type_name">Document Type Name *</Label>
              <Input
                id="type_name"
                placeholder="e.g., Custom Inspection Certificate"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_description">Description</Label>
              <Textarea
                id="type_description"
                placeholder="Optional description of this document type"
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
              onClick={() => {
                setShowCreateTypeDialog(false);
                setNewTypeName("");
                setNewTypeDescription("");
              }}
              disabled={creatingType}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateDocumentType}
              disabled={creatingType || !newTypeName.trim()}
            >
              {creatingType ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Type"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
