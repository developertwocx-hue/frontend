"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

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

// Icon mapping for document categories
const getDocumentCategoryIcon = (docType: string): { icon: string; colorClass: string } => {
  const type = docType.toLowerCase();

  if (type.includes('load') || type.includes('chart')) {
    return { icon: 'picture_as_pdf', colorClass: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' };
  } else if (type.includes('manual') || type.includes('operator')) {
    return { icon: 'menu_book', colorClass: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' };
  } else if (type.includes('safety') || type.includes('certificate')) {
    return { icon: 'verified_user', colorClass: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' };
  } else if (type.includes('service') || type.includes('maintenance') || type.includes('inspection')) {
    return { icon: 'history', colorClass: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400' };
  } else if (type.includes('insurance')) {
    return { icon: 'shield', colorClass: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' };
  } else if (type.includes('registration') || type.includes('permit')) {
    return { icon: 'badge', colorClass: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' };
  } else if (type.includes('gear') || type.includes('lifting')) {
    return { icon: 'construction', colorClass: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' };
  }

  return { icon: 'description', colorClass: 'bg-gray-50 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400' };
};

// Icon mapping for specification cards
const getSpecIcon = (fieldName: string): string => {
  const name = fieldName.toLowerCase();

  if (name.includes('capacity') || name.includes('weight')) return 'scale';
  if (name.includes('boom') || name.includes('length') || name.includes('height')) return 'straighten';
  if (name.includes('service') || name.includes('date')) return 'calendar_month';
  if (name.includes('hours') || name.includes('time')) return 'schedule';
  if (name.includes('engine')) return 'engineering';
  if (name.includes('speed')) return 'speed';
  if (name.includes('fuel')) return 'local_gas_station';
  if (name.includes('model') || name.includes('make')) return 'precision_manufacturing';

  return 'info';
};

export default function PublicVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllSpecs, setShowAllSpecs] = useState(false);

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
    switch (status.toLowerCase()) {
      case "active":
      case "operational":
        return "bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20";
      case "maintenance":
        return "bg-yellow-500/10 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "inactive":
        return "bg-gray-500/10 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/20";
      case "sold":
        return "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/20";
    }
  };

  const getVehicleName = (): string => {
    const nameField = vehicle?.field_values.find(f => f.name.toLowerCase() === 'name');
    return nameField?.value || vehicle?.vehicle_type || 'Vehicle';
  };

  const getVehicleDescription = (): string => {
    // You can customize this based on your needs
    return `High-capacity ${vehicle?.vehicle_type.toLowerCase() || 'vehicle'} available for operations. All documents and certifications up to date.`;
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

  // Get specifications (exclude NAME field)
  const allSpecs = vehicle?.field_values
    .filter(field => field.name.toLowerCase() !== 'name') || [];

  // Show either top 4 or all specs based on state
  const displaySpecs = showAllSpecs ? allSpecs : allSpecs.slice(0, 4);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-slate-500 dark:text-white/60">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <div className="w-full max-w-md rounded-xl bg-white dark:bg-surface-dark p-8 text-center shadow-2xl border border-slate-200 dark:border-white/10">
          <span className="material-symbols-outlined mx-auto mb-4 text-[64px] text-red-500">error</span>
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Vehicle Not Found</h2>
          <p className="text-slate-500 dark:text-white/60">
            {error || 'The vehicle you are looking for does not exist or the link is invalid.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 flex items-center bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 border-b border-black/5 dark:border-white/5 justify-between">
        <button
          onClick={() => router.back()}
          className="text-slate-900 dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>

        <h2 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider flex-1 text-center opacity-90">
          {vehicle.vehicle_type} #{vehicle.id}
        </h2>

        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-safe">
        {/* Vehicle Info Header */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(vehicle.status)}`}>
              <span className="material-symbols-outlined text-[14px] fill-current">
                {vehicle.status.toLowerCase() === 'active' || vehicle.status.toLowerCase() === 'operational' ? 'check_circle' : 'info'}
              </span>
              {vehicle.status}
            </span>
          </div>

          <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight leading-tight mb-2 break-words">
            {getVehicleName()}
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            {getVehicleDescription()}
          </p>
        </div>

        {/* Vehicle Specifications */}
        {displaySpecs.length > 0 && (
          <>
            <div className="px-5 pt-6 pb-3 flex items-end justify-between">
              <h2 className="text-slate-900 dark:text-white tracking-tight text-base font-bold">
                Vehicle Specifications
              </h2>
              {allSpecs.length > 4 && (
                <button
                  onClick={() => setShowAllSpecs(!showAllSpecs)}
                  className="text-primary hover:text-primary-dark text-[10px] font-bold uppercase tracking-wide py-1 transition-colors"
                >
                  {showAllSpecs ? 'Show Less' : 'View All'}
                </button>
              )}
            </div>

            <div className="px-5 grid grid-cols-2 gap-3">
              {displaySpecs.map((field, index) => {
                // Truncate value if too long (max 15 characters)
                const displayValue = field.value.length > 15
                  ? `${field.value.substring(0, 15)}...`
                  : field.value;

                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-surface-dark p-3 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col justify-between h-24 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between relative z-10">
                      <p className="text-slate-500 dark:text-white/60 text-[10px] font-semibold uppercase tracking-wide truncate pr-1 flex-1">
                        {field.name}
                      </p>
                      <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0">
                        {getSpecIcon(field.name)}
                      </span>
                    </div>
                    <p className="text-slate-900 dark:text-white text-xl font-bold leading-tight relative z-10 break-words" title={`${field.value}${field.unit || ''}`}>
                      {displayValue}{field.unit || ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Divider */}
        <div className="h-px bg-slate-200 dark:bg-white/10 mx-5 mt-6 mb-6"></div>

        {/* Document Categories */}
        <div className="px-5 pb-4">
          <h2 className="text-slate-900 dark:text-white tracking-tight text-base font-bold leading-tight">
            Document Categories
          </h2>
          <p className="text-slate-500 dark:text-white/60 text-xs mt-1 leading-relaxed">
            Select a category to view files
          </p>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-10">
          {Object.entries(groupedDocuments).length > 0 ? (
            Object.entries(groupedDocuments).map(([docType, docs]) => {
              const { icon, colorClass } = getDocumentCategoryIcon(docType);

              return (
                <button
                  key={docType}
                  onClick={() => router.push(`/v/${token}/documents/${encodeURIComponent(docType)}`)}
                  className="group w-full flex items-center p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/10 active:border-primary active:ring-1 active:ring-primary/20 transition-all hover:translate-x-1 min-h-[76px]"
                >
                  <div className={`size-12 rounded-xl flex shrink-0 items-center justify-center ${colorClass}`}>
                    <span className="material-symbols-outlined text-[24px]">{icon}</span>
                  </div>

                  <div className="ml-3 flex-1 text-left min-w-0">
                    <h3 className="text-slate-900 dark:text-white font-semibold text-sm leading-snug truncate">
                      {docType}
                    </h3>
                    <p className="text-slate-500 dark:text-white/50 text-[10px] font-medium uppercase tracking-wide mt-1.5">
                      {docs.length} {docs.length === 1 ? 'File' : 'Files'} Available
                    </p>
                  </div>

                  <div className="size-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0 ml-2">
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-10 px-4">
              <span className="material-symbols-outlined text-[48px] text-slate-300 dark:text-white/20 mb-3 block">
                folder_open
              </span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                No Documents Available
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/40">
                No documents have been uploaded for this vehicle yet
              </p>
            </div>
          )}
        </div>

        <div className="h-8"></div>
      </div>
    </div>
  );
}
