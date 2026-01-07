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
import { Textarea } from "@/components/ui/textarea";
import { complianceService, ComplianceType, ComplianceRecord } from "@/lib/compliance";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

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
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        compliance_type_id: "",
        issue_date: "",
        expiry_date: "",
    });
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (open) {
            loadComplianceTypes();
            if (record) {
                // Populate from props initially - convert ISO dates to YYYY-MM-DD
                const issueDate = record.issue_date ? record.issue_date.split('T')[0] : '';
                const expiryDate = record.expiry_date ? record.expiry_date.split('T')[0] : '';

                setFormData({
                    compliance_type_id: record.compliance_type_id.toString(),
                    issue_date: issueDate,
                    expiry_date: expiryDate,
                });

                // Fetch fresh details to ensure we have latest data
                // (Useful if other users updated it or if list view is stale)
                fetchRecordDetails(record.id);
            } else {
                // Create mode: reset form
                setFormData({
                    compliance_type_id: "",
                    issue_date: new Date().toISOString().split('T')[0],
                    expiry_date: "",
                });
            }
            setFile(null);
        }
    }, [open, vehicleId, record]);

    const fetchRecordDetails = async (recordId: number) => {
        try {
            const res = await complianceService.getComplianceRecord(vehicleId, recordId);
            if (res.success && res.data) {
                const detailedRecord = res.data;
                // Convert ISO date strings to YYYY-MM-DD format for date inputs
                const issueDate = detailedRecord.issue_date ? detailedRecord.issue_date.split('T')[0] : '';
                const expiryDate = detailedRecord.expiry_date ? detailedRecord.expiry_date.split('T')[0] : '';

                setFormData(prev => ({
                    ...prev,
                    issue_date: issueDate,
                    expiry_date: expiryDate,
                }));
            }
        } catch (error) {
            console.error("Failed to fetch record details", error);
        }
    };

    const loadComplianceTypes = async () => {
        setFetchingTypes(true);
        try {
            // Fetch compliance types filtered by vehicle type
            // This endpoint automatically filters by the vehicle's type and state
            const res = await complianceService.getVehicleComplianceTypes(vehicleId);
            if (res.success) {
                // The response has nested structure: { vehicle: {...}, compliance_types: [...] }
                const types = res.data?.compliance_types || res.data;
                if (Array.isArray(types)) {
                    setComplianceTypes(types);
                } else {
                    console.warn("Compliance types response is not an array:", res.data);
                    setComplianceTypes([]);
                }
            }
        } catch (error) {
            console.error("Failed to load compliance types", error);
            toast({
                title: "Error",
                description: "Failed to load compliance types.",
                variant: "destructive",
            });
        } finally {
            setFetchingTypes(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const calculateExpiry = (typeId: string, issueDateObj: Date) => {
        const type = complianceTypes.find(t => t.id.toString() === typeId);
        if (type && type.renewal_frequency_days) {
            const expiry = new Date(issueDateObj);
            expiry.setDate(expiry.getDate() + type.renewal_frequency_days);
            return expiry.toISOString().split('T')[0];
        }
        return "";
    };

    // Auto-calculate expiry when type or issue date changes
    useEffect(() => {
        // Only auto-calc if NOT editing or if user changes dates manually?
        // If editing, we preserve existing dates unless user changes things.
        // But logic below triggers whenever type/issue date changes.
        // If I open edit dialog, form data is set. Effect runs.
        // It might overwrite existing expiry if issue date matches logic?
        // To be safe, I should only run this if NOT editing or if ONLY issue date changed? 
        // For simplicity, I'll let it run but check if explicit override needed.
        // Actually, if editing, we might not want to auto-calc immediately on load.
        // But `formData` is set in the other effect.
        if (record && formData.expiry_date === record.expiry_date && formData.issue_date === record.issue_date) {
            return; // Don't recalc on initial load
        }

        if (formData.compliance_type_id && formData.issue_date) {
            const expiry = calculateExpiry(formData.compliance_type_id, new Date(formData.issue_date));
            if (expiry) {
                setFormData(prev => {
                    // Check if expiry is already set to something else? 
                    // For better UX, maybe only update if expiry is empty OR if logic dictates.
                    // But user requests "edit modal", so let's just keep it simple.
                    // The user previously wanted auto-calc.
                    if (!prev.expiry_date || !record) return { ...prev, expiry_date: expiry };
                    return prev;
                });
            }
        }
    }, [formData.compliance_type_id, formData.issue_date, complianceTypes, record]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();

            // If editing, we can't change type, so maybe don't append it? API guide says "Cannot change compliance_type_id".
            if (!record) {
                data.append("compliance_type_id", formData.compliance_type_id);
            }

            data.append("issue_date", formData.issue_date);
            data.append("expiry_date", formData.expiry_date);

            if (file) {
                data.append("file", file);

                // Find selected type to get accepted document type
                const selectedType = complianceTypes.find(t => t.id.toString() === formData.compliance_type_id);
                if (selectedType && selectedType.accepted_document_types?.length > 0) {
                    // Use the first accepted document type
                    data.append("document_type_id", selectedType.accepted_document_types[0].toString());
                }
            }

            let res;
            if (record) {
                // Update
                // If using _method=PUT with FormData, we must POST. 
                // complianceService.updateComplianceRecord calls PUT.
                // We should probably create a custom call or modify service.
                // Let's call api.post directly or modify the method?
                if (file) {
                    // Use specific call for update with file (POST + _method: PUT handled by service)
                    res = await complianceService.updateComplianceRecord(vehicleId, record.id, data);
                } else {
                    // JSON update
                    res = await complianceService.updateComplianceRecord(vehicleId, record.id, {
                        compliance_type_id: formData.compliance_type_id,
                        issue_date: formData.issue_date,
                        expiry_date: formData.expiry_date
                    });
                }
            } else {
                // Create
                res = await complianceService.createComplianceRecord(vehicleId, data);
            }

            if (res.success) {
                toast({ title: "Success", description: `Compliance record ${record ? 'updated' : 'created'} successfully.` });
                onSuccess();
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.response?.data?.message || `Failed to ${record ? 'update' : 'create'} compliance record.`,
                variant: "destructive"
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
                            value={formData.compliance_type_id}
                            onValueChange={(val) => handleInputChange("compliance_type_id", val)}
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
                            <Input
                                id="issue_date"
                                type="date"
                                value={formData.issue_date}
                                onChange={(e) => handleInputChange("issue_date", e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="expiry_date">Expiry Date</Label>
                            <Input
                                id="expiry_date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => handleInputChange("expiry_date", e.target.value)}
                                required
                            />
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
                            formData.compliance_type_id && complianceTypes.find(t => t.id.toString() === formData.compliance_type_id)?.requires_document && (
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
