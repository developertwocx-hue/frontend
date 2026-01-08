"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { complianceService, ComplianceType, ComplianceRecord } from "@/lib/compliance";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ComplianceFormDialogProps {
    vehicleId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    record?: ComplianceRecord | null;
}

export function ComplianceFormDialog({
    vehicleId,
    open,
    onOpenChange,
    onSuccess,
    record
}: ComplianceFormDialogProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingTypes, setFetchingTypes] = useState(false);
    const [complianceTypes, setComplianceTypes] = useState<ComplianceType[]>([]);

    const [complianceTypeId, setComplianceTypeId] = useState<string>("");
    const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
    const [expiryDate, setExpiryDate] = useState<Date | undefined>();
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (open) {
            loadComplianceTypes();
            if (record) {
                // Populate from props initially - convert ISO dates to Date objects
                const issueDateObj = record.issue_date ? new Date(record.issue_date) : new Date();
                const expiryDateObj = record.expiry_date ? new Date(record.expiry_date) : undefined;

                setComplianceTypeId(record.compliance_type_id.toString());
                setIssueDate(issueDateObj);
                setExpiryDate(expiryDateObj);

                // Fetch fresh details to ensure we have latest data
                fetchRecordDetails(record.id);
            } else {
                // Create mode: reset form
                setComplianceTypeId("");
                setIssueDate(new Date());
                setExpiryDate(undefined);
            }
            setFile(null);
        }
    }, [open, vehicleId, record]);

    const fetchRecordDetails = async (recordId: number) => {
        try {
            const res = await complianceService.getComplianceRecord(vehicleId, recordId);
            if (res.success && res.data) {
                const detailedRecord = res.data;
                // Convert ISO date strings to Date objects
                const issueDateObj = detailedRecord.issue_date ? new Date(detailedRecord.issue_date) : new Date();
                const expiryDateObj = detailedRecord.expiry_date ? new Date(detailedRecord.expiry_date) : undefined;

                setIssueDate(issueDateObj);
                setExpiryDate(expiryDateObj);
            }
        } catch (error) {
            console.error("Failed to fetch record details", error);
        }
    };

    const loadComplianceTypes = async () => {
        setFetchingTypes(true);
        try {
            const res = await complianceService.getVehicleComplianceTypes(vehicleId);
            if (res.success) {
                const types = res.data?.compliance_types || res.data;
                if (Array.isArray(types)) {
                    setComplianceTypes(types);
                } else {
                    console.warn("Compliance types response is not an array:", res.data);
                    setComplianceTypes([]);
                }
            }
        } catch (error: any) {
            console.error("Failed to load compliance types", error);
            toast.error("Failed to load compliance types", {
                description: error.response?.data?.message || "Please try again",
            });
        } finally {
            setFetchingTypes(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // Auto-calculate expiry when type or issue date changes
    useEffect(() => {
        if (complianceTypeId && issueDate) {
            const type = complianceTypes.find(t => t.id.toString() === complianceTypeId);
            if (type && type.renewal_frequency_days) {
                // Only auto-calculate if we're creating a new record or if expiry is not set
                if (!record || !expiryDate) {
                    const expiry = new Date(issueDate);
                    expiry.setDate(expiry.getDate() + type.renewal_frequency_days);
                    setExpiryDate(expiry);
                }
            }
        }
    }, [complianceTypeId, issueDate, complianceTypes]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!issueDate || !expiryDate) {
            toast.error("Please select both issue and expiry dates");
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();

            // If editing, we can't change type
            if (!record) {
                data.append("compliance_type_id", complianceTypeId);
            }

            data.append("issue_date", format(issueDate, "yyyy-MM-dd"));
            data.append("expiry_date", format(expiryDate, "yyyy-MM-dd"));

            if (file) {
                data.append("file", file);

                // Find selected type to get accepted document type
                const selectedType = complianceTypes.find(t => t.id.toString() === complianceTypeId);
                if (selectedType && selectedType.accepted_document_types?.length > 0) {
                    data.append("document_type_id", selectedType.accepted_document_types[0].toString());
                }
            }

            let res;
            if (record) {
                // Update
                if (file) {
                    res = await complianceService.updateComplianceRecord(vehicleId, record.id, data);
                } else {
                    res = await complianceService.updateComplianceRecord(vehicleId, record.id, {
                        compliance_type_id: complianceTypeId,
                        issue_date: format(issueDate, "yyyy-MM-dd"),
                        expiry_date: format(expiryDate, "yyyy-MM-dd")
                    });
                }
            } else {
                // Create
                res = await complianceService.createComplianceRecord(vehicleId, data);
            }

            if (res.success) {
                toast.success(`Compliance record ${record ? 'updated' : 'created'} successfully!`);
                onSuccess();
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to ${record ? 'update' : 'create'} compliance record`, {
                description: error.response?.data?.message || "Please try again",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{record ? "Edit" : "Add"} Compliance Record</DialogTitle>
                    <DialogDescription>
                        {record ? "Update existing compliance record details." : "Add a new compliance record for this vehicle."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="type">Compliance Type</Label>
                        <Select
                            value={complianceTypeId}
                            onValueChange={setComplianceTypeId}
                            disabled={fetchingTypes || !!record}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={fetchingTypes ? "Loading types..." : "Select type"} />
                            </SelectTrigger>
                            <SelectContent>
                                {complianceTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        <span className="truncate block max-w-[500px]">
                                            {type.name} ({type.category})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {record && (
                            <p className="text-xs text-muted-foreground">Compliance type cannot be changed when editing</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="issue_date">Issue Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !issueDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {issueDate ? format(issueDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={issueDate}
                                        onSelect={setIssueDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="expiry_date">Expiry Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !expiryDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={expiryDate}
                                        onSelect={setExpiryDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="file">{record ? "Replace Document (Optional)" : "Document (PDF, Image)"}</Label>
                        {record && record.documents && record.documents.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <span className="font-medium">Current:</span>
                                <span>{record.documents[0].document_name}</span>
                            </div>
                        )}
                        <Input
                            id="file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleFileChange}
                        />
                        {record ? (
                            <p className="text-xs text-muted-foreground">Leave empty to keep current document</p>
                        ) : (
                            complianceTypeId && complianceTypes.find(t => t.id.toString() === complianceTypeId)?.requires_document && (
                                <p className="text-xs text-orange-500">* Document required for this type</p>
                            )
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Record
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
