import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePatientId } from "@/lib/utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createPatientSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  dateOfBirth: z.string(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodGroup: z.enum([
    "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
    "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN"
  ]).optional().default("UNKNOWN"),
  phone: z.string().min(7),
  email: z.string().email().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional().default("Nigeria"),
  nationalId: z.string().optional().nullable(),
  insuranceNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  allergies: z.array(z.string()).optional().default([]),
  chronicConditions: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { patientId: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { nationalId: { contains: search } },
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
        orderBy: { [sortBy]: sortOrder },
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

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createPatientSchema.parse(body);

    // Generate patient ID
    const patientCount = await prisma.patient.count();
    const patientId = generatePatientId(patientCount + 1);

    // Check for duplicate national ID
    if (validatedData.nationalId) {
      const existing = await prisma.patient.findUnique({
        where: { nationalId: validatedData.nationalId },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "A patient with this National ID already exists" },
          { status: 409 }
        );
      }
    }

    const patient = await prisma.patient.create({
      data: {
        ...validatedData,
        patientId,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        registeredById: session.user.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Patient",
        entityId: patient.id,
        newValues: { patientId: patient.patientId, name: `${patient.firstName} ${patient.lastName}` },
      },
    });

    return NextResponse.json(
      { success: true, data: patient, message: "Patient registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 422 }
      );
    }
    console.error("POST /api/patients error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
