"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbContextType {
  customLabels: Record<string, string>;
  setCustomLabel: (path: string, label: string) => void;
  clearCustomLabel: (path: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customLabels, setCustomLabels] = useState<Record<string, string>>({});

  const setCustomLabel = (path: string, label: string) => {
    setCustomLabels((prev) => ({ ...prev, [path]: label }));
  };

  const clearCustomLabel = (path: string) => {
    setCustomLabels((prev) => {
      const newLabels = { ...prev };
      delete newLabels[path];
      return newLabels;
    });
  };

  return (
    <BreadcrumbContext.Provider value={{ customLabels, setCustomLabel, clearCustomLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}
