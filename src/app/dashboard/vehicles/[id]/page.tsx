"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vehicleService, Vehicle } from "@/lib/vehicles";
import { ChevronLeft, FileText, Pencil, QrCode, Download } from "lucide-react";
import { PageLoading } from "@/components/ui/loading-overlay";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = parseInt(params?.id as string);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQRDialog, setShowQRDialog] = useState(false);

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
              onClick={() => setShowQRDialog(true)}
              variant="outline"
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/edit`)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        <div className="space-y-4">
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
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vehicle QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to view vehicle details and documents
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {vehicle.qr_code_token && (
              <>
                <div className="bg-white p-6 rounded-lg">
                  <QRCodeSVG
                    value={`${window.location.origin}/v/${vehicle.qr_code_token}`}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {window.location.origin}/v/{vehicle.qr_code_token}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const svg = document.querySelector('svg');
                      if (svg) {
                        // Convert SVG to canvas to download as PNG
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const img = new Image();

                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          const url = canvas.toDataURL('image/png');
                          const link = document.createElement('a');
                          link.download = `vehicle-${vehicle.id}-qr.png`;
                          link.href = url;
                          link.click();
                        };

                        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/v/${vehicle.qr_code_token}`);
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
