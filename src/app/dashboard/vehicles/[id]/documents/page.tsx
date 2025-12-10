"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getVehicleDocuments, deleteVehicleDocument, type VehicleDocument } from "@/lib/api/vehicleDocuments";
import { vehicleService, type Vehicle } from "@/lib/vehicles";
import { Upload, ChevronLeft, FileText, Download, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useBreadcrumb } from "@/contexts/breadcrumb-context";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/utils";
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

export default function VehicleDocumentsPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = parseInt(params?.id as string);
  const { setCustomLabel } = useBreadcrumb();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      loadData();
    }
  }, [vehicleId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch data sequentially
      const vehicleResponse = await vehicleService.getOne(vehicleId);
      const vehicleData = vehicleResponse.data;
      setVehicle(vehicleData);

      const docsData = await getVehicleDocuments(vehicleId);
      setDocuments(docsData);

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
    }
  };

  const getVehicleName = () => {
    if (!vehicle?.field_values) return `Vehicle #${vehicleId}`;
    const nameField = vehicle.field_values.find((fv) => fv.field?.key === "name");
    return nameField?.value || `Vehicle #${vehicleId}`;
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      setDeleting(true);
      await deleteVehicleDocument(vehicleId, documentToDelete);
      toast.success("Document deleted successfully");
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      loadData();
    } catch (error: any) {
      toast.error("Failed to delete document", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (document: VehicleDocument) => {
    // Remove /api from the URL to get the base URL, fallback to window origin for production
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
    const fileUrl = `${baseUrl}/storage/${document.file_path}`;
    window.open(fileUrl, "_blank");
  };

  const getDocumentTypeName = (doc: VehicleDocument) => {
    if (typeof doc.document_type === 'string') return doc.document_type;
    // Check both document_type_info and documentType (from backend)
    if (doc.document_type_info?.name) return doc.document_type_info.name;
    if ((doc as any).document_type?.name) return (doc as any).document_type.name;
    return doc.document_type || 'Unknown';
  };

  const getStatusBadge = (doc: VehicleDocument) => {
    if (doc.is_expired) {
      return <Badge className="bg-red-500/20 text-red-700 border-red-500/50">Expired</Badge>;
    }
    if (doc.expiry_date) {
      const daysUntilExpiry = Math.floor(
        (new Date(doc.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 30) {
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/50">Expiring Soon</Badge>;
      }
      return <Badge className="bg-primary/20 text-primary border-primary/50">Valid</Badge>;
    }
    return <Badge variant="outline">No Expiry</Badge>;
  };

  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    const typeName = getDocumentTypeName(doc);
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(doc);
    return acc;
  }, {} as Record<string, VehicleDocument[]>);

  const columns: ColumnDef<VehicleDocument>[] = [
    {
      accessorKey: "document_type",
      header: "Document Type",
      cell: ({ row }) => {
        const typeName = getDocumentTypeName(row.original);
        return <Badge variant="outline">{typeName}</Badge>;
      },
    },
    {
      accessorKey: "document_name",
      header: "Document Name",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("document_name")}</div>;
      },
    },
    {
      accessorKey: "document_number",
      header: "Document Number",
      cell: ({ row }) => {
        const docNumber = row.getValue("document_number") as string;
        return docNumber ? (
          <span className="text-sm text-muted-foreground">{docNumber}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        return getStatusBadge(row.original);
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(doc);
              }}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/vehicles/${vehicleId}/documents/${doc.id}/edit`);
              }}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDocumentToDelete(doc.id);
                setDeleteDialogOpen(true);
              }}
              className="hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/vehicles/${vehicleId}`)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Documents - {getVehicleName()}
              </h1>
              <p className="text-muted-foreground mt-1">
                {vehicle.vehicle_type?.name || "Unknown Type"}
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/documents/upload`)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {/* Documents by Type */}
        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by uploading your first document
                </p>
                <Button onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/documents/upload`)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(documentsByType).map(([typeName, docs]) => (
            <Card key={typeName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {typeName}
                  <Badge variant="outline" className="ml-2">{docs.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Documents of type {typeName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={docs}
                  searchKey="document_name"
                  searchPlaceholder="Search documents..."
                  showColumnVisibility={false}
                  showPagination={docs.length > 10}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
