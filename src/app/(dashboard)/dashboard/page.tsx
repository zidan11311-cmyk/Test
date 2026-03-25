import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentPatients } from "@/components/dashboard/recent-patients";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatDate, getEmergencyPriorityLabel, formatStatus } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, AlertTriangle, Calendar, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalPatients,
    totalDoctors,
    todayAppointments,
    pendingLabTests,
    pendingPrescriptions,
    activeEmergencyCases,
    revenueResult,
    bedStats,
    recentPatients,
    upcomingAppointments,
    recentEmergencies,
  ] = await Promise.all([
    prisma.patient.count({ where: { status: "ACTIVE" } }),
    prisma.doctor.count({ where: { isAvailable: true } }),
    prisma.appointment.count({
      where: {
        appointmentDate: { gte: today, lt: tomorrow },
        status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
      },
    }),
    prisma.labTest.count({
      where: { status: { in: ["ORDERED", "SAMPLE_COLLECTED", "IN_PROGRESS"] } },
    }),
    prisma.prescription.count({ where: { status: "PENDING" } }),
    prisma.emergencyCase.count({
      where: { status: { in: ["WAITING", "TRIAGE", "TREATMENT", "OBSERVATION"] } },
    }),
    prisma.invoice.aggregate({
      where: {
        status: { in: ["PAID", "PARTIALLY_PAID"] },
        createdAt: { gte: firstDayOfMonth },
      },
      _sum: { amountPaid: true },
    }),
    prisma.bed.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        patientId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: today, lt: tomorrow },
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      orderBy: { appointmentDate: "asc" },
      take: 5,
      include: {
        patient: {
          select: { firstName: true, lastName: true, patientId: true },
        },
        doctor: {
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.emergencyCase.findMany({
      where: { status: { in: ["WAITING", "TRIAGE", "TREATMENT"] } },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      take: 5,
      include: {
        patient: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
  ]);

  const occupiedBeds = bedStats.find((b) => b.status === "OCCUPIED")?._count._all || 0;
  const totalBeds = bedStats.reduce((sum, b) => sum + b._count._all, 0);

  return {
    stats: {
      totalPatients,
      totalDoctors,
      todayAppointments,
      pendingLabTests,
      pendingPrescriptions,
      activeEmergencyCases,
      totalRevenue: revenueResult._sum.amountPaid || 0,
      occupiedBeds,
      totalBeds,
    },
    recentPatients,
    upcomingAppointments,
    recentEmergencies,
  };
}

const emergencyPriorityColors: Record<string, string> = {
  P1_IMMEDIATE: "bg-red-100 text-red-800 border-red-200",
  P2_URGENT: "bg-orange-100 text-orange-800 border-orange-200",
  P3_LESS_URGENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
  P4_NON_URGENT: "bg-green-100 text-green-800 border-green-200",
  P5_DECEASED: "bg-gray-100 text-gray-800 border-gray-200",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const { stats, recentPatients, upcomingAppointments, recentEmergencies } =
    await getDashboardData();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {session?.user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening at your facility today,{" "}
          {formatDate(new Date(), "EEEE, MMMM do yyyy")}.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Patients - span 2 cols */}
        <div className="lg:col-span-2">
          <RecentPatients patients={recentPatients.map(p => ({
            ...p,
            dateOfBirth: p.dateOfBirth.toISOString(),
            createdAt: p.createdAt.toISOString(),
          }))} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Active Emergencies */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Active Emergencies
                </CardTitle>
                <CardDescription>{stats.activeEmergencyCases} cases</CardDescription>
              </div>
              <Link
                href="/emergency"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentEmergencies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  No active emergencies
                </p>
              ) : (
                recentEmergencies.map((em) => (
                  <div
                    key={em.id}
                    className="flex items-start gap-2 rounded-md border p-2"
                  >
                    <span
                      className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                        emergencyPriorityColors[em.priority] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {em.priority.replace("P", "").replace("_", " ")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {em.patient
                          ? `${em.patient.firstName} ${em.patient.lastName}`
                          : em.patientName || "Unknown Patient"}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {em.chiefComplaint}
                      </p>
                    </div>
                    <Badge
                      variant={em.status === "WAITING" ? "warning" : "info"}
                      className="text-[10px] shrink-0"
                    >
                      {em.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Today's Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Today&apos;s Appointments
                </CardTitle>
                <CardDescription>{stats.todayAppointments} scheduled</CardDescription>
              </div>
              <Link
                href="/appointments"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  No appointments today
                </p>
              ) : (
                upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-2 rounded-md border p-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                      {new Date(apt.appointmentDate).toLocaleTimeString("en", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {apt.patient.firstName} {apt.patient.lastName}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        Dr. {apt.doctor.user.name}
                      </p>
                    </div>
                    <Badge variant="info" className="text-[10px] shrink-0">
                      {apt.type.replace("_", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: "New Patient", href: "/patients/new", color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" },
                { label: "New Appointment", href: "/appointments/new", color: "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" },
                { label: "Emergency", href: "/emergency", color: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" },
                { label: "Lab Test", href: "/laboratory", color: "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200" },
                { label: "Pharmacy", href: "/pharmacy", color: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200" },
                { label: "Billing", href: "/billing", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex items-center justify-center rounded-md border p-2.5 text-xs font-medium transition-colors ${action.color}`}
                >
                  {action.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
