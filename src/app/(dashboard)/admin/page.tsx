import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Settings, Users, Database, Activity, Shield } from "lucide-react";
import { formatDate, formatDateTime, formatRole } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administration",
};

async function getAdminData() {
  const [users, auditLogs, systemStats] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true } },
      },
    }),
    Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.appointment.count(),
      prisma.prescription.count(),
      prisma.labTest.count(),
      prisma.invoice.count(),
    ]).then(([patients, doctors, appointments, prescriptions, labTests, invoices]) => ({
      patients, doctors, appointments, prescriptions, labTests, invoices
    })),
  ]);

  return { users, auditLogs, systemStats };
}

const roleVariant: Record<string, "success" | "info" | "warning" | "gray" | "purple" | "orange"> = {
  ADMIN: "error" as "success",
  DOCTOR: "success",
  NURSE: "info",
  PHARMACIST: "warning",
  LAB_TECHNICIAN: "purple" as "success",
  RECEPTIONIST: "gray",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { users, auditLogs, systemStats } = await getAdminData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-gray-500" />
          Administration
        </h1>
        <p className="text-muted-foreground mt-1">
          System administration, user management, and audit logs
        </p>
      </div>

      {/* System Stats */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Patients", value: systemStats.patients, icon: Users, color: "text-blue-600" },
          { label: "Doctors", value: systemStats.doctors, icon: Users, color: "text-green-600" },
          { label: "Appointments", value: systemStats.appointments, icon: Activity, color: "text-purple-600" },
          { label: "Prescriptions", value: systemStats.prescriptions, icon: Database, color: "text-orange-600" },
          { label: "Lab Tests", value: systemStats.labTests, icon: Database, color: "text-yellow-600" },
          { label: "Invoices", value: systemStats.invoices, icon: Database, color: "text-emerald-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management ({users.length})
            </CardTitle>
            <CardDescription>All system users and their roles</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-sm">{user.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[user.role] || "gray"} className="text-xs">
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "success" : "error"} className="text-xs">
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.lastLogin ? formatDateTime(user.lastLogin) : "Never"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Recent Audit Logs
          </CardTitle>
          <CardDescription>System activity and security events</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No audit logs yet
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {log.user?.name || "System"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.action === "SIGN_IN" ? "success" :
                          log.action === "SIGN_OUT" ? "gray" :
                          log.action === "CREATE" ? "info" :
                          log.action === "UPDATE" ? "warning" :
                          log.action === "DELETE" ? "error" : "gray"
                        }
                        className="text-xs"
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.entity}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.entityId?.slice(0, 8) || "—"}...
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
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
