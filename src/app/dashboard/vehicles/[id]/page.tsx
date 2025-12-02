"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { vehicleService, Vehicle } from "@/lib/vehicles";
import { ChevronLeft, Download, FileText, QrCode, Settings } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params?.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await vehicleService.getById(vehicleId);
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
        return "bg-primary/20 text-primary border-primary/50";
      case "maintenance":
        return "bg-muted text-muted-foreground border-border";
      case "inactive":
        return "bg-secondary text-secondary-foreground border-border";
      case "sold":
        return "bg-destructive/20 text-destructive border-destructive/50";
      default:
        return "bg-secondary text-secondary-foreground border-border";
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

  const qrCodeData = JSON.stringify({
    id: vehicle?.id,
    name: vehicle?.name,
    type: vehicle?.vehicle_type?.name,
    registration: vehicle?.registration_number,
    vin: vehicle?.vin,
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{vehicle.name}</h1>
            <p className="text-muted-foreground mt-1">
              {vehicle.vehicle_type?.name || "Unknown Type"}
            </p>
          </div>
          <Badge className={`${getStatusColor(vehicle.status)} capitalize border font-medium`}>
            {vehicle.status}
          </Badge>
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
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vehicle.make && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Make</p>
                      <p className="text-base font-semibold">{vehicle.make}</p>
                    </div>
                  )}
                  {vehicle.model && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Model</p>
                      <p className="text-base font-semibold">{vehicle.model}</p>
                    </div>
                  )}
                  {vehicle.year && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Year</p>
                      <p className="text-base font-semibold">{vehicle.year}</p>
                    </div>
                  )}
                  {vehicle.registration_number && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Registration Number</p>
                      <p className="text-base font-semibold">{vehicle.registration_number}</p>
                    </div>
                  )}
                  {vehicle.vin && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">VIN</p>
                      <p className="text-base font-semibold">{vehicle.vin}</p>
                    </div>
                  )}
                  {vehicle.serial_number && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                      <p className="text-base font-semibold">{vehicle.serial_number}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {vehicle.capacity && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Capacity</p>
                      <p className="text-base font-semibold">
                        {vehicle.capacity} {vehicle.capacity_unit || ""}
                      </p>
                    </div>
                  )}
                  {vehicle.specifications && (
                    <div className="space-y-1 md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Additional Specifications</p>
                      <p className="text-base">{vehicle.specifications}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Purchase & Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {vehicle.purchase_date && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Purchase Date</p>
                      <p className="text-base font-semibold">
                        {new Date(vehicle.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {vehicle.purchase_price && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Purchase Price</p>
                      <p className="text-base font-semibold">${vehicle.purchase_price.toLocaleString()}</p>
                    </div>
                  )}
                  {vehicle.last_service_date && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Last Service Date</p>
                      <p className="text-base font-semibold">
                        {new Date(vehicle.last_service_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {vehicle.next_service_date && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Next Service Date</p>
                      <p className="text-base font-semibold">
                        {new Date(vehicle.next_service_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {vehicle.notes && (
                    <div className="space-y-1 md:col-span-2 lg:col-span-3">
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-base">{vehicle.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/vehicles/${vehicleId}/edit`)}>
            <Settings className="h-4 w-4 mr-2" />
            Edit Vehicle
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
