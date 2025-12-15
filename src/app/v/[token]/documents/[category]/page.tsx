"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Document {
  id: number;
  document_type_id?: number;
  document_type?: { id: number; name: string };
  document_name: string;
  document_number?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  expiry_date?: string;
  is_expired: boolean;
  issue_date?: string;
}

interface VehicleData {
  id: number;
  vehicle_type: string;
  status: string;
  field_values: Array<{ name: string; value: string; unit?: string }>;
  documents: Document[];
}

export default function DocumentCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const category = decodeURIComponent(params?.category as string);

  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
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

        // Filter documents by category
        const filteredDocs = data.data.documents.filter(
          (doc: Document) => doc.document_type?.name === category
        );
        setDocuments(filteredDocs);
      } catch (err: any) {
        setError(err.message || 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [token, category]);

  const handleDownload = (doc: Document) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
    const fileUrl = `${baseUrl}/storage/${doc.file_path}`;
    window.open(fileUrl, "_blank");
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getFileIcon = (doc: Document): string => {
    const fileType = doc.file_type?.toLowerCase() || '';
    const fileName = doc.file_path.toLowerCase();

    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) return 'picture_as_pdf';
    if (fileType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif)$/)) return 'image';
    if (fileType.includes('word') || fileName.match(/\.(doc|docx)$/)) return 'description';
    if (fileType.includes('excel') || fileName.match(/\.(xls|xlsx)$/)) return 'table_chart';

    return 'insert_drive_file';
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-slate-500 dark:text-white/60">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <div className="w-full max-w-md rounded-xl bg-white dark:bg-surface-dark p-8 text-center shadow-2xl border border-slate-200 dark:border-white/10">
          <span className="material-symbols-outlined mx-auto mb-4 text-[64px] text-red-500">error</span>
          <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Error Loading Documents</h2>
          <p className="text-slate-500 dark:text-white/60">{error || 'Failed to load documents'}</p>
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

        <h2 className="text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider flex-1 text-center opacity-90 line-clamp-2 px-2 leading-snug">
          {category}
        </h2>

        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-safe">
        {/* Header Section */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-slate-500 dark:text-white/50 text-[10px] font-bold uppercase tracking-wider">
              {vehicle.vehicle_type} #{vehicle.id}
            </span>
          </div>

          <h1 className="text-slate-900 dark:text-white text-2xl font-extrabold tracking-tight leading-none mb-2 truncate">
            {category}
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} available for viewing
          </p>
        </div>

        {/* Documents List */}
        <div className="flex flex-col gap-4 px-5 pb-10">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDownload(doc)}
                className="group w-full flex flex-col p-4 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-white/10 hover:border-primary hover:ring-1 hover:ring-primary/20 transition-all active:scale-[0.98]"
              >
                {/* Document Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-12 rounded-xl bg-primary/10 flex shrink-0 items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[22px]">
                      {getFileIcon(doc)}
                    </span>
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {doc.document_name}
                    </h3>
                    {doc.document_number && (
                      <p className="text-slate-500 dark:text-white/50 text-[10px] font-medium font-mono">
                        #{doc.document_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* Document Metadata */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {doc.file_size && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                      <span className="material-symbols-outlined text-[12px] text-slate-500 dark:text-white/50">
                        cloud
                      </span>
                      <span className="text-[10px] font-medium text-slate-600 dark:text-white/60">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </div>
                  )}

                  {doc.issue_date && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                      <span className="material-symbols-outlined text-[12px] text-slate-500 dark:text-white/50">
                        event
                      </span>
                      <span className="text-[10px] font-medium text-slate-600 dark:text-white/60">
                        Issued: {new Date(doc.issue_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {doc.expiry_date && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${
                      doc.is_expired
                        ? 'bg-red-50 dark:bg-red-500/10'
                        : 'bg-green-50 dark:bg-green-500/10'
                    }`}>
                      <span className={`material-symbols-outlined text-[12px] ${
                        doc.is_expired
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {doc.is_expired ? 'warning' : 'check_circle'}
                      </span>
                      <span className={`text-[10px] font-medium ${
                        doc.is_expired
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-green-700 dark:text-green-400'
                      }`}>
                        {doc.is_expired ? 'Expired' : 'Valid'} until {new Date(doc.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* View Button */}
                <div className="pt-3 border-t border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-white/60">
                      Tap to view document
                    </span>
                    <div className="size-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30 group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <span className="material-symbols-outlined text-[64px] text-slate-300 dark:text-white/20 mb-4 block">
                search_off
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Documents Found
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/40">
                There are no documents in this category yet
              </p>
            </div>
          )}
        </div>

        <div className="h-8"></div>
      </div>
    </div>
  );
}
