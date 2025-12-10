"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { vehicleTypeService } from "@/lib/vehicles";
import { Download, Upload, AlertCircle, CheckCircle, XCircle, FileSpreadsheet, ArrowLeft, ChevronLeft, ChevronRight, Edit2, ArrowDown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface VehicleType {
  id: number;
  name: string;
}

interface PreviewRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  isValid: boolean;
}

interface PreviewData {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: PreviewRow[];
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
    has_more: boolean;
  };
}

interface DetectedType {
  id: number;
  name: string;
  confidence: number;
}

export default function VehicleImportPage() {
  const router = useRouter();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [detectedType, setDetectedType] = useState<DetectedType | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editedRows, setEditedRows] = useState<Map<number, Record<string, any>>>(new Map());
  const [editingCell, setEditingCell] = useState<{rowNumber: number, fieldKey: string} | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [autoImportCountdown, setAutoImportCountdown] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("");

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  // Auto-import countdown
  useEffect(() => {
    if (previewData && previewData.invalidRows === 0 && previewData.totalRows > 0) {
      setAutoImportCountdown(5);
    } else {
      setAutoImportCountdown(null);
    }
  }, [previewData?.invalidRows, previewData?.totalRows]);

  useEffect(() => {
    if (autoImportCountdown === null) return;

    if (autoImportCountdown === 0) {
      handleImport();
      return;
    }

    const timer = setTimeout(() => {
      setAutoImportCountdown(autoImportCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoImportCountdown]);

  const loadVehicleTypes = async () => {
    try {
      const response = await vehicleTypeService.getAll();
      setVehicleTypes(response.data || []);

      // Auto-select if only one type
      if (response.data.length === 1) {
        setSelectedTypeId(response.data[0].id.toString());
      }
    } catch (error) {
      toast.error("Failed to load vehicle types");
    } finally {
      setLoading(false);
    }
  };

  const detectVehicleTypeFromFile = async (file: File) => {
    try {
      // Read file headers
      const formData = new FormData();
      formData.append('file', file);

      // Create a temporary preview to get headers
      const response = await api.post('/vehicles/import/preview', {
        ...formData,
        vehicle_type_id: vehicleTypes[0]?.id.toString(), // Use first type temporarily
        page: 1,
        per_page: 1
      });

      // This is a simplified version - in production you'd want a dedicated endpoint
      // For now, try to match based on vehicle type name in filename
      const fileName = file.name.toLowerCase();
      let bestMatch: DetectedType | null = null;
      let maxConfidence = 0;

      for (const type of vehicleTypes) {
        const typeName = type.name.toLowerCase();
        if (fileName.includes(typeName)) {
          const confidence = 95;
          if (confidence > maxConfidence) {
            bestMatch = { id: type.id, name: type.name, confidence };
            maxConfidence = confidence;
          }
        }
      }

      // If no match from filename, check if using the downloaded template
      if (!bestMatch && fileName.includes('_import_template')) {
        const typeNameMatch = fileName.match(/^(.+)_import_template/);
        if (typeNameMatch) {
          const typeName = typeNameMatch[1].replace(/_/g, ' ');
          const matchedType = vehicleTypes.find(t =>
            t.name.toLowerCase() === typeName.toLowerCase()
          );
          if (matchedType) {
            bestMatch = { id: matchedType.id, name: matchedType.name, confidence: 90 };
          }
        }
      }

      if (bestMatch) {
        setDetectedType(bestMatch);
        setSelectedTypeId(bestMatch.id.toString());
        return bestMatch;
      }

      // No detection, show selector
      setShowTypeSelector(true);
      return null;
    } catch (error) {
      setShowTypeSelector(true);
      return null;
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedTypeId) {
      toast.error("Please select a vehicle type");
      return;
    }

    setDownloading(true);
    try {
      const response = await api.get(`/vehicle-types/${selectedTypeId}/import-template`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const vehicleType = vehicleTypes.find(vt => vt.id === parseInt(selectedTypeId));
      link.setAttribute('download', `${vehicleType?.name || 'vehicle'}_import_template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Template downloaded successfully");
    } catch (error: any) {
      toast.error("Failed to download template", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload an Excel (.xlsx, .xls) or CSV file",
      });
      return;
    }

    setSelectedFile(file);
    setPreviewData(null);
    setEditedRows(new Map());
    setCurrentPage(1);

    // Detect vehicle type from file
    const detected = await detectVehicleTypeFromFile(file);

    // Auto-preview if vehicle type was detected or already selected
    const typeIdToUse = detected?.id.toString() || selectedTypeId;
    if (typeIdToUse) {
      setTimeout(() => handleUploadAndPreview(1, file, typeIdToUse), 500);
    }
  };

  const handleUploadAndPreview = async (page: number = 1, fileOverride?: File, typeIdOverride?: string) => {
    const fileToUse = fileOverride || selectedFile;
    const typeIdToUse = typeIdOverride || selectedTypeId;

    if (!fileToUse) {
      toast.error("Please select a file");
      return;
    }

    if (!typeIdToUse) {
      toast.error("Please select a vehicle type");
      setShowTypeSelector(true);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setProcessingMessage("Uploading file...");

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      setProcessingMessage("Reading file data...");

      const formData = new FormData();
      formData.append('file', fileToUse);
      formData.append('vehicle_type_id', typeIdToUse);
      formData.append('page', page.toString());
      formData.append('per_page', '20');

      setProcessingMessage("Validating rows...");

      const response = await api.post('/vehicles/import/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(100);
      setProcessingMessage("Processing complete!");

      setTimeout(() => {
        setPreviewData(response.data.data);
        setCurrentPage(page);
        setUploadProgress(0);
        setProcessingMessage("");

        if (page === 1) {
          if (response.data.data.invalidRows > 0) {
            toast.warning(`Found ${response.data.data.invalidRows} invalid rows`, {
              description: "Click on cells with errors to edit them",
            });
          } else if (response.data.data.totalRows > 0) {
            toast.success(`All ${response.data.data.totalRows} rows are valid!`, {
              description: "Auto-importing in 5 seconds...",
            });
          }
        }
      }, 300);
    } catch (error: any) {
      toast.error("Failed to process file", {
        description: error.response?.data?.message || "Please try again",
      });
      setUploadProgress(0);
      setProcessingMessage("");
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setUploading(false);
      }, 300);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || (previewData && newPage > previewData.pagination.total_pages)) {
      return;
    }
    handleUploadAndPreview(newPage);
  };

  const handleCellEdit = (rowNumber: number, fieldKey: string, newValue: string) => {
    const row = previewData?.rows.find(r => r.rowNumber === rowNumber);
    if (!row) return;

    const updatedData = editedRows.get(rowNumber) || { ...row.data };
    updatedData[fieldKey] = newValue;

    const newEditedRows = new Map(editedRows);
    newEditedRows.set(rowNumber, updatedData);
    setEditedRows(newEditedRows);

    if (previewData) {
      const updatedRows = previewData.rows.map(r => {
        if (r.rowNumber === rowNumber) {
          const updatedRowData = { ...r.data, [fieldKey]: newValue };
          const errors = validateRowField(updatedRowData, fieldKey, newValue);

          const otherErrors = r.errors.filter(e => !e.toLowerCase().includes(fieldKey.toLowerCase()));
          const newErrors = [...otherErrors, ...errors];
          const isValid = newErrors.length === 0;

          return {
            ...r,
            data: updatedRowData,
            errors: newErrors,
            isValid
          };
        }
        return r;
      });

      const validRows = updatedRows.filter(r => r.isValid).length;
      const invalidRows = updatedRows.filter(r => !r.isValid).length;

      setPreviewData({
        ...previewData,
        rows: updatedRows,
        validRows,
        invalidRows
      });
    }

    setEditingCell(null);
  };

  const handleBulkFillDown = (fieldKey: string) => {
    if (!previewData) return;

    const firstRow = previewData.rows[0];
    const fillValue = firstRow?.data[fieldKey];

    if (!fillValue) {
      toast.error("First row must have a value to fill down");
      return;
    }

    const updatedRows = previewData.rows.map(row => {
      if (!row.data[fieldKey] || row.data[fieldKey] === '') {
        const updatedData = { ...row.data, [fieldKey]: fillValue };

        // Update edited rows map
        const newEditedRows = new Map(editedRows);
        newEditedRows.set(row.rowNumber, updatedData);
        setEditedRows(newEditedRows);

        // Re-validate
        const errors = validateRowField(updatedData, fieldKey, fillValue);
        const otherErrors = row.errors.filter(e => !e.toLowerCase().includes(fieldKey.toLowerCase()));
        const newErrors = [...otherErrors, ...errors];

        return {
          ...row,
          data: updatedData,
          errors: newErrors,
          isValid: newErrors.length === 0
        };
      }
      return row;
    });

    const validRows = updatedRows.filter(r => r.isValid).length;
    const invalidRows = updatedRows.filter(r => !r.isValid).length;

    setPreviewData({
      ...previewData,
      rows: updatedRows,
      validRows,
      invalidRows
    });

    toast.success(`Filled ${fieldKey} for empty rows`);
  };

  const validateRowField = (rowData: Record<string, any>, fieldKey: string, value: string): string[] => {
    const errors: string[] = [];

    if (!value || value.trim() === '') {
      if (fieldKey !== 'notes') {
        errors.push(`${fieldKey} is required`);
      }
    }

    if (fieldKey === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${fieldKey} must be a valid email`);
      }
    }

    if (fieldKey === 'year' && value) {
      const year = parseInt(value);
      if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
        errors.push(`${fieldKey} must be a valid year`);
      }
    }

    return errors;
  };

  const handleImport = async () => {
    if (!previewData || previewData.invalidRows > 0) {
      toast.error("Cannot import with invalid rows", {
        description: "Please fix all validation errors first",
      });
      return;
    }

    setImporting(true);
    setAutoImportCountdown(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile!);
      formData.append('vehicle_type_id', selectedTypeId);

      if (editedRows.size > 0) {
        const editedRowsArray = Array.from(editedRows.entries()).map(([rowNumber, data]) => ({
          rowNumber,
          data
        }));
        formData.append('edited_rows', JSON.stringify(editedRowsArray));
      }

      const response = await api.post('/vehicles/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`Successfully imported ${response.data.data.imported} vehicles!`);

      setTimeout(() => {
        router.push('/dashboard/vehicles');
      }, 1500);
    } catch (error: any) {
      toast.error("Failed to import vehicles", {
        description: error.response?.data?.message || "Please try again",
      });
    } finally {
      setImporting(false);
    }
  };

  const getCellClassName = (row: PreviewRow, fieldKey: string) => {
    const hasError = !row.isValid && row.errors.some(e => e.toLowerCase().includes(fieldKey.toLowerCase()));
    const isEdited = editedRows.has(row.rowNumber);

    if (hasError) {
      return "bg-destructive/10 text-destructive border border-destructive/50 cursor-pointer hover:bg-destructive/20";
    }
    if (isEdited) {
      return "bg-blue-50 border border-blue-300";
    }
    return "";
  };

  const renderEditableCell = (row: PreviewRow, fieldKey: string, value: any) => {
    const isEditing = editingCell?.rowNumber === row.rowNumber && editingCell?.fieldKey === fieldKey;
    const displayValue = editedRows.get(row.rowNumber)?.[fieldKey] ?? value;
    const hasError = !row.isValid && row.errors.some(e => e.toLowerCase().includes(fieldKey.toLowerCase()));

    if (isEditing) {
      return (
        <Input
          autoFocus
          defaultValue={displayValue?.toString() || ''}
          onBlur={(e) => handleCellEdit(row.rowNumber, fieldKey, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellEdit(row.rowNumber, fieldKey, e.currentTarget.value);
            } else if (e.key === 'Escape') {
              setEditingCell(null);
            }
          }}
          className="h-8 text-sm"
        />
      );
    }

    return (
      <div
        className={`p-2 ${getCellClassName(row, fieldKey)} flex items-center justify-between group`}
        onClick={() => hasError && setEditingCell({ rowNumber: row.rowNumber, fieldKey })}
      >
        <span>{displayValue?.toString() || '-'}</span>
        {hasError && (
          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
        )}
      </div>
    );
  };

  const getErrorsByType = () => {
    if (!previewData) return {};

    const errorMap: Record<string, number> = {};

    previewData.rows.forEach(row => {
      row.errors.forEach(error => {
        errorMap[error] = (errorMap[error] || 0) + 1;
      });
    });

    return errorMap;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const errorsByType = getErrorsByType();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/vehicles')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicles
            </Button>
          </div>

          {!selectedFile && (
            <Button
              onClick={handleDownloadTemplate}
              disabled={!selectedTypeId || downloading}
              variant="outline"
            >
              {downloading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </>
              )}
            </Button>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Vehicles</h1>
          <p className="text-muted-foreground mt-2">
            Drag and drop your Excel file or click to browse
          </p>
        </div>

        {/* Vehicle Type Selector - Show if multiple types or detection failed */}
        {(vehicleTypes.length > 1 && (showTypeSelector || !selectedFile)) && (
          <Card>
            <CardHeader>
              <CardTitle>Select Vehicle Type</CardTitle>
              <CardDescription>
                Choose the type of vehicles you're importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Detected Type Alert */}
        {detectedType && !showTypeSelector && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Vehicle type auto-detected: {detectedType.name}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{detectedType.confidence}% confidence match</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowTypeSelector(true)}
              >
                Change type
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Drag & Drop Upload Zone */}
        {!previewData && (
          <Card>
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                } ${!selectedTypeId ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your Excel file'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse (.xlsx, .xls, .csv)
                </p>
                {selectedFile && !uploading && (
                  <Badge variant="secondary" className="mt-2">
                    {selectedFile.name}
                  </Badge>
                )}
                <Input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {!selectedTypeId && vehicleTypes.length > 1 && (
                <p className="text-sm text-destructive text-center mt-4">
                  Please select a vehicle type first
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {uploading && !previewData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Processing Your File
              </CardTitle>
              <CardDescription>
                {processingMessage}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={uploadProgress} className="w-full" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{selectedFile?.name}</span>
                <span>{uploadProgress}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Summary */}
        {previewData && previewData.invalidRows > 0 && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Validation Issues Found
              </CardTitle>
              <CardDescription>
                Fix these errors before importing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(errorsByType).slice(0, 5).map(([error, count]) => (
                  <div key={error} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{error}</p>
                      <p className="text-xs text-muted-foreground">{count} row(s) affected</p>
                    </div>
                  </div>
                ))}
                {Object.keys(errorsByType).length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{Object.keys(errorsByType).length - 5} more error types
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {previewData && (
          <>
            {/* Summary Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Import Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{previewData.totalRows}</p>
                      <p className="text-sm text-muted-foreground">Total Rows</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{previewData.validRows}</p>
                      <p className="text-sm text-muted-foreground">Valid Rows</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-destructive">{previewData.invalidRows}</p>
                      <p className="text-sm text-muted-foreground">Invalid Rows</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Auto-import countdown */}
            {autoImportCountdown !== null && autoImportCountdown > 0 && (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">All data is valid!</AlertTitle>
                <AlertDescription className="flex items-center justify-between text-green-800">
                  <span>Auto-importing in {autoImportCountdown} seconds...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoImportCountdown(null)}
                    className="ml-4"
                  >
                    Cancel
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Data Preview</CardTitle>
                    <CardDescription>
                      Click red cells to edit inline. Use toolbar for bulk operations.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || uploading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {previewData.pagination.current_page} of {previewData.pagination.total_pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!previewData.pagination.has_more || uploading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Bulk Edit Toolbar */}
                {previewData.rows[0] && (
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <Label className="text-xs text-muted-foreground">Quick fixes:</Label>
                    {Object.keys(previewData.rows[0].data).map((key) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkFillDown(key)}
                        className="text-xs"
                      >
                        <ArrowDown className="h-3 w-3 mr-1" />
                        Fill {key}
                      </Button>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left font-medium bg-muted sticky left-0">Row</th>
                        <th className="p-2 text-left font-medium bg-muted">Status</th>
                        {previewData.rows[0] && Object.keys(previewData.rows[0].data).map((key) => (
                          <th key={key} className="p-2 text-left font-medium bg-muted whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                        <th className="p-2 text-left font-medium bg-muted">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.rows.map((row) => (
                        <tr key={row.rowNumber} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium sticky left-0 bg-background">{row.rowNumber}</td>
                          <td className="p-2">
                            {row.isValid ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/50">
                                <XCircle className="h-3 w-3 mr-1" />
                                Invalid
                              </Badge>
                            )}
                          </td>
                          {Object.entries(row.data).map(([key, value]) => (
                            <td key={key} className="p-0">
                              {renderEditableCell(row, key, value)}
                            </td>
                          ))}
                          <td className="p-2 max-w-xs">
                            {row.errors.length > 0 && (
                              <div className="space-y-1">
                                {row.errors.map((error, idx) => (
                                  <p key={idx} className="text-xs text-destructive flex items-start gap-1">
                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                    {error}
                                  </p>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setPreviewData(null);
                  setSelectedFile(null);
                  setEditedRows(new Map());
                  setCurrentPage(1);
                  setDetectedType(null);
                  setShowTypeSelector(false);
                  setAutoImportCountdown(null);
                }}
              >
                Cancel & Upload New File
              </Button>

              <div className="flex items-center gap-4">
                {editedRows.size > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {editedRows.size} row(s) edited
                  </Badge>
                )}
                <Button
                  onClick={handleImport}
                  disabled={previewData.invalidRows > 0 || importing}
                  size="lg"
                >
                  {importing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Import {previewData.validRows} Vehicles
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
