"use client";

import { ReactNode } from "react";
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context";

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  return (
    <BreadcrumbProvider>
      {children}
    </BreadcrumbProvider>
  );
}
