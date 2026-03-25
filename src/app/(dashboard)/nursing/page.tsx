import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { HeartPulse, BedDouble, Users, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nursing",
};

async function getNursingData() {
  const [nurses, wards, admissions, recentVitals] = await Promise.all([
    prisma.nurse.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        ward: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.ward.findMany({
      include: {
        beds: true,
        _count: { select: { admissions: true, nurses: true } },
      },
    }),
    prisma.admission.findMany({
      where: { discharge: null },
      include: {
        patient: { select: { firstName: true, lastName: true, patientId: true } },
        ward: true,
        bed: true,
      },
      orderBy: { admissionDate: "desc" },
      take: 10,
    }),
    prisma.vitalSign.findMany({
      orderBy: { recordedAt: "desc" },
      take: 10,
      include: {
        patient: { select: { firstName: true, lastName: true, patientId: true } },
      },
    }),
  ]);

  return { nurses, wards, admissions, recentVitals };
}

export default async function NursingPage() {
  const { nurses, wards, admissions, recentVitals } = await getNursingData();

  const totalBeds = wards.reduce((sum, w) => sum + w.beds.length, 0);
  const occupiedBeds = wards.reduce((sum, w) => sum + w.beds.filter(b => b.status === "OCCUPIED").length, 0);
  const availableBeds = totalBeds - occupiedBeds;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-pink-500" />
          Nursing Module
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage wards, beds, vitals, and nursing staff
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{nurses.length}</p>
              <p className="text-xs text-muted-foreground">Nursing Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BedDouble className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{occupiedBeds}</p>
              <p className="text-xs text-muted-foreground">Occupied Beds</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BedDouble className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{availableBeds}</p>
              <p className="text-xs text-muted-foreground">Available Beds</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{admissions.length}</p>
              <p className="text-xs text-muted-foreground">Current Admissions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wards Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wards.map((ward) => {
          const occupied = ward.beds.filter(b => b.status === "OCCUPIED").length;
          const available = ward.beds.filter(b => b.status === "AVAILABLE").length;
          const maintenance = ward.beds.filter(b => b.status === "MAINTENANCE").length;
          const occupancyPct = ward.beds.length > 0
            ? Math.round((occupied / ward.beds.length) * 100)
            : 0;

          return (
            <Card key={ward.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{ward.name}</CardTitle>
                  <Badge
                    variant={ward.isActive ? "success" : "gray"}
                    className="text-xs"
                  >
                    {ward.wardType.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="font-medium">{occupancyPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        occupancyPct > 80 ? "bg-red-500" :
                        occupancyPct > 60 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                    <div className="rounded-md bg-green-50 p-1.5">
                      <p className="font-bold text-green-700">{available}</p>
                      <p className="text-green-600">Available</p>
                    </div>
                    <div className="rounded-md bg-red-50 p-1.5">
                      <p className="font-bold text-red-700">{occupied}</p>
                      <p className="text-red-600">Occupied</p>
                    </div>
                    <div className="rounded-md bg-yellow-50 p-1.5">
                      <p className="font-bold text-yellow-700">{maintenance}</p>
                      <p className="text-yellow-600">Maintenance</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {ward._count.nurses} nurses assigned · Floor {ward.floor || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {wards.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <BedDouble className="h-12 w-12 mb-3 opacity-30" />
              <p>No wards configured yet</p>
              <p className="text-xs mt-1">Wards are configured in the Administration module</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Current Admissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Admissions ({admissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Ward</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Admission Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No current admissions
                  </TableCell>
                </TableRow>
              ) : (
                admissions.map((adm) => (
                  <TableRow key={adm.id}>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {adm.patient.firstName} {adm.patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{adm.patient.patientId}</p>
                    </TableCell>
                    <TableCell className="text-sm">{adm.ward.name}</TableCell>
                    <TableCell className="text-sm">
                      {adm.bed ? `Bed ${adm.bed.bedNumber}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(adm.admissionDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Vital Signs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>BP</TableHead>
                <TableHead>Heart Rate</TableHead>
                <TableHead>Temp</TableHead>
                <TableHead>SpO2</TableHead>
                <TableHead>Recorded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentVitals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No vital signs recorded
                  </TableCell>
                </TableRow>
              ) : (
                recentVitals.map((vital) => (
                  <TableRow key={vital.id}>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {vital.patient.firstName} {vital.patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{vital.patient.patientId}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                        ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {vital.heartRate ? `${vital.heartRate} bpm` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {vital.temperature ? `${vital.temperature}°C` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(vital.recordedAt)}
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
