"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Calendar,
  AlertTriangle,
  FlaskConical,
  Pill,
  DollarSign,
  BedDouble,
  UserCog,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
}: StatCardProps) {
  return (
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.positive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.positive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {trend.positive ? "+" : ""}
                  {trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              iconBg
            )}
          >
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: {
    totalPatients: number;
    totalDoctors: number;
    todayAppointments: number;
    pendingLabTests: number;
    pendingPrescriptions: number;
    activeEmergencyCases: number;
    totalRevenue: number;
    occupiedBeds: number;
    totalBeds: number;
  };
}

export function StatsCards({ stats }: DashboardStatsProps) {
  const statCards: StatCardProps[] = [
    {
      title: "Total Patients",
      value: formatNumber(stats.totalPatients),
      description: "Registered patients",
      icon: Users,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      trend: { value: 12, label: "from last month", positive: true },
    },
    {
      title: "Total Doctors",
      value: formatNumber(stats.totalDoctors),
      description: "Active medical staff",
      icon: UserCog,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      title: "Today's Appointments",
      value: formatNumber(stats.todayAppointments),
      description: "Scheduled for today",
      icon: Calendar,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
      trend: { value: 5, label: "from yesterday", positive: true },
    },
    {
      title: "Active Emergencies",
      value: formatNumber(stats.activeEmergencyCases),
      description: "Requiring immediate attention",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
    },
    {
      title: "Pending Lab Tests",
      value: formatNumber(stats.pendingLabTests),
      description: "Awaiting results",
      icon: FlaskConical,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-100",
    },
    {
      title: "Pending Prescriptions",
      value: formatNumber(stats.pendingPrescriptions),
      description: "Awaiting dispensing",
      icon: Pill,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
    },
    {
      title: "Bed Occupancy",
      value: `${stats.occupiedBeds}/${stats.totalBeds}`,
      description: `${stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}% occupied`,
      icon: BedDouble,
      iconColor: "text-teal-600",
      iconBg: "bg-teal-100",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      description: "This month",
      icon: DollarSign,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-100",
      trend: { value: 8, label: "from last month", positive: true },
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
}
