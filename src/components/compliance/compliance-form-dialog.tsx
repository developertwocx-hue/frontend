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
import { complianceService, ComplianceType } from "@/lib/compliance";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ComplianceFormDialogProps {
    vehicleId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function ComplianceFormDialog({
    vehicleId,
    open,
    onOpenChange,
    onSuccess,
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
            // Reset form on open
            setFormData({
                compliance_type_id: "",
                issue_date: new Date().toISOString().split('T')[0],
                expiry_date: "",
            });
            setFile(null);
        }
    }, [open, vehicleId]);

    const loadComplianceTypes = async () => {
        setFetchingTypes(true);
        try {
            const res = await complianceService.getComplianceTypes();
            if (res.success) {
                if (Array.isArray(res.data)) {
                    setComplianceTypes(res.data);
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
        if (formData.compliance_type_id && formData.issue_date) {
            const expiry = calculateExpiry(formData.compliance_type_id, new Date(formData.issue_date));
            if (expiry) {
                setFormData(prev => {
                    // Only auto-fill if empty or we want to enforce it? 
                    // Better to only fill if empty to allow override
                    if (!prev.expiry_date) return { ...prev, expiry_date: expiry };
                    return prev;
                });
            }
        }
    }, [formData.compliance_type_id, formData.issue_date, complianceTypes]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append("compliance_type_id", formData.compliance_type_id);
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

            const res = await complianceService.createComplianceRecord(vehicleId, data);

            if (res.success) {
                toast({ title: "Success", description: "Compliance record created successfully." });
                onSuccess();
                onOpenChange(false);
            }
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to create compliance record.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Compliance Record</DialogTitle>
                    <DialogDescription>
                        Add a new compliance record for this vehicle.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="type">Compliance Type</Label>
                        <Select
                            value={formData.compliance_type_id}
                            onValueChange={(val) => handleInputChange("compliance_type_id", val)}
                            disabled={fetchingTypes}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={fetchingTypes ? "Loading types..." : "Select type"} />
                            </SelectTrigger>
                            <SelectContent>
                                {complianceTypes.map((type) => (
                                    <SelectItem key={type.id} value={type.id.toString()}>
                                        {type.name} ({type.category})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <Label htmlFor="file">Document (PDF, Image)</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleFileChange}
                        />
                        {/* Display requirement hint if selected type requires doc */}
                        {formData.compliance_type_id && complianceTypes.find(t => t.id.toString() === formData.compliance_type_id)?.requires_document && (
                            <p className="text-xs text-orange-500">* Document required for this type</p>
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
