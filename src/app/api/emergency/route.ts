import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateEmergencyId } from "@/lib/utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createEmergencyCaseSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  patientAge: z.number().optional(),
  patientGender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  priority: z.enum([
    "P1_IMMEDIATE", "P2_URGENT", "P3_LESS_URGENT", "P4_NON_URGENT", "P5_DECEASED"
  ]),
  chiefComplaint: z.string().min(5),
  arrivalMode: z.string().optional(),
  triageNotes: z.string().optional(),
  assignedDoctorId: z.string().optional(),
});

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.enum([
    "WAITING", "TRIAGE", "TREATMENT", "OBSERVATION", "ADMITTED", "TRANSFERRED", "DISCHARGED", "DECEASED"
  ]),
  notes: z.string().optional(),
  assignedDoctorId: z.string().optional(),
  treatmentNotes: z.string().optional(),
  disposition: z.string().optional(),
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
    const priority = searchParams.get("priority") || "";
    const active = searchParams.get("active") === "true";
    const skip = (page - 1) * limit;

    const where: Prisma.EmergencyCaseWhereInput = {};

    if (search) {
      where.OR = [
        { caseId: { contains: search, mode: "insensitive" } },
        { chiefComplaint: { contains: search, mode: "insensitive" } },
        { patientName: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status as "WAITING" | "TRIAGE" | "TREATMENT" | "OBSERVATION" | "ADMITTED" | "TRANSFERRED" | "DISCHARGED" | "DECEASED";
    }

    if (priority) {
      where.priority = priority as "P1_IMMEDIATE" | "P2_URGENT" | "P3_LESS_URGENT" | "P4_NON_URGENT" | "P5_DECEASED";
    }

    if (active) {
      where.status = {
        in: ["WAITING", "TRIAGE", "TREATMENT", "OBSERVATION"],
      };
    }

    const [cases, total] = await Promise.all([
      prisma.emergencyCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: "asc" },
          { createdAt: "asc" },
        ],
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true,
              bloodGroup: true,
              allergies: true,
            },
          },
          assignedDoctor: {
            include: { user: { select: { name: true } } },
          },
        },
      }),
      prisma.emergencyCase.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: cases,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/emergency error:", error);
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "create";

    if (action === "update-status") {
      const body = await request.json();
      const data = updateStatusSchema.parse(body);

      const emergencyCase = await prisma.emergencyCase.findUnique({
        where: { id: data.id },
      });

      if (!emergencyCase) {
        return NextResponse.json(
          { success: false, error: "Emergency case not found" },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = {
        status: data.status,
      };

      if (data.assignedDoctorId) {
        updateData.assignedDoctorId = data.assignedDoctorId;
        updateData.assignedAt = new Date();
      }

      if (data.treatmentNotes) {
        updateData.treatmentNotes = data.treatmentNotes;
      }

      if (data.disposition) {
        updateData.disposition = data.disposition;
        updateData.dispositionAt = new Date();
      }

      if (data.notes && data.status === "TRIAGE") {
        updateData.triageNotes = data.notes;
        updateData.triageAt = new Date();
        updateData.triageBy = session.user.id;
      }

      const updated = await prisma.emergencyCase.update({
        where: { id: data.id },
        data: updateData,
        include: {
          patient: {
            select: { id: true, patientId: true, firstName: true, lastName: true },
          },
          assignedDoctor: {
            include: { user: { select: { name: true } } },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: "Emergency case status updated",
      });
    }

    // Create new emergency case
    const body = await request.json();
    const data = createEmergencyCaseSchema.parse(body);

    const caseCount = await prisma.emergencyCase.count();
    const caseId = generateEmergencyId(caseCount + 1);

    const emergencyCase = await prisma.emergencyCase.create({
      data: {
        caseId,
        patientId: data.patientId,
        patientName: data.patientName,
        patientAge: data.patientAge,
        patientGender: data.patientGender,
        priority: data.priority,
        chiefComplaint: data.chiefComplaint,
        arrivalMode: data.arrivalMode,
        triageNotes: data.triageNotes,
        assignedDoctorId: data.assignedDoctorId,
        assignedAt: data.assignedDoctorId ? new Date() : null,
      },
      include: {
        patient: {
          select: { id: true, patientId: true, firstName: true, lastName: true },
        },
        assignedDoctor: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: emergencyCase, message: "Emergency case created" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 422 }
      );
    }
    console.error("POST /api/emergency error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
