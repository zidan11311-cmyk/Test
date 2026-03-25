"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCog,
  AlertTriangle,
  Pill,
  FlaskConical,
  HeartPulse,
  DollarSign,
  LogOut as LogOutIcon,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  Settings,
  MessageCircle,
  Building2,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles?: Role[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: UserCog,
    roles: ["ADMIN", "RECEPTIONIST"],
  },
  {
    title: "Emergency",
    href: "/emergency",
    icon: AlertTriangle,
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    title: "Nursing",
    href: "/nursing",
    icon: HeartPulse,
    roles: ["ADMIN", "DOCTOR", "NURSE"],
  },
  {
    title: "Pharmacy",
    href: "/pharmacy",
    icon: Pill,
    roles: ["ADMIN", "DOCTOR", "PHARMACIST"],
  },
  {
    title: "Laboratory",
    href: "/laboratory",
    icon: FlaskConical,
    roles: ["ADMIN", "DOCTOR", "LAB_TECHNICIAN", "NURSE"],
  },
  {
    title: "Billing",
    href: "/billing",
    icon: DollarSign,
    roles: ["ADMIN", "RECEPTIONIST"],
  },
  {
    title: "Discharge",
    href: "/discharge",
    icon: Activity,
    roles: ["ADMIN", "DOCTOR"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"],
  },
  {
    title: "WhatsApp",
    href: "/whatsapp",
    icon: MessageCircle,
    roles: ["ADMIN", "RECEPTIONIST"],
  },
  {
    title: "Administration",
    href: "/admin",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userRole = session?.user?.role as Role | undefined;

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-[hsl(222,47%,11%)] text-white transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[hsl(217,33%,17%)] px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">MedCore HMS</p>
              <p className="text-[10px] text-blue-300">Hospital Management</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 mx-auto">
            <Building2 className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 sidebar-scroll">
        <ul className="space-y-1 px-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-[hsl(217,33%,17%)] hover:text-white",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon className={cn("shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                  {!isCollapsed && item.badge && item.badge > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      {!isCollapsed && session?.user && (
        <div className="border-t border-[hsl(217,33%,17%)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {session.user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {session.user.name}
              </p>
              <p className="truncate text-[10px] text-slate-400">
                {session.user.role?.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-[hsl(217,33%,17%)] bg-[hsl(222,47%,11%)] text-slate-400 hover:text-white transition-colors shadow-md"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}
