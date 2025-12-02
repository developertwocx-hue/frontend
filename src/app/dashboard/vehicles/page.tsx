"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { vehicleService, vehicleTypeService, Vehicle } from "@/lib/vehicles";

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleService.getAll();
      const vehiclesData = response.data || [];
      setVehicles(vehiclesData);
      setFilteredVehicles(vehiclesData);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = vehicles.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.registration_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [searchQuery, vehicles]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
            <p className="text-muted-foreground mt-2">Manage your fleet vehicles</p>
          </div>
          <Button onClick={() => router.push("/dashboard/vehicles/new")}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vehicle
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur border-gray-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden group"
              onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {vehicle.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {vehicle.vehicle_type?.name || "Unknown Type"}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(vehicle.status)} capitalize border`}>
                    {vehicle.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {vehicle.make && (
                    <div>
                      <p className="text-xs text-muted-foreground">Make</p>
                      <p className="text-sm font-medium">{vehicle.make}</p>
                    </div>
                  )}
                  {vehicle.model && (
                    <div>
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="text-sm font-medium">{vehicle.model}</p>
                    </div>
                  )}
                  {vehicle.year && (
                    <div>
                      <p className="text-xs text-muted-foreground">Year</p>
                      <p className="text-sm font-medium">{vehicle.year}</p>
                    </div>
                  )}
                  {vehicle.registration_number && (
                    <div>
                      <p className="text-xs text-muted-foreground">Registration</p>
                      <p className="text-sm font-medium">{vehicle.registration_number}</p>
                    </div>
                  )}
                </div>

                {vehicle.capacity && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      <span className="text-sm font-medium">
                        Capacity: {vehicle.capacity} {vehicle.capacity_unit}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/vehicles/${vehicle.id}`);
                  }}
                >
                  View Details
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          ))}

          {filteredVehicles.length === 0 && !loading && (
            <Card className="col-span-full border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {searchQuery ? "No vehicles found" : "No vehicles yet"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Get started by adding your first vehicle"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => router.push("/dashboard/vehicles/new")}>
                    Add Vehicle
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
