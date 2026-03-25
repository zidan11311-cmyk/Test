import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import Link from "next/link";
import {
  ChevronLeft, Edit, Calendar, Phone, Mail, MapPin,
  Heart, AlertTriangle, FileText, Pill, FlaskConical,
  User, Shield, Activity
} from "lucide-react";
import {
  formatDate, formatDateTime, calculateAge, formatBloodGroup,
  formatStatus, getInitials, formatCurrency
} from "@/lib/utils";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
    select: { firstName: true, lastName: true },
  });

  return {
    title: patient
      ? `${patient.firstName} ${patient.lastName}`
      : "Patient Profile",
  };
}

async function getPatient(id: string) {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { appointmentDate: "desc" },
        take: 10,
      },
      medicalRecords: {
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { visitDate: "desc" },
        take: 10,
      },
      prescriptions: {
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          items: { include: { medication: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      labTests: {
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          results: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      vitalSigns: {
        orderBy: { recordedAt: "desc" },
        take: 3,
      },
      invoices: {
        include: { payments: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

const statusVariantMap: Record<string, "success" | "gray" | "info" | "error"> = {
  ACTIVE: "success",
  INACTIVE: "gray",
  DISCHARGED: "info",
  DECEASED: "error",
};

export default async function PatientProfilePage({ params }: PageProps) {
  const patient = await getPatient(params.id);

  if (!patient) {
    notFound();
  }

  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/patients">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {getInitials(`${patient.firstName} ${patient.lastName}`)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground text-sm font-mono">
                  {patient.patientId}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  {age} years · {patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()}
                </span>
                <span className="text-muted-foreground">·</span>
                <Badge variant="outline" className="text-xs">
                  {formatBloodGroup(patient.bloodGroup)}
                </Badge>
                <Badge
                  variant={statusVariantMap[patient.status] || "gray"}
                  className="text-xs"
                >
                  {formatStatus(patient.status)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/appointments/new?patientId=${patient.id}`}>
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/patients/${patient.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Patient
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium truncate">{patient.phone}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">{patient.email || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium truncate">
                {patient.city || patient.state
                  ? `${patient.city || ""}${patient.city && patient.state ? ", " : ""}${patient.state || ""}`
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Insurance</p>
              <p className="text-sm font-medium truncate">
                {patient.insuranceProvider || "None"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Patient Details */}
        <div className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Date of Birth", value: formatDate(patient.dateOfBirth) },
                { label: "National ID", value: patient.nationalId || "—" },
                { label: "Address", value: patient.address || "—" },
                { label: "Postal Code", value: patient.postalCode || "—" },
                { label: "Country", value: patient.country },
                { label: "Registered", value: formatDate(patient.createdAt) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-right">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Name", value: patient.emergencyContact || "—" },
                { label: "Phone", value: patient.emergencyPhone || "—" },
                { label: "Relation", value: patient.emergencyRelation || "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Medical Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Medical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Allergies</p>
                {patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy) => (
                      <Badge
                        key={allergy}
                        variant="error"
                        className="text-xs"
                      >
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None known</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Chronic Conditions
                </p>
                {patient.chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.chronicConditions.map((condition) => (
                      <Badge
                        key={condition}
                        variant="warning"
                        className="text-xs"
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Latest Vitals */}
          {patient.vitalSigns.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Latest Vitals
                </CardTitle>
                <CardDescription className="text-xs">
                  {formatDateTime(patient.vitalSigns[0].recordedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-sm">
                {patient.vitalSigns[0].bloodPressureSystolic &&
                  patient.vitalSigns[0].bloodPressureDiastolic && (
                    <div className="rounded-md bg-muted/50 p-2 text-center">
                      <p className="text-xs text-muted-foreground">BP</p>
                      <p className="font-bold text-sm">
                        {patient.vitalSigns[0].bloodPressureSystolic}/
                        {patient.vitalSigns[0].bloodPressureDiastolic}
                      </p>
                    </div>
                  )}
                {patient.vitalSigns[0].heartRate && (
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">Heart Rate</p>
                    <p className="font-bold text-sm">
                      {patient.vitalSigns[0].heartRate} bpm
                    </p>
                  </div>
                )}
                {patient.vitalSigns[0].temperature && (
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">Temp</p>
                    <p className="font-bold text-sm">
                      {patient.vitalSigns[0].temperature}°C
                    </p>
                  </div>
                )}
                {patient.vitalSigns[0].oxygenSaturation && (
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">SpO2</p>
                    <p className="font-bold text-sm">
                      {patient.vitalSigns[0].oxygenSaturation}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Appointments
                </CardTitle>
                <CardDescription className="text-xs">
                  {patient.appointments.length} total
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs">
                <Link href={`/appointments/new?patientId=${patient.id}`}>
                  + New
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {patient.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No appointments found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="text-xs">
                          {formatDateTime(apt.appointmentDate)}
                        </TableCell>
                        <TableCell className="text-xs">
                          Dr. {apt.doctor.user.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="info" className="text-xs">
                            {formatStatus(apt.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              apt.status === "COMPLETED" ? "success" :
                              apt.status === "CANCELLED" ? "error" :
                              apt.status === "IN_PROGRESS" ? "warning" : "info"
                            }
                            className="text-xs"
                          >
                            {formatStatus(apt.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Medical Records */}
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  Medical Records
                </CardTitle>
                <CardDescription className="text-xs">
                  {patient.medicalRecords.length} records
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {patient.medicalRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No medical records found
                </p>
              ) : (
                <div className="space-y-3">
                  {patient.medicalRecords.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-md border p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">
                          {record.recordId}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(record.visitDate)}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{record.chiefComplaint}</p>
                      <p className="text-xs text-muted-foreground">
                        Diagnosis: {record.diagnosis}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Dr. {record.doctor.user.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lab Tests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-yellow-500" />
                Recent Lab Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.labTests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No lab tests ordered
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.labTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{test.testName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {test.testId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{test.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              test.priority === "STAT" ? "error" :
                              test.priority === "URGENT" ? "warning" : "gray"
                            }
                            className="text-xs"
                          >
                            {test.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              test.status === "COMPLETED" ? "success" :
                              test.status === "IN_PROGRESS" ? "warning" :
                              test.status === "CANCELLED" ? "error" : "info"
                            }
                            className="text-xs"
                          >
                            {formatStatus(test.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Billing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No invoices found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="text-xs font-mono">{inv.invoiceId}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(inv.total)}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(inv.amountPaid)}</TableCell>
                        <TableCell className="text-xs font-medium">
                          {formatCurrency(inv.balance)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              inv.status === "PAID" ? "success" :
                              inv.status === "OVERDUE" ? "error" :
                              inv.status === "PARTIALLY_PAID" ? "warning" : "gray"
                            }
                            className="text-xs"
                          >
                            {formatStatus(inv.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
