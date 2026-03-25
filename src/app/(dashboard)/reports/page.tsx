import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, FlaskConical } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reports & Analytics",
};

async function getReportData() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const [
    totalPatients,
    newPatientsThisMonth,
    newPatientsLastMonth,
    totalAppointments,
    appointmentsThisMonth,
    completedAppointments,
    cancelledAppointments,
    labTestsThisMonth,
    completedLabTests,
    invoiceStats,
    patientsByGender,
    patientsByBloodGroup,
    appointmentsByType,
    appointmentsByStatus,
    topDoctors,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.patient.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.appointment.count({ where: { status: "COMPLETED" } }),
    prisma.appointment.count({ where: { status: "CANCELLED" } }),
    prisma.labTest.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.labTest.count({ where: { status: "COMPLETED" } }),
    prisma.invoice.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { total: true, amountPaid: true },
      _count: { _all: true },
    }),
    prisma.patient.groupBy({
      by: ["gender"],
      _count: { _all: true },
    }),
    prisma.patient.groupBy({
      by: ["bloodGroup"],
      _count: { _all: true },
      orderBy: { _count: { bloodGroup: "desc" } },
    }),
    prisma.appointment.groupBy({
      by: ["type"],
      _count: { _all: true },
      orderBy: { _count: { type: "desc" } },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.doctor.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { appointments: { _count: "desc" } },
      take: 5,
    }),
  ]);

  const patientGrowth = newPatientsLastMonth > 0
    ? Math.round(((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100)
    : 0;

  return {
    totalPatients,
    newPatientsThisMonth,
    patientGrowth,
    totalAppointments,
    appointmentsThisMonth,
    completedAppointments,
    cancelledAppointments,
    labTestsThisMonth,
    completedLabTests,
    invoiceStats,
    patientsByGender,
    patientsByBloodGroup,
    appointmentsByType,
    appointmentsByStatus,
    topDoctors,
  };
}

export default async function ReportsPage() {
  const data = await getReportData();

  const completionRate = data.totalAppointments > 0
    ? Math.round((data.completedAppointments / data.totalAppointments) * 100)
    : 0;

  const cancellationRate = data.totalAppointments > 0
    ? Math.round((data.cancelledAppointments / data.totalAppointments) * 100)
    : 0;

  const labCompletionRate = (data.labTestsThisMonth + data.completedLabTests) > 0
    ? Math.round((data.completedLabTests / (data.labTestsThisMonth + data.completedLabTests)) * 100)
    : 0;

  const formatType = (type: string) =>
    type.replace(/_/g, " ").split(" ").map(w => w[0] + w.slice(1).toLowerCase()).join(" ");

  const formatBloodGroupLabel = (bg: string) => {
    const map: Record<string, string> = {
      A_POSITIVE: "A+", A_NEGATIVE: "A-",
      B_POSITIVE: "B+", B_NEGATIVE: "B-",
      AB_POSITIVE: "AB+", AB_NEGATIVE: "AB-",
      O_POSITIVE: "O+", O_NEGATIVE: "O-",
      UNKNOWN: "Unknown",
    };
    return map[bg] || bg;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-indigo-500" />
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive overview of hospital performance and metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold mt-1">{data.totalPatients.toLocaleString()}</p>
                <div className={`flex items-center gap-1 mt-1 text-xs ${data.patientGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                  <TrendingUp className="h-3 w-3" />
                  {data.patientGrowth >= 0 ? "+" : ""}{data.patientGrowth}% this month
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue (Month)</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(data.invoiceStats._sum.amountPaid || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.invoiceStats._count._all} invoices
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-2xl font-bold mt-1">{data.totalAppointments.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completionRate}% completion rate
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lab Tests</p>
                <p className="text-2xl font-bold mt-1">{data.completedLabTests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {labCompletionRate}% completed
                </p>
              </div>
              <FlaskConical className="h-8 w-8 text-yellow-500 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Patient Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Patient Demographics</CardTitle>
            <CardDescription>Distribution by gender and blood group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                By Gender
              </p>
              {data.patientsByGender.map((item) => {
                const pct = data.totalPatients > 0
                  ? Math.round((item._count._all / data.totalPatients) * 100)
                  : 0;
                return (
                  <div key={item.gender} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">
                        {item.gender.charAt(0) + item.gender.slice(1).toLowerCase()}
                      </span>
                      <span className="font-medium">
                        {item._count._all} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                By Blood Group (Top 5)
              </p>
              <div className="flex flex-wrap gap-2">
                {data.patientsByBloodGroup.slice(0, 5).map((item) => (
                  <div key={item.bloodGroup} className="rounded-lg border p-2 text-center min-w-[60px]">
                    <p className="text-lg font-bold text-primary">
                      {item._count._all}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBloodGroupLabel(item.bloodGroup)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appointment Analytics</CardTitle>
            <CardDescription>Distribution by type and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                By Type
              </p>
              {data.appointmentsByType.map((item) => {
                const pct = data.totalAppointments > 0
                  ? Math.round((item._count._all / data.totalAppointments) * 100)
                  : 0;
                return (
                  <div key={item.type} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{formatType(item.type)}</span>
                      <span className="font-medium">{item._count._all} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                By Status
              </p>
              <div className="flex flex-wrap gap-2">
                {data.appointmentsByStatus.map((item) => (
                  <div key={item.status} className="rounded-lg border p-2 text-center min-w-[80px]">
                    <p className="text-lg font-bold">{item._count._all}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatType(item.status)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Doctors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Doctors by Appointments</CardTitle>
            <CardDescription>Most active physicians this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topDoctors.map((doctor, index) => (
                <div key={doctor.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Dr. {doctor.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doctor.specialization} · {doctor.department}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{doctor._count.appointments}</p>
                    <p className="text-xs text-muted-foreground">appointments</p>
                  </div>
                </div>
              ))}
              {data.topDoctors.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No appointment data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Summary</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Appointment Completion Rate",
                  value: completionRate,
                  target: 85,
                  unit: "%",
                  color: completionRate >= 85 ? "bg-green-500" : completionRate >= 70 ? "bg-yellow-500" : "bg-red-500",
                },
                {
                  label: "Appointment Cancellation Rate",
                  value: cancellationRate,
                  target: 10,
                  unit: "%",
                  color: cancellationRate <= 10 ? "bg-green-500" : cancellationRate <= 20 ? "bg-yellow-500" : "bg-red-500",
                },
                {
                  label: "Lab Test Completion Rate",
                  value: labCompletionRate,
                  target: 90,
                  unit: "%",
                  color: labCompletionRate >= 90 ? "bg-green-500" : labCompletionRate >= 75 ? "bg-yellow-500" : "bg-red-500",
                },
              ].map((kpi) => (
                <div key={kpi.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{kpi.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{kpi.value}{kpi.unit}</span>
                      <Badge
                        variant={
                          kpi.label.includes("Cancellation")
                            ? kpi.value <= kpi.target ? "success" : "error"
                            : kpi.value >= kpi.target ? "success" : kpi.value >= kpi.target * 0.8 ? "warning" : "error"
                        }
                        className="text-[10px]"
                      >
                        Target: {kpi.target}{kpi.unit}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${kpi.color} transition-all`}
                      style={{ width: `${Math.min(kpi.value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
