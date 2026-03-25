import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateLabTestId } from "@/lib/utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createLabTestSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  medicalRecordId: z.string().optional(),
  testType: z.string(),
  testName: z.string(),
  category: z.string(),
  priority: z.enum(["ROUTINE", "URGENT", "STAT"]).optional().default("ROUTINE"),
  sampleType: z.string().optional(),
  clinicalInfo: z.string().optional(),
  notes: z.string().optional(),
  cost: z.number().min(0).optional().default(0),
});

const addResultSchema = z.object({
  labTestId: z.string(),
  results: z.array(
    z.object({
      parameter: z.string(),
      value: z.string(),
      unit: z.string().optional(),
      normalRange: z.string().optional(),
      isAbnormal: z.boolean().optional().default(false),
      interpretation: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
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
    const patientId = searchParams.get("patientId") || "";
    const skip = (page - 1) * limit;

    const where: Prisma.LabTestWhereInput = {};

    if (search) {
      where.OR = [
        { testId: { contains: search, mode: "insensitive" } },
        { testName: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { patient: { patientId: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) where.status = status as "ORDERED" | "SAMPLE_COLLECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    if (priority) where.priority = priority as "ROUTINE" | "URGENT" | "STAT";
    if (patientId) where.patientId = patientId;

    const [labTests, total] = await Promise.all([
      prisma.labTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              patientId: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          doctor: {
            include: { user: { select: { name: true } } },
          },
          results: true,
        },
      }),
      prisma.labTest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: labTests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/laboratory error:", error);
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

    if (action === "add-results") {
      if (!["ADMIN", "LAB_TECHNICIAN", "DOCTOR"].includes(session.user.role)) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const data = addResultSchema.parse(body);

      const labTest = await prisma.labTest.findUnique({
        where: { id: data.labTestId },
      });

      if (!labTest) {
        return NextResponse.json(
          { success: false, error: "Lab test not found" },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Delete existing results
        await tx.labResult.deleteMany({ where: { labTestId: data.labTestId } });

        // Create new results
        await tx.labResult.createMany({
          data: data.results.map((result) => ({
            ...result,
            labTestId: data.labTestId,
          })),
        });

        // Update test status
        await tx.labTest.update({
          where: { id: data.labTestId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            technologistId: session.user.id,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Lab results added successfully",
      });
    }

    // Create new lab test
    if (!["ADMIN", "DOCTOR", "LAB_TECHNICIAN"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createLabTestSchema.parse(body);

    const testCount = await prisma.labTest.count();
    const testId = generateLabTestId(testCount + 1);

    const labTest = await prisma.labTest.create({
      data: {
        ...data,
        testId,
      },
      include: {
        patient: {
          select: { id: true, patientId: true, firstName: true, lastName: true },
        },
        doctor: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: labTest, message: "Lab test ordered successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 422 }
      );
    }
    console.error("POST /api/laboratory error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
