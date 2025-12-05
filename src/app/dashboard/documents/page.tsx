"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getAllDocuments, deleteVehicleDocument, type VehicleDocument } from "@/lib/api/vehicleDocuments";
import { vehicleService, type Vehicle } from "@/lib/vehicles";
import { Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
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

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ vehicleId: number; docId: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsData, vehiclesResponse] = await Promise.all([
        getAllDocuments(),
        vehicleService.getAll(),
      ]);
      setDocuments(docsData);
      setVehicles(vehiclesResponse.data);
    } catch (error: any) {
      toast.error("Failed to load documents", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (vehicleId: number) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle?.field_values?.find((fv) => fv.field?.key === "name")?.value || `Vehicle #${vehicleId}`;
  };

  const getDocumentTypeName = (doc: VehicleDocument) => {
    if (typeof doc.document_type === 'string') return doc.document_type;
    // Check both document_type_info and documentType (from backend)
    if (doc.document_type_info?.name) return doc.document_type_info.name;
    if (doc.documentType?.name) return doc.documentType.name;
    if ((doc as any).document_type?.name) return (doc as any).document_type.name;
    return doc.document_type || 'Unknown';
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      setDeleting(true);
      await deleteVehicleDocument(documentToDelete.vehicleId, documentToDelete.docId);
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
    // Remove /api from the URL to get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const fileUrl = `${baseUrl}/storage/${document.file_path}`;
    window.open(fileUrl, "_blank");
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
      id: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => {
        const vehicleName = getVehicleName(row.original.vehicle_id);
        return <span className="text-sm text-muted-foreground">{vehicleName}</span>;
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
                router.push(`/dashboard/vehicles/${doc.vehicle_id}/documents/${doc.id}/edit`);
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
                setDocumentToDelete({ vehicleId: doc.vehicle_id, docId: doc.id });
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">All Documents</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all vehicle documents across your fleet
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              All documents from all vehicles in one place
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={documents}
              searchKey="document_name"
              searchPlaceholder="Search documents..."
              showPagination={true}
              pageSize={20}
            />
          </CardContent>
        </Card>
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
