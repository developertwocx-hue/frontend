"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, AlertCircle, FileCheck, ScrollText, Shield, Calendar, Wrench, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FieldValue {
  name: string;
  value: string;
  unit?: string;
}

interface DocumentType {
  id: number;
  name: string;
}

interface Document {
  id: number;
  document_type_id?: number;
  document_type?: DocumentType;
  document_name: string;
  document_number?: string;
  file_path: string;
  expiry_date?: string;
  is_expired: boolean;
}

interface VehicleData {
  id: number;
  vehicle_type: string;
  status: string;
  field_values: FieldValue[];
  documents: Document[];
}

export default function PublicVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchVehicle = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${apiUrl}/public/vehicles/${token}`);

        if (!response.ok) {
          throw new Error('Vehicle not found');
        }

        const data = await response.json();
        setVehicle(data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicle');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-700 border-green-500/50";
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/50";
      case "inactive":
        return "bg-gray-500/20 text-gray-700 border-gray-500/50";
      case "sold":
        return "bg-blue-500/20 text-blue-700 border-blue-500/50";
      default:
        return "";
    }
  };

  const getDocumentIcon = (docType: string) => {
    const type = docType.toLowerCase();
    if (type.includes('registration') || type.includes('title')) {
      return <FileCheck className="h-5 w-5 text-blue-600" />;
    } else if (type.includes('insurance')) {
      return <Shield className="h-5 w-5 text-green-600" />;
    } else if (type.includes('inspection') || type.includes('maintenance')) {
      return <Wrench className="h-5 w-5 text-orange-600" />;
    } else if (type.includes('permit') || type.includes('license')) {
      return <ScrollText className="h-5 w-5 text-purple-600" />;
    } else if (type.includes('receipt') || type.includes('invoice')) {
      return <Calendar className="h-5 w-5 text-pink-600" />;
    }
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const getDocumentTypeIcon = (docType: string) => {
    const type = docType.toLowerCase();
    if (type.includes('registration') || type.includes('title')) {
      return <FileCheck className="h-6 w-6 text-blue-600" />;
    } else if (type.includes('insurance')) {
      return <Shield className="h-6 w-6 text-green-600" />;
    } else if (type.includes('inspection') || type.includes('maintenance')) {
      return <Wrench className="h-6 w-6 text-orange-600" />;
    } else if (type.includes('permit') || type.includes('license')) {
      return <ScrollText className="h-6 w-6 text-purple-600" />;
    } else if (type.includes('receipt') || type.includes('invoice')) {
      return <Calendar className="h-6 w-6 text-pink-600" />;
    }
    return <FileText className="h-6 w-6 text-gray-600" />;
  };

  const handleDownload = (doc: Document) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    const fileUrl = `${baseUrl}/storage/${doc.file_path}`;
    window.open(fileUrl, "_blank");
  };

  const getFieldValue = (key: string): string => {
    const field = vehicle?.field_values.find(f => f.name.toLowerCase().includes(key.toLowerCase()));
    return field ? `${field.value}${field.unit ? ' ' + field.unit : ''}` : 'N/A';
  };

  const getVehicleName = (): string => {
    const nameField = vehicle?.field_values.find(f => f.name.toLowerCase() === 'name');
    return nameField?.value || vehicle?.vehicle_type || 'Vehicle';
  };

  // Group documents by document type
  const groupedDocuments = vehicle?.documents.reduce((acc, doc) => {
    const typeName = doc.document_type?.name || 'Other Documents';
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(doc);
    return acc;
  }, {} as Record<string, Document[]>) || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Vehicle Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || 'The vehicle you are looking for does not exist or the link is invalid.'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/30 dark:to-blue-950/20">
      {/* Branded Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 mx-auto">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div className="text-center">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Cranelift SaaS
                </h1>
                <p className="text-xs text-muted-foreground">Vehicle Management System</p>
              </div>
            </div>
            <div className="w-10 shrink-0"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Vehicle Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold">{getVehicleName()}</h2>
          <div className="flex items-center justify-center gap-3">
            <Badge variant="outline" className="text-sm">
              {vehicle.vehicle_type}
            </Badge>
            <Badge className={`${getStatusColor(vehicle.status)} capitalize border font-medium`}>
              {vehicle.status}
            </Badge>
          </div>
        </div>

        {/* Tabs for Vehicle Information and Documents */}
        <Tabs defaultValue="information" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="information" className="text-base">
              <FileText className="h-4 w-4 mr-2" />
              Vehicle Information
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-base">
              <FileCheck className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Vehicle Information Tab */}
          <TabsContent value="information">
            <Card className="border-2 shadow-lg">
              <div className="p-6">
                {vehicle.field_values.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicle.field_values.map((field, index) => (
                      <div key={index} className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                          {field.name}
                        </p>
                        <p className="font-semibold text-lg">
                          {field.value}{field.unit && ` ${field.unit}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No vehicle information available</p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            {Object.keys(groupedDocuments).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedDocuments).map(([docType, docs]) => (
                  <Card key={docType} className="border-2 shadow-lg overflow-hidden">
                    {/* Document Type Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl shadow-lg">
                          {getDocumentTypeIcon(docType)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-xl">{docType}</h3>
                          <p className="text-sm text-white/90 mt-1">
                            {docs.length} {docs.length === 1 ? 'document available' : 'documents available'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 text-base font-bold">
                          {docs.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Documents Grid */}
                    <div className="p-6 bg-gradient-to-br from-background to-muted/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="group relative p-5 bg-background hover:bg-accent rounded-xl cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 border-muted hover:border-blue-200"
                            onClick={() => handleDownload(doc)}
                          >
                            {/* Document Icon */}
                            <div className="absolute top-4 right-4">
                              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                {getDocumentIcon(docType)}
                              </div>
                            </div>

                            {/* Document Info */}
                            <div className="pr-16">
                              <h4 className="font-semibold text-base mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {doc.document_name}
                              </h4>

                              {doc.document_number && (
                                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                                  <span className="font-medium">Doc #:</span>
                                  <span className="font-mono">{doc.document_number}</span>
                                </p>
                              )}

                              {doc.expiry_date && (
                                <div className="flex items-center gap-2 mt-3">
                                  <Badge
                                    variant={doc.is_expired ? "destructive" : "default"}
                                    className={`${!doc.is_expired && 'bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-300'}`}
                                  >
                                    {doc.is_expired ? '⚠ Expired' : '✓ Valid'}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {doc.is_expired ? 'Expired on: ' : 'Valid until: '}
                                    <span className="font-medium">
                                      {new Date(doc.expiry_date).toLocaleDateString()}
                                    </span>
                                  </span>
                                </div>
                              )}

                              {/* Download Button */}
                              <div className="mt-4 pt-3 border-t border-muted">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(doc);
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Document
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border-2 border-dashed">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Documents Available</h3>
                <p className="text-sm text-muted-foreground">
                  No documents have been uploaded for this vehicle yet
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-blue-600">Cranelift SaaS</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Professional Vehicle Management System
          </p>
        </div>
      </div>
    </div>
  );
}
