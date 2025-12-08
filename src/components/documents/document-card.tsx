"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { type VehicleDocument, downloadDocument, deleteVehicleDocument } from "@/lib/api/vehicleDocuments";
import {
  FileText,
  Download,
  MoreVertical,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface DocumentCardProps {
  document: VehicleDocument;
  onDelete?: () => void;
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDownload = () => {
    const url = downloadDocument(document.file_path);
    window.open(url, "_blank");
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteVehicleDocument(document.vehicle_id, document.id);
      toast.success("Document deleted successfully");
      setShowDeleteDialog(false);
      onDelete?.();
    } catch (error: any) {
      toast.error("Failed to delete document", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getExpiryStatus = () => {
    if (!document.expiry_date) return null;

    const expiryDate = new Date(document.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (document.is_expired || daysUntilExpiry < 0) {
      return {
        status: "expired",
        label: "Expired",
        variant: "destructive" as const,
        className: ""
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring",
        label: `Expires in ${daysUntilExpiry} days`,
        variant: "outline" as const,
        className: "border-yellow-500 text-yellow-700 dark:text-yellow-400"
      };
    } else {
      return {
        status: "valid",
        label: "Valid",
        variant: "outline" as const,
        className: "border-green-500 text-green-700 dark:text-green-400"
      };
    }
  };

  const expiryStatus = getExpiryStatus();

  const getFileIcon = () => {
    if (document.file_type?.includes("pdf")) {
      return "text-red-500";
    } else if (document.file_type?.includes("image")) {
      return "text-blue-500";
    }
    return "text-gray-500";
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={`mt-1 ${getFileIcon()}`}>
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base line-clamp-1">{document.document_name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {typeof document.document_type === 'string' ? document.document_type : document.document_type_info?.name || 'Unknown'}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {expiryStatus && (
              <Badge
                variant={expiryStatus.variant}
                className={`flex items-center gap-1 ${expiryStatus.className}`}
              >
                {expiryStatus.status === "expired" && <AlertTriangle className="h-3 w-3" />}
                {expiryStatus.status === "valid" && <CheckCircle2 className="h-3 w-3" />}
                {expiryStatus.label}
              </Badge>
            )}
            {document.document_number && (
              <Badge variant="outline" className="font-mono text-xs">
                {document.document_number}
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {document.issue_date && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Issued: {formatDate(document.issue_date)}</span>
              </div>
            )}
            {document.expiry_date && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Expires: {formatDate(document.expiry_date)}</span>
              </div>
            )}
            {document.file_size && (
              <div className="text-xs text-muted-foreground">
                {formatFileSize(document.file_size)}
              </div>
            )}
          </div>

          {document.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
              {document.notes}
            </p>
          )}

          <Button onClick={handleDownload} className="w-full" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.document_name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
