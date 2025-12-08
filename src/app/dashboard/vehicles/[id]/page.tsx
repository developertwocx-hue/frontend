"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vehicleService, Vehicle } from "@/lib/vehicles";
import { ChevronLeft, FileText, Pencil, QrCode, Download, Upload, Trash2, Plus } from "lucide-react";
import { PageLoading, LoadingOverlay } from "@/components/ui/loading-overlay";
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

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = parseInt(params?.id as string);

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

  // Upload form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<CreateDocumentData>({
    vehicle_id: vehicleId,
    document_name: "",
    document_number: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
  });

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
        setVehicle(vehicleResponse.data);
        setDocuments(docsData);
        setDocumentTypes(typesData);
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
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    if (!uploadForm.document_type_id) {
      toast.error("Please select a document type");
      return;
    }

    try {
      setUploading(true);
      await createVehicleDocument(vehicleId, {
        ...uploadForm,
        file: selectedFile,
      });
      toast.success("Document uploaded successfully");
      setShowUploadDialog(false);
      resetUploadForm();
      // Reload documents
      const docsData = await getVehicleDocuments(vehicleId);
      setDocuments(docsData);
    } catch (error: any) {
      console.error("Failed to upload document:", error);
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
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
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.document_name}</span>
        </div>
      ),
    },
    {
      accessorKey: "document_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.document_type?.name || "N/A"}</Badge>
      ),
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
        <div className="flex items-center gap-2">
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
                Vehicle #{vehicle.id}
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

        <div className="space-y-4">
            {/* Default Fields */}
            {defaultFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                  <CardDescription>Default fields for this vehicle type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {defaultFields.map((fv) => (
                      <div key={fv.id} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {fv.field?.name}
                        </p>
                        <p className="text-base font-semibold">
                          {fv.value}
                          {fv.field?.unit && ` ${fv.field.unit}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Fields</CardTitle>
                  <CardDescription>Tenant-specific custom fields</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customFields.map((fv) => (
                      <div key={fv.id} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {fv.field?.name}
                        </p>
                        <p className="text-base font-semibold">
                          {fv.value}
                          {fv.field?.unit && ` ${fv.field.unit}`}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Custom
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No fields */}
            {defaultFields.length === 0 && customFields.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Field Data</h3>
                  <p className="text-sm text-muted-foreground">
                    No fields have been configured for this vehicle
                  </p>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vehicle Documents</CardTitle>
                <CardDescription>Manage all documents related to this vehicle</CardDescription>
              </div>
              <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
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
                <Button onClick={() => setShowUploadDialog(true)} variant="outline" className="gap-2">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document for this vehicle
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
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
              <Label htmlFor="document_name">Document Name *</Label>
              <Input
                id="document_name"
                value={uploadForm.document_name}
                onChange={(e) => setUploadForm({ ...uploadForm, document_name: e.target.value })}
                placeholder="e.g., Insurance Certificate 2025"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_number">Document Number</Label>
              <Input
                id="document_number"
                value={uploadForm.document_number}
                onChange={(e) => setUploadForm({ ...uploadForm, document_number: e.target.value })}
                placeholder="e.g., INS-2025-12345"
              />
            </div>

            <div className="space-y-2">
              <Label>Document File *</Label>
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
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={uploadForm.issue_date}
                  onChange={(e) => setUploadForm({ ...uploadForm, issue_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={uploadForm.expiry_date}
                  onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="Additional notes about this document..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowUploadDialog(false)} disabled={uploading}>
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
            </DialogFooter>
          </form>
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
              onClick={handleCreateCustomType}
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
