"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vehicleService, Vehicle, VehicleFieldValue } from "@/lib/vehicles";
import { ChevronLeft, Download, FileText, QrCode, Settings, Pencil } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PageLoading } from "@/components/ui/loading-overlay";

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = parseInt(params?.id as string);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await vehicleService.getOne(vehicleId);
        setVehicle(response.data);
      } catch (error) {
        console.error("Failed to fetch vehicle:", error);
      } finally {
        setLoading(false);
      }
    };

    if (vehicleId) {
      fetchVehicle();
    }
  }, [vehicleId]);

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

  const downloadQRCode = () => {
    const canvas = document.querySelector("#qr-code-canvas canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `vehicle-${vehicle?.id}-qr-code.png`;
      link.click();
    }
  };

  // Get field value helper
  const getFieldValue = (fieldKey: string): string => {
    if (!vehicle?.field_values) return '-';
    const fieldValue = vehicle.field_values.find(
      (fv) => fv.field?.key === fieldKey
    );
    return fieldValue?.value || '-';
  };

  const qrCodeData = JSON.stringify({
    id: vehicle?.id,
    type: vehicle?.vehicle_type?.name,
    make: getFieldValue('make'),
    model: getFieldValue('model'),
    year: getFieldValue('year'),
  });

  // Group fields by default vs custom
  const defaultFields = vehicle?.field_values?.filter(fv => fv.field?.tenant_id === null) || [];
  const customFields = vehicle?.field_values?.filter(fv => fv.field?.tenant_id !== null) || [];

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading message="Loading vehicle details..." />
      </DashboardLayout>
    );
  }

  if (!vehicle) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <h2 className="text-2xl font-bold">Vehicle Not Found</h2>
          <Button onClick={() => router.push("/dashboard/vehicles")}>
            Back to Vehicles
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Vehicle #{vehicle.id}
              </h1>
              <p className="text-muted-foreground mt-1">
                {vehicle.vehicle_type?.name || "Unknown Type"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(vehicle.status)} capitalize border font-medium`}>
              {vehicle.status}
            </Badge>
            <Button
              onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/edit`)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">
              <FileText className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="qr-code">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Default Fields */}
            {defaultFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                  <CardDescription>Default fields for this vehicle type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {defaultFields.map((fv) => (
                      <div key={fv.id} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {fv.field?.name}
                        </p>
                        <p className="text-base font-semibold">
                          {fv.value}
                          {fv.field?.unit && ` ${fv.field.unit}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Fields</CardTitle>
                  <CardDescription>Tenant-specific custom fields</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customFields.map((fv) => (
                      <div key={fv.id} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {fv.field?.name}
                        </p>
                        <p className="text-base font-semibold">
                          {fv.value}
                          {fv.field?.unit && ` ${fv.field.unit}`}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Custom
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No fields */}
            {defaultFields.length === 0 && customFields.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Field Data</h3>
                  <p className="text-sm text-muted-foreground">
                    No fields have been configured for this vehicle
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="qr-code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle QR Code</CardTitle>
                <CardDescription>
                  Scan this QR code to quickly access vehicle information
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <div id="qr-code-canvas" className="p-8 bg-white rounded-lg border-2 border-border">
                  <QRCodeSVG
                    value={qrCodeData}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <Button onClick={downloadQRCode} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download QR Code
                </Button>
                <Separator />
                <div className="w-full space-y-2">
                  <p className="text-sm font-medium">QR Code Contains:</p>
                  <div className="rounded-lg bg-muted p-4 text-xs font-mono">
                    {qrCodeData}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Documents</CardTitle>
                <CardDescription>
                  Upload and manage documents for this vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Documents Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by uploading your first document
                  </p>
                  <Button>Upload Document</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
