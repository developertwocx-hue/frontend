"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  createVehicleDocument,
  getDocumentTypesForVehicle,
  type DocumentType,
  type CreateDocumentData,
} from "@/lib/api/vehicleDocuments";
import { Upload, FileText, X, Check, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UploadDocumentDialogProps {
  vehicleId: number;
  vehicleName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface QueuedDocument {
  id: string;
  file: File | null;
  documentTypeId: number;
  documentTypeName: string;
  documentName: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  notes: string;
}

export function UploadDocumentDialog({
  vehicleId,
  vehicleName,
  open,
  onOpenChange,
  onSuccess,
}: UploadDocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pendingDocuments, setPendingDocuments] = useState<QueuedDocument[]>([]);

  const form = useForm<CreateDocumentData>({
    defaultValues: {
      vehicle_id: vehicleId,
      document_name: "",
      document_number: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open && vehicleId) {
      loadDocumentTypes();
    }
  }, [open, vehicleId]);

  const loadDocumentTypes = async () => {
    try {
      setLoadingTypes(true);
      const types = await getDocumentTypesForVehicle(vehicleId);
      setDocumentTypes(types);
    } catch (error: any) {
      toast.error("Failed to load document types", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 100MB",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const addToQueue = () => {
    const formData = form.getValues();

    if (!formData.document_type_id) {
      toast.error("Please select a document type");
      return;
    }
    if (!formData.document_name) {
      toast.error("Please enter a document name");
      return;
    }

    const typeName = documentTypes.find(t => t.id === formData.document_type_id)?.name || "Unknown";

    const newDocument: QueuedDocument = {
      id: Math.random().toString(36).substr(2, 9),
      file: selectedFile,
      documentTypeId: formData.document_type_id,
      documentTypeName: typeName,
      documentName: formData.document_name,
      documentNumber: formData.document_number || "",
      issueDate: formData.issue_date || "",
      expiryDate: formData.expiry_date || "",
      notes: formData.notes || "",
    };

    setPendingDocuments([...pendingDocuments, newDocument]);

    // Reset form
    form.reset({
      vehicle_id: vehicleId,
      document_name: "",
      document_number: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
    });
    setSelectedFile(null);
    toast.success("Document added to queue!");
  };

  const removeFromQueue = (id: string) => {
    setPendingDocuments(pendingDocuments.filter(d => d.id !== id));
  };

  const handleUploadAll = async () => {
    let documentsToSubmit = [...pendingDocuments];

    // Support Mixed Mode: Queue + Active Form
    const formData = form.getValues();
    const isFormDirty = !!(formData.document_type_id || selectedFile);
    const isFormValid = !!(formData.document_type_id && formData.document_name);

    // If user started filling the form but it's incomplete, BLOCK upload
    if (isFormDirty && !isFormValid) {
      toast.error("Incomplete Document", {
        description: "Please complete the active document details or Clear it before uploading.",
      });
      return;
    }

    // If form is fully valid, add it to the batch
    if (isFormValid) {
      const typeName = documentTypes.find(t => t.id === formData.document_type_id)?.name || "Unknown";
      documentsToSubmit.push({
        id: "current",
        file: selectedFile,
        documentTypeId: formData.document_type_id,
        documentTypeName: typeName,
        documentName: formData.document_name,
        documentNumber: formData.document_number || "",
        issueDate: formData.issue_date || "",
        expiryDate: formData.expiry_date || "",
        notes: formData.notes || "",
      });
    }

    if (documentsToSubmit.length === 0) {
      toast.error("Nothing to upload", { description: "Please add documents to the queue or fill out the form." });
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const doc of documentsToSubmit) {
      try {
        await createVehicleDocument(vehicleId, {
          vehicle_id: vehicleId,
          document_type_id: doc.documentTypeId,
          document_name: doc.documentName,
          document_number: doc.documentNumber,
          issue_date: doc.issueDate,
          expiry_date: doc.expiryDate,
          notes: doc.notes,
          file: doc.file as File,
        });
        successCount++;
      } catch (error) {
        console.error(error);
        failCount++;
      }
    }

    setLoading(false);

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} document(s) successfully!`);
      setPendingDocuments([]);
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess?.();
    }
    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} document(s)`, { description: "Please try again" });
    }
  };

  const clearAll = () => {
    setPendingDocuments([]);
    form.reset({
      vehicle_id: vehicleId,
      document_name: "",
      document_number: "",
      issue_date: "",
      expiry_date: "",
      notes: "",
    });
    setSelectedFile(null);
  };

  const onSubmit = async (data: CreateDocumentData) => {
    // If there are pending documents or form is being used for queue, use handleUploadAll
    if (pendingDocuments.length > 0 || (data.document_type_id && data.document_name)) {
      await handleUploadAll();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              {vehicleName
                ? `Upload documents for ${vehicleName}`
                : "Upload documents for this vehicle"}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            {(pendingDocuments.length > 0 || form.watch("document_type_id")) && (
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={loading} className="text-muted-foreground h-8 text-xs">
                Clear
              </Button>
            )}
            <Button size="sm" onClick={handleUploadAll} disabled={loading || (pendingDocuments.length === 0 && !form.watch("document_type_id"))}>
              {loading ? <LoadingSpinner size="sm" className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
              {pendingDocuments.length > 0 ? `Upload (${pendingDocuments.length + (form.watch("document_type_id") ? 1 : 0)})` : "Upload"}
            </Button>
          </div>
        </DialogHeader>

        {loadingTypes ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Pending Documents List */}
            {pendingDocuments.length > 0 && (
              <div className="bg-muted/30 rounded-md p-2 space-y-2 max-h-[120px] overflow-y-auto border">
                {pendingDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between text-xs bg-background p-2 rounded border">
                    <div className="flex items-center gap-2 truncate flex-1">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <div className="truncate">
                        <span className="font-medium">{doc.documentTypeName}</span>
                        <span className="text-muted-foreground"> - {doc.documentName}</span>
                        {doc.file && <span className="text-muted-foreground block truncate text-[10px]">{doc.file.name}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => removeFromQueue(doc.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="document_type_id"
                  rules={{ required: "Document type is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name} ({type.scope_type}{type.is_required ? " • Required" : ""})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the type of document you're uploading
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="document_name"
                  rules={{ required: "Document name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Insurance Certificate 2025" {...field} />
                      </FormControl>
                      <FormDescription>A descriptive name for this document</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="document_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., INS-2025-12345" {...field} />
                      </FormControl>
                      <FormDescription>Official document number or reference</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Document File</FormLabel>
                  <div className="mt-2">
                    {selectedFile ? (
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
                    ) : (
                      <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">PDF, Image (max 100MB)</p>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.gif"
                          onChange={handleFileChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                            placeholder="Select issue date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                            placeholder="Select expiry date"
                            fromDate={form.watch('issue_date') && form.watch('issue_date') !== '' ? new Date(form.watch('issue_date') as string) : undefined}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this document..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={addToQueue}
                    disabled={!form.watch("document_type_id")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Document
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
