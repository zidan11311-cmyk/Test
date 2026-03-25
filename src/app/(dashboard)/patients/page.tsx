import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PatientList } from "@/components/patients/patient-list";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Patients",
};

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    status?: string;
  };
}

async function getPatients(
  page: number,
  limit: number,
  search: string,
  status: string
) {
  const skip = (page - 1) * limit;

  const where: Prisma.PatientWhereInput = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { patientId: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status as "ACTIVE" | "INACTIVE" | "DISCHARGED" | "DECEASED";
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        patientId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        bloodGroup: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return { patients, total };
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const search = searchParams.search || "";
  const status = searchParams.status || "";

  const { patients, total } = await getPatients(page, limit, search, status);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patients</h1>
        <p className="text-muted-foreground mt-1">
          Manage and view all registered patients
        </p>
      </div>

      <PatientList
        patients={patients.map((p) => ({
          ...p,
          dateOfBirth: p.dateOfBirth.toISOString(),
          createdAt: p.createdAt.toISOString(),
        }))}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
      />
    </div>
  );
}
