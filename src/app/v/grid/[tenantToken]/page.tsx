"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";

interface Vehicle {
  id: number;
  qr_code_token: string;
  vehicle_type: string;
  status: string;
  field_values: Array<{ name: string; value: string; unit?: string }>;
}

export default function QRCodeGridPage() {
  const params = useParams();
  const router = useRouter();
  const tenantToken = params?.tenantToken as string;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantToken) return;

    const fetchVehicles = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${apiUrl}/public/tenant/${tenantToken}/vehicles`);

        if (!response.ok) {
          throw new Error('Vehicles not found');
        }

        const data = await response.json();
        setVehicles(data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [tenantToken]);

  const getVehicleName = (vehicle: Vehicle): string => {
    const nameField = vehicle.field_values?.find(f => f.name.toLowerCase() === 'name');
    return nameField?.value || `${vehicle.vehicle_type} #${vehicle.id}`;
  };

  const getQRCodeURL = (token: string): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/v/${token}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "operational":
        return "bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20";
      case "maintenance":
        return "bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "inactive":
        return "bg-gray-500/10 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/20";
      default:
        return "bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-slate-500 dark:text-white/60">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicles) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <div className="w-full max-w-md rounded-xl bg-white dark:bg-surface-dark p-8 text-center shadow-2xl border border-slate-200 dark:border-white/10">
          <span className="material-symbols-outlined mx-auto mb-4 text-[64px] text-red-500">error</span>
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Error</h2>
          <p className="text-slate-500 dark:text-white/60">{error || 'Failed to load vehicles'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-slate-900 dark:text-white text-xl font-bold">Vehicle QR Codes</h1>
              <p className="text-slate-500 dark:text-white/50 text-xs mt-1">
                {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} available
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print All
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-surface-dark rounded-xl border-2 border-slate-200 dark:border-white/10 p-5 flex flex-col items-center shadow-lg hover:shadow-xl transition-shadow print:break-inside-avoid print:shadow-none"
              >
                {/* Status Badge */}
                <div className="w-full flex justify-center mb-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(vehicle.status)}`}>
                    <span className="material-symbols-outlined text-[12px] fill-current">
                      {vehicle.status.toLowerCase() === 'active' || vehicle.status.toLowerCase() === 'operational' ? 'check_circle' : 'info'}
                    </span>
                    {vehicle.status}
                  </span>
                </div>

                {/* QR Code */}
                <div className="w-48 h-48 bg-white border-4 border-slate-200 rounded-xl flex items-center justify-center mb-4 p-3">
                  <QRCode
                    value={getQRCodeURL(vehicle.qr_code_token)}
                    size={160}
                    level="M"
                    className="w-full h-full"
                  />
                </div>

                {/* Vehicle Info */}
                <div className="w-full text-center">
                  <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-1 truncate">
                    {getVehicleName(vehicle)}
                  </h3>
                  <p className="text-slate-500 dark:text-white/50 text-xs uppercase tracking-wide mb-3">
                    {vehicle.vehicle_type}
                  </p>

                  {/* View Button */}
                  <button
                    onClick={() => router.push(`/v/${vehicle.qr_code_token}`)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white rounded-lg transition-colors text-xs font-medium print:hidden"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    View Details
                  </button>

                  {/* URL for printing */}
                  <div className="hidden print:block mt-3 text-[8px] text-slate-500 font-mono break-all">
                    {getQRCodeURL(vehicle.qr_code_token)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[64px] text-slate-300 dark:text-white/20 mb-4 block">
              garage
            </span>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No Vehicles Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-white/40">
              No vehicles are available for this account
            </p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .sticky {
            position: relative !important;
          }
        }
      `}</style>
    </div>
  );
}
