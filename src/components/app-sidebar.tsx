"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  ListChecks,
  Settings,
  Building2,
  ChevronDown,
  FileText,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AppSidebarProps {
  user: any;
  tenant: any;
}

export function AppSidebar({ user, tenant }: AppSidebarProps) {
  const pathname = usePathname();
  const isAdmin = user?.role === "admin";

  const mainNavItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "Vehicles",
      icon: Truck,
      href: "/dashboard/vehicles",
      items: [
        {
          title: "All Vehicles",
          href: "/dashboard/vehicles",
        },
        {
          title: "Vehicle Types",
          href: "/dashboard/vehicle-types",
          adminOnly: true,
        },
      ],
    },
    {
      title: "Documents",
      icon: FileText,
      href: "/dashboard/documents",
    },
  ];

  const settingsNavItems = [
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Check if any submenu item is active (for collapsible state)
  const isAnySubItemActive = (items?: any[]) => {
    if (!items) return false;
    return items.some((item) => pathname.startsWith(item.href));
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-sidebar-foreground">
              Cranelift SaaS
            </span>
            {tenant && (
              <span className="text-xs text-sidebar-foreground/60 truncate max-w-[160px]">
                {tenant.name}
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null;

                const isActive = isActiveRoute(item.href);

                // If item has submenu, wrap in Collapsible
                if (item.items) {
                  const hasActiveSubItem = isAnySubItemActive(item.items);
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={hasActiveSubItem || isActive}
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title} isActive={hasActiveSubItem || isActive}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem: any) => {
                              // Check if submenu item should be shown based on adminOnly flag
                              if (subItem.adminOnly && !isAdmin) return null;

                              const isSubItemActive = pathname.startsWith(subItem.href);
                              return (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubItemActive}
                                  >
                                    <Link href={subItem.href}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                // Regular menu item without submenu
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => {
                const isActive = isActiveRoute(item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {tenant && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-sidebar-foreground truncate">
                {tenant.name}
              </span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                {tenant.subscription_plan}
              </span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
