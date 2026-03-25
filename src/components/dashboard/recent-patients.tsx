"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, calculateAge, formatBloodGroup, getInitials } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface RecentPatient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  gender: string;
  bloodGroup: string;
  phone: string;
  status: string;
  createdAt: string | Date;
}

interface RecentPatientsProps {
  patients: RecentPatient[];
}

const statusVariantMap: Record<string, "success" | "gray" | "info" | "error"> = {
  ACTIVE: "success",
  INACTIVE: "gray",
  DISCHARGED: "info",
  DECEASED: "error",
};

export function RecentPatients({ patients }: RecentPatientsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Patients</CardTitle>
          <CardDescription>Latest registered patients</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/patients" className="flex items-center gap-1">
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">No patients registered yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Age/Gender</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <Link
                      href={`/patients/${patient.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(`${patient.firstName} ${patient.lastName}`)}
                      </div>
                      <span className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {patient.patientId}
                  </TableCell>
                  <TableCell>
                    <span>{calculateAge(patient.dateOfBirth)}y</span>
                    <span className="text-muted-foreground mx-1">·</span>
                    <span className="text-muted-foreground text-xs capitalize">
                      {patient.gender.toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {formatBloodGroup(patient.bloodGroup)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariantMap[patient.status] || "gray"}
                      className="text-xs"
                    >
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(patient.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
