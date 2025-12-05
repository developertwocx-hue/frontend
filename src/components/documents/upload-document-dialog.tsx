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
import { Upload, FileText } from "lucide-react";

interface UploadDocumentDialogProps {
  vehicleId: number;
  vehicleName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Maximum file size is 10MB",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: CreateDocumentData) => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setLoading(true);
      await createVehicleDocument(vehicleId, {
        ...data,
        file: selectedFile,
      });

      toast.success("Document uploaded successfully");
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Failed to upload document", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            {vehicleName
              ? `Upload a document for ${vehicleName}`
              : "Upload a document for this vehicle"}
          </DialogDescription>
        </DialogHeader>

        {loadingTypes ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <FormLabel>Document File *</FormLabel>
                <div className="mt-2">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, Image (max 10MB)</p>
                      </div>
                    )}
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileChange}
                    />
                  </label>
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
                        <Input type="date" {...field} />
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
                        <Input type="date" {...field} />
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
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !selectedFile}>
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
