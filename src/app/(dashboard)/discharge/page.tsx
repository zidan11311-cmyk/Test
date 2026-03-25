import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Activity, LogOut, Calendar } from "lucide-react";
import { formatDate, formatDateTime, formatStatus } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Discharge Management",
};

async function getDischargeData() {
  const [discharges, pendingAdmissions] = await Promise.all([
    prisma.discharge.findMany({
      orderBy: { dischargeDate: "desc" },
      take: 20,
      include: {
        patient: {
          select: { firstName: true, lastName: true, patientId: true },
        },
        doctor: {
          include: { user: { select: { name: true } } },
        },
        admission: {
          include: {
            ward: { select: { name: true } },
          },
        },
      },
    }),
    prisma.admission.findMany({
      where: { discharge: null },
      include: {
        patient: {
          select: { firstName: true, lastName: true, patientId: true },
        },
        ward: true,
        bed: true,
      },
      orderBy: { admissionDate: "asc" },
    }),
  ]);

  return { discharges, pendingAdmissions };
}

const dischargeTypeVariant: Record<string, "success" | "gray" | "warning" | "error"> = {
  REGULAR: "success",
  AGAINST_MEDICAL_ADVICE: "warning",
  TRANSFER: "info" as "success",
  DEATH: "error",
};

export default async function DischargePage() {
  const { discharges, pendingAdmissions } = await getDischargeData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LogOut className="h-6 w-6 text-teal-500" />
          Discharge Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage patient discharge processes and documentation
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold">{pendingAdmissions.length}</p>
              <p className="text-xs text-muted-foreground">Currently Admitted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <LogOut className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{discharges.length}</p>
              <p className="text-xs text-muted-foreground">Total Discharges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">
                {discharges.filter(d => {
                  const today = new Date();
                  const dischargeDate = new Date(d.dischargeDate);
                  return dischargeDate.toDateString() === today.toDateString();
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Discharged Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Discharges (Currently Admitted) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Currently Admitted Patients ({pendingAdmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Admission ID</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Admitted</TableHead>
                <TableHead>Expected Discharge</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAdmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No patients currently admitted
                  </TableCell>
                </TableRow>
              ) : (
                pendingAdmissions.map((adm) => {
                  const daysAdmitted = Math.floor(
                    (new Date().getTime() - new Date(adm.admissionDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                  );

                  return (
                    <TableRow key={adm.id}>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {adm.patient.firstName} {adm.patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{adm.patient.patientId}</p>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{adm.admissionId}</TableCell>
                      <TableCell className="text-sm">{adm.ward.name}</TableCell>
                      <TableCell className="text-sm">
                        {adm.bed ? `Bed ${adm.bed.bedNumber}` : "—"}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs">{formatDate(adm.admissionDate)}</p>
                        <p className="text-xs text-muted-foreground">{daysAdmitted} days ago</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {adm.expectedDischarge
                          ? formatDate(adm.expectedDischarge)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Discharges */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Discharges</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Discharge ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Discharge Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Diagnosis</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No discharge records found
                  </TableCell>
                </TableRow>
              ) : (
                discharges.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs font-mono">{d.dischargeId}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {d.patient.firstName} {d.patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{d.patient.patientId}</p>
                    </TableCell>
                    <TableCell className="text-xs">{formatDateTime(d.dischargeDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={dischargeTypeVariant[d.dischargeType] || "gray"}
                        className="text-xs"
                      >
                        {formatStatus(d.dischargeType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">Dr. {d.doctor.user.name}</TableCell>
                    <TableCell className="text-sm">{d.admission.ward.name}</TableCell>
                    <TableCell className="text-xs max-w-[150px] truncate">
                      {d.finalDiagnosis}
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
