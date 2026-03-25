import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updatePatientSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bloodGroup: z.enum([
    "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
    "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN"
  ]).optional(),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  nationalId: z.string().optional().nullable(),
  insuranceNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "DISCHARGED", "DECEASED"]).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          include: {
            doctor: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { appointmentDate: "desc" },
          take: 10,
        },
        medicalRecords: {
          include: {
            doctor: {
              include: { user: { select: { name: true } } },
            },
          },
          orderBy: { visitDate: "desc" },
          take: 10,
        },
        prescriptions: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            items: {
              include: { medication: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        labTests: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            results: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        vitalSigns: {
          orderBy: { recordedAt: "desc" },
          take: 5,
        },
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        admissions: {
          include: {
            ward: true,
            bed: true,
          },
          orderBy: { admissionDate: "desc" },
          take: 5,
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (error) {
    console.error("GET /api/patients/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updatePatientSchema.parse(body);

    const existingPatient = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Check for duplicate national ID if changing
    if (
      validatedData.nationalId &&
      validatedData.nationalId !== existingPatient.nationalId
    ) {
      const duplicate = await prisma.patient.findUnique({
        where: { nationalId: validatedData.nationalId },
      });
      if (duplicate && duplicate.id !== params.id) {
        return NextResponse.json(
          { success: false, error: "National ID already in use" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = { ...validatedData };
    if (validatedData.dateOfBirth) {
      updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
    }

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: updateData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Patient",
        entityId: patient.id,
        oldValues: { name: `${existingPatient.firstName} ${existingPatient.lastName}` },
        newValues: { name: `${patient.firstName} ${patient.lastName}` },
      },
    });

    return NextResponse.json({
      success: true,
      data: patient,
      message: "Patient updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 422 }
      );
    }
    console.error("PUT /api/patients/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: params.id },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Soft delete by changing status
    await prisma.patient.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "Patient",
        entityId: params.id,
        oldValues: { name: `${patient.firstName} ${patient.lastName}` },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Patient deactivated successfully",
    });
  } catch (error) {
    console.error("DELETE /api/patients/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
