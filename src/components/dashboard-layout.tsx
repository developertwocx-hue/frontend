"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { authService } from "@/lib/auth";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const tenantData = localStorage.getItem("tenant");
    if (userData) setUser(JSON.parse(userData));
    if (tenantData) setTenant(JSON.parse(tenantData));
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} tenant={tenant} />
      <SidebarInset>
        <AppHeader user={user} onLogout={handleLogout} />
        <main className="flex flex-1 flex-col p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
