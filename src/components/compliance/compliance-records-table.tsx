"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, FileText, History, Trash, Download, Pencil, Trash2 } from "lucide-react";
import { ComplianceRecord, complianceService } from "@/lib/compliance";
import { ComplianceStatusBadge } from "./compliance-status-badge";
import { format } from "date-fns";
import { ComplianceHistorySheet } from "./compliance-history-sheet";
import { useToast } from "@/components/ui/use-toast";

interface ComplianceRecordsTableProps {
    records: ComplianceRecord[];
    vehicleId: number;
    onRefresh: () => void;
    onEdit: (record: ComplianceRecord) => void;
    isLoading?: boolean;
}

export function ComplianceRecordsTable({ records, vehicleId, onRefresh, onEdit, isLoading = false }: ComplianceRecordsTableProps) {
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
    const [selectedRecords, setSelectedRecords] = useState<Record<number, boolean>>({});
    const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
    const { toast } = useToast();

    const handleDeleteClick = (recordId: number) => {
        setRecordToDelete(recordId);
        setConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!recordToDelete) return;

        try {
            await complianceService.deleteComplianceRecord(vehicleId, recordToDelete);
            toast({ title: "Success", description: "Record deleted successfully" });
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
        } finally {
            setConfirmDeleteOpen(false);
            setRecordToDelete(null);
        }
    };

    const handleDownload = async (recordId: number, fileName: string) => {
        try {
            const response = await complianceService.downloadComplianceDocument(vehicleId, recordId);

            // Get content type from response headers or default to application/pdf
            const contentType = response.headers['content-type'] || 'application/pdf';

            // Create blob with proper content type
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || `document-${recordId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Clean up the URL object
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed", error);
            toast({ title: "Error", description: "Failed to download document", variant: "destructive" });
        }
    };

    const handleViewHistory = (userId: number, requirementId: number) => {
        setSelectedRequirementId(requirementId);
        setHistoryOpen(true);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allSelected = records.reduce((acc, record) => {
                acc[record.id] = true;
                return acc;
            }, {} as Record<number, boolean>);
            setSelectedRecords(allSelected);
        } else {
            setSelectedRecords({});
        }
    };

    const handleSelectRecord = (recordId: number, checked: boolean) => {
        setSelectedRecords(prev => {
            const updated = { ...prev };
            if (checked) {
                updated[recordId] = true;
            } else {
                delete updated[recordId];
            }
            return updated;
        });
    };

    const selectedCount = Object.keys(selectedRecords).filter(key => selectedRecords[parseInt(key)]).length;
    const allSelected = records.length > 0 && selectedCount === records.length;

    const handleBulkDeleteClick = () => {
        if (selectedCount > 0) {
            setConfirmBulkDeleteOpen(true);
        }
    };

    const confirmBulkDelete = async () => {
        const idsToDelete = Object.keys(selectedRecords).filter(key => selectedRecords[parseInt(key)]).map(id => parseInt(id));

        try {
            await Promise.all(idsToDelete.map(id => complianceService.deleteComplianceRecord(vehicleId, id)));
            toast({ title: "Success", description: `${idsToDelete.length} record(s) deleted successfully` });
            setSelectedRecords({});
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete some records", variant: "destructive" });
        } finally {
            setConfirmBulkDeleteOpen(false);
        }
    };

    return (
        <>
            {selectedCount > 0 && (
                <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-md">
                    <span className="text-sm font-medium">{selectedCount} record(s) selected</span>
                    <Button variant="destructive" size="sm" onClick={handleBulkDeleteClick}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                    </Button>
                </div>
            )}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Loading records...
                                </TableCell>
                            </TableRow>
                        ) : records.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No compliance records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>
                                        <Checkbox
                                            checked={selectedRecords[record.id] || false}
                                            onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                                            aria-label={`Select record ${record.id}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {record.compliance_type.name}
                                        <div className="text-xs text-muted-foreground capitalize">{record.compliance_type.category}</div>
                                    </TableCell>
                                    <TableCell>{format(new Date(record.issue_date), "MMM d, yyyy")}</TableCell>
                                    <TableCell>
                                        {format(new Date(record.expiry_date), "MMM d, yyyy")}
                                        <div className="text-xs text-muted-foreground">
                                            {record.days_until_expiry < 0 ? `${Math.abs(record.days_until_expiry)} days overdue` : `${record.days_until_expiry} days left`}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <ComplianceStatusBadge status={record.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleViewHistory(vehicleId, record.vehicle_compliance_requirement_id)}>
                                                    <History className="mr-2 h-4 w-4" />
                                                    View History
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDownload(record.id, record.documents?.[0]?.document_name || "document")}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download Document
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onEdit(record)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(record.id)}>
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ComplianceHistorySheet
                vehicleId={vehicleId}
                requirementId={selectedRequirementId}
                open={historyOpen}
                onOpenChange={setHistoryOpen}
            />

            <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the compliance record and may affect the vehicle's compliance score.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={confirmBulkDeleteOpen} onOpenChange={setConfirmBulkDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedCount} record(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedCount} compliance record(s) and may affect the vehicle's compliance score.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
