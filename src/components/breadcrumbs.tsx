"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname);

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1 text-sm text-muted-foreground mb-4 ${className}`}
    >
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;

        return (
          <Fragment key={index}>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            {isLast || !item.href ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

// Auto-generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  // Remove 'dashboard' from segments as Home already represents it
  const filteredSegments = segments.filter((seg) => seg !== "dashboard");

  let currentPath = "";

  filteredSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === filteredSegments.length - 1;

    // Skip dynamic route segments like [id] in breadcrumb generation
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return;
    }

    // Handle special cases
    let label = formatSegmentLabel(segment);

    breadcrumbs.push({
      label,
      href: isLast ? undefined : `/dashboard${currentPath}`,
    });
  });

  return breadcrumbs;
}

// Format segment for display
function formatSegmentLabel(segment: string): string {
  // Handle UUIDs or numeric IDs
  if (/^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment)) {
    return `#${segment.substring(0, 8)}...`;
  }

  // Convert kebab-case to Title Case
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
