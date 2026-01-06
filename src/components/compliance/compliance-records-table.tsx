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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, History, Trash, Download } from "lucide-react";
import { ComplianceRecord, complianceService } from "@/lib/compliance";
import { ComplianceStatusBadge } from "./compliance-status-badge";
import { format } from "date-fns";
import { ComplianceHistorySheet } from "./compliance-history-sheet";
import { useToast } from "@/components/ui/use-toast";

interface ComplianceRecordsTableProps {
    records: ComplianceRecord[];
    vehicleId: number;
    onRefresh: () => void;
}

export function ComplianceRecordsTable({ records, vehicleId, onRefresh }: ComplianceRecordsTableProps) {
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null);
    const { toast } = useToast();

    const handleDelete = async (recordId: number) => {
        if (!confirm("Are you sure you want to delete this record? This may affect the vehicle's compliance score.")) return;

        try {
            await complianceService.deleteComplianceRecord(vehicleId, recordId);
            toast({ title: "Success", description: "Record deleted successfully" });
            onRefresh();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
        }
    };

    const handleViewHistory = (userId: number, requirementId: number) => {
        setSelectedRequirementId(requirementId);
        setHistoryOpen(true);
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Issue Date</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No compliance records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            records.map((record) => (
                                <TableRow key={record.id}>
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
                                    <TableCell>
                                        {record.documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => window.open(doc.url, '_blank')}>
                                                <FileText className="h-4 w-4" />
                                                <span className="truncate max-w-[150px]">{doc.document_name}</span>
                                            </div>
                                        ))}
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
                                                {record.documents.length > 0 && (
                                                    <DropdownMenuItem onClick={() => window.open(record.documents[0].url, '_blank')}>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download Document
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(record.id)}>
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
        </>
    );
}
