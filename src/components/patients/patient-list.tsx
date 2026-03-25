"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  formatDate,
  calculateAge,
  formatBloodGroup,
  getInitials,
  formatStatus,
  getStatusColor,
} from "@/lib/utils";

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  gender: string;
  bloodGroup: string;
  phone: string;
  email?: string | null;
  status: string;
  createdAt: string | Date;
}

interface PatientListProps {
  patients: Patient[];
  total: number;
  page: number;
  totalPages: number;
  search?: string;
}

const statusVariantMap: Record<string, "success" | "gray" | "info" | "error"> = {
  ACTIVE: "success",
  INACTIVE: "gray",
  DISCHARGED: "info",
  DECEASED: "error",
};

export function PatientList({
  patients,
  total,
  page,
  totalPages,
  search = "",
}: PatientListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(search);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`/patients?${params.toString()}`);
    },
    [searchQuery, searchParams, router]
  );

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/patients?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="w-64"
          />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>

        <Button asChild size="sm">
          <Link href="/patients/new">
            <Plus className="h-4 w-4 mr-2" />
            Register Patient
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <p className="text-sm text-muted-foreground">
        Showing {patients.length} of {total} patients
        {search && ` for "${search}"`}
      </p>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Age/Gender</TableHead>
              <TableHead>Blood Group</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No patients found.{" "}
                  <Link
                    href="/patients/new"
                    className="text-primary hover:underline"
                  >
                    Register a new patient
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <Link
                      href={`/patients/${patient.id}`}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(
                          `${patient.firstName} ${patient.lastName}`
                        )}
                      </div>
                      <span className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">
                    {patient.patientId}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {calculateAge(patient.dateOfBirth)}y
                    </span>
                    <span className="text-muted-foreground mx-1">·</span>
                    <span className="text-muted-foreground text-xs capitalize">
                      {patient.gender.charAt(0).toUpperCase() +
                        patient.gender.slice(1).toLowerCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium">
                      {formatBloodGroup(patient.bloodGroup)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{patient.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariantMap[patient.status] || "gray"}
                      className="text-xs"
                    >
                      {formatStatus(patient.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(patient.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/patients/${patient.id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/patients/${patient.id}/edit`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                            Edit Patient
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/appointments/new?patientId=${patient.id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Calendar className="h-4 w-4" />
                            Book Appointment
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/patients/${patient.id}?tab=records`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <FileText className="h-4 w-4" />
                            Medical Records
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
