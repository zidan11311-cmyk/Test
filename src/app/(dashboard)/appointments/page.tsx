import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import Link from "next/link";
import { Plus, Calendar, Clock } from "lucide-react";
import { formatDateTime, formatDate, formatStatus } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Appointments",
};

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
    date?: string;
  };
}

const statusVariantMap: Record<string, "success" | "gray" | "info" | "error" | "warning"> = {
  SCHEDULED: "info",
  CONFIRMED: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
  NO_SHOW: "gray",
};

async function getAppointments(
  page: number,
  limit: number,
  search: string,
  status: string,
  date: string,
  userId: string,
  role: string
) {
  const skip = (page - 1) * limit;
  const where: Prisma.AppointmentWhereInput = {};

  if (search) {
    where.OR = [
      { patient: { firstName: { contains: search, mode: "insensitive" } } },
      { patient: { lastName: { contains: search, mode: "insensitive" } } },
      { appointmentId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status as "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  }

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    where.appointmentDate = { gte: startDate, lte: endDate };
  }

  if (role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({ where: { userId } });
    if (doctor) where.doctorId = doctor.id;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { appointmentDate: "desc" },
      include: {
        patient: {
          select: { id: true, patientId: true, firstName: true, lastName: true, phone: true },
        },
        doctor: {
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return { appointments, total };
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const search = searchParams.search || "";
  const status = searchParams.status || "";
  const date = searchParams.date || "";

  const { appointments, total } = await getAppointments(
    page, limit, search, status, date,
    session?.user.id || "",
    session?.user.role || ""
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayCount = appointments.filter(a => {
    const d = new Date(a.appointmentDate);
    return d >= today && d < tomorrow;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Manage and schedule patient appointments
          </p>
        </div>
        <Button asChild>
          <Link href="/appointments/new">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: total, icon: Calendar, color: "text-blue-600" },
          { label: "Today", value: todayCount, icon: Clock, color: "text-green-600" },
          { label: "Scheduled", value: appointments.filter(a => a.status === "SCHEDULED").length, icon: Calendar, color: "text-yellow-600" },
          { label: "Completed", value: appointments.filter(a => a.status === "COMPLETED").length, icon: Calendar, color: "text-purple-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Appointments ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No appointments found.{" "}
                    <Link href="/appointments/new" className="text-primary hover:underline">
                      Schedule one now
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {apt.appointmentId}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/patients/${apt.patient.id}`}
                        className="hover:underline"
                      >
                        <p className="text-sm font-medium">
                          {apt.patient.firstName} {apt.patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {apt.patient.patientId}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      Dr. {apt.doctor.user.name}
                      <p className="text-xs text-muted-foreground">
                        {apt.doctor.specialization}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDateTime(apt.appointmentDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatStatus(apt.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {apt.duration} min
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariantMap[apt.status] || "gray"}
                        className="text-xs"
                      >
                        {formatStatus(apt.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                        <Link href={`/patients/${apt.patient.id}`}>View Patient</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
