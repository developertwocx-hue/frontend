"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Loader2, Plus, CalendarIcon, Check, Trash2 } from "lucide-react";
import { complianceService, ComplianceType } from "@/lib/compliance";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuickComplianceAddProps {
    vehicleId: number;
    onSuccess: () => void;
}

interface QueuedRecord {
    id: string; // temp id
    file: File | null;
    complianceTypeId: string;
    typeName: string;
    issueDate: Date | undefined;
    expiryDate: Date | undefined;
}

export function QuickComplianceAdd({ vehicleId, onSuccess }: QuickComplianceAddProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingTypes, setFetchingTypes] = useState(false);
    const [complianceTypes, setComplianceTypes] = useState<ComplianceType[]>([]);
    const { toast } = useToast();

    // Form State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [complianceTypeId, setComplianceTypeId] = useState<string>("");
    const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
    const [expiryDate, setExpiryDate] = useState<Date | undefined>();
    const [dragActive, setDragActive] = useState(false);

    // Queue State
    const [pendingRecords, setPendingRecords] = useState<QueuedRecord[]>([]);

    useEffect(() => {
        loadComplianceTypes();
    }, [vehicleId]);

    const loadComplianceTypes = async () => {
        setFetchingTypes(true);
        try {
            const res = await complianceService.getVehicleComplianceTypes(vehicleId);
            if (res.success) {
                const types = res.data?.compliance_types || res.data;
                if (Array.isArray(types)) {
                    setComplianceTypes(types);
                } else {
                    setComplianceTypes([]);
                }
            }
        } catch (error) {
            console.error("Failed to load compliance types", error);
        } finally {
            setFetchingTypes(false);
        }
    };

    // Auto-calculate expiry
    useEffect(() => {
        if (complianceTypeId && issueDate) {
            const type = complianceTypes.find(t => t.id.toString() === complianceTypeId);
            if (type && type.renewal_frequency_days) {
                const expiry = new Date(issueDate);
                expiry.setDate(expiry.getDate() + type.renewal_frequency_days);
                setExpiryDate(expiry);
            }
        }
    }, [complianceTypeId, issueDate, complianceTypes]);

    // Drag and Drop Handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        if (file.size > 100 * 1024 * 1024) { // 100MB limit
            toast({ title: "File too large", description: "Maximum file size is 100MB", variant: "destructive", });
            return;
        }
        setSelectedFile(file);
    };

    const addToQueue = () => {
        if (!complianceTypeId) {
            toast({ title: "Error", description: "Please select a compliance type", variant: "destructive" });
            return;
        }
        if (!issueDate || !expiryDate) {
            toast({ title: "Error", description: "Please select issue and expiry dates", variant: "destructive" });
            return;
        }

        const typeName = complianceTypes.find(t => t.id.toString() === complianceTypeId)?.name || "Unknown";

        const newRecord: QueuedRecord = {
            id: Math.random().toString(36).substr(2, 9),
            file: selectedFile,
            complianceTypeId,
            typeName,
            issueDate,
            expiryDate
        };

        setPendingRecords([...pendingRecords, newRecord]);

        // Reset form
        setComplianceTypeId("");
        setIssueDate(new Date());
        setExpiryDate(undefined);
        setSelectedFile(null);
        toast({ title: "Added to queue", description: "Record added to pending list." });
    };

    const removeFromQueue = (id: string) => {
        setPendingRecords(pendingRecords.filter(r => r.id !== id));
    };

    const handleUploadAll = async () => {
        let recordsToSubmit = [...pendingRecords];

        // Support Mixed Mode: Queue + Active Form
        // We check if the active form is "dirty" (Type OR File selected)
        const isFormDirty = !!(complianceTypeId || selectedFile);
        const isFormValid = !!(complianceTypeId && issueDate && expiryDate);

        // If user started filling the form but it's incomplete, BLOCK upload to prevent data loss or confusion.
        if (isFormDirty && !isFormValid) {
            toast({
                title: "Incomplete Record",
                description: "Please complete the active record details (Type & Dates) or Clear it before uploading.",
                variant: "destructive"
            });
            return;
        }

        // If form is fully valid, add it to the batch logic
        if (isFormValid) {
            const typeName = complianceTypes.find(t => t.id.toString() === complianceTypeId)?.name || "Unknown";
            recordsToSubmit.push({
                id: "current",
                file: selectedFile,
                complianceTypeId,
                typeName,
                issueDate,
                expiryDate
            });
        }

        if (recordsToSubmit.length === 0) {
            toast({ title: "Nothing to upload", description: "Please add records to the queue or fill out the form.", variant: "destructive" });
            return;
        }

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const record of recordsToSubmit) {
            try {
                const data = new FormData();
                data.append("compliance_type_id", record.complianceTypeId);
                data.append("issue_date", format(record.issueDate!, "yyyy-MM-dd"));
                data.append("expiry_date", format(record.expiryDate!, "yyyy-MM-dd"));

                if (record.file) {
                    data.append("file", record.file);
                    const selectedType = complianceTypes.find(t => t.id.toString() === record.complianceTypeId);
                    if (selectedType && selectedType.accepted_document_types?.length > 0) {
                        data.append("document_type_id", selectedType.accepted_document_types[0].toString());
                    }
                }

                const res = await complianceService.createComplianceRecord(vehicleId, data);
                if (res.success) successCount++;
                else failCount++;

            } catch (error) {
                console.error(error);
                failCount++;
            }
        }

        setLoading(false);

        if (successCount > 0) {
            toast({ title: "Success", description: `Uploaded ${successCount} record(s).` });
            setPendingRecords([]);
            // Clear form
            setComplianceTypeId("");
            setIssueDate(new Date());
            setExpiryDate(undefined);
            setSelectedFile(null);
            onSuccess();
        }
        if (failCount > 0) {
            toast({ title: "Warning", description: `Failed to upload ${failCount} record(s).`, variant: "destructive" });
        }
    };

    const clearAll = () => {
        setPendingRecords([]);
        setComplianceTypeId("");
        setIssueDate(new Date());
        setExpiryDate(undefined);
        setSelectedFile(null);
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-lg">Quick Add</CardTitle>
                    <CardDescription>Add documents and records</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    {(pendingRecords.length > 0 || complianceTypeId) && (
                        <Button variant="ghost" size="sm" onClick={clearAll} disabled={loading} className="text-muted-foreground h-8 text-xs">
                            Clear
                        </Button>
                    )}
                    <Button size="sm" onClick={handleUploadAll} disabled={loading || (pendingRecords.length === 0 && !complianceTypeId)}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {pendingRecords.length > 0 ? `Upload (${pendingRecords.length + (complianceTypeId ? 1 : 0)})` : "Upload"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">

                {/* Pending List Preview */}
                {pendingRecords.length > 0 && (
                    <div className="bg-muted/30 rounded-md p-2 space-y-2 max-h-[100px] overflow-y-auto border">
                        {pendingRecords.map((rec) => (
                            <div key={rec.id} className="flex items-center justify-between text-xs bg-background p-1.5 rounded border">
                                <div className="flex items-center gap-2 truncate">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span className="font-medium truncate">{rec.typeName}</span>
                                    {rec.file && <span className="text-muted-foreground truncate">- {rec.file.name}</span>}
                                </div>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFromQueue(rec.id)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* File Dropzone */}
                {!selectedFile && (
                    <div
                        className={cn(
                            "relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-muted/20",
                            dragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('quick-upload-input')?.click()}
                    >
                        <input
                            id="quick-upload-input"
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        />
                        <div className="flex flex-col items-center text-center p-2">
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">Drag & drop or click to upload</p>
                        </div>
                    </div>
                )}

                {selectedFile && (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-background p-2 rounded-full border border-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setSelectedFile(null)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Fields - Scrollable Area for Types */}
                <div className="space-y-4 flex-1">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold">Compliance Type <span className="text-destructive">*</span></Label>
                        <ScrollArea className="h-[140px] border rounded-md p-2 bg-muted/10">
                            <div className="flex flex-wrap gap-2">
                                {fetchingTypes ? (
                                    <span className="text-xs text-muted-foreground">Loading types...</span>
                                ) : (
                                    complianceTypes.map(type => (
                                        <Badge
                                            key={type.id}
                                            variant={complianceTypeId === type.id.toString() ? "default" : "outline"}
                                            className={cn(
                                                "cursor-pointer px-3 py-1 transition-all hover:opacity-80 text-xs font-normal border-dashed",
                                                complianceTypeId === type.id.toString() ? "bg-primary text-primary-foreground border-solid shadow-sm" : "hover:bg-muted"
                                            )}
                                            onClick={() => setComplianceTypeId(complianceTypeId === type.id.toString() ? "" : type.id.toString())}
                                        >
                                            {type.name}
                                            {complianceTypeId === type.id.toString() && <Check className="ml-1 h-3 w-3" />}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-semibold">Issue Date <span className="text-destructive">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal h-8 text-xs",
                                            !issueDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3 w-3" />
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
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-semibold">Expiry Date <span className="text-destructive">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal h-8 text-xs",
                                            !expiryDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-3 w-3" />
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
                </div>

                <div className="mt-auto pt-2">
                    <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={addToQueue}
                        disabled={!complianceTypeId}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Record
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
