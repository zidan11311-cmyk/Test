import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const dispensePrescriptionSchema = z.object({
  prescriptionId: z.string(),
  items: z.array(
    z.object({
      prescriptionItemId: z.string(),
      dispensedQty: z.number().min(1),
    })
  ),
  notes: z.string().optional(),
});

const createMedicationSchema = z.object({
  name: z.string().min(2),
  genericName: z.string().optional(),
  category: z.string().min(2),
  unit: z.string().min(1),
  strength: z.string().optional(),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  sideEffects: z.array(z.string()).optional().default([]),
  contraindications: z.array(z.string()).optional().default([]),
  requiresPrescription: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "prescriptions";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const skip = (page - 1) * limit;

    if (type === "medications") {
      const where: Prisma.MedicationWhereInput = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
          { category: { contains: search, mode: "insensitive" } },
        ];
      }

      const [medications, total] = await Promise.all([
        prisma.medication.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          include: {
            inventoryItems: {
              orderBy: { receivedDate: "desc" },
              take: 1,
            },
          },
        }),
        prisma.medication.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: medications,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    // Default: prescriptions
    const where: Prisma.PrescriptionWhereInput = {};
    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { prescriptionId: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status as "PENDING" | "DISPENSED" | "PARTIALLY_DISPENSED" | "CANCELLED";
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
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
          items: {
            include: { medication: true },
          },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: prescriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/pharmacy error:", error);
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
    const action = searchParams.get("action") || "dispense";

    if (action === "create-medication") {
      if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const data = createMedicationSchema.parse(body);

      const medication = await prisma.medication.create({ data });

      return NextResponse.json(
        { success: true, data: medication, message: "Medication added successfully" },
        { status: 201 }
      );
    }

    // Dispense prescription
    if (!["ADMIN", "PHARMACIST"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Pharmacist access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = dispensePrescriptionSchema.parse(body);

    const prescription = await prisma.prescription.findUnique({
      where: { id: data.prescriptionId },
      include: { items: true },
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (prescription.status === "DISPENSED") {
      return NextResponse.json(
        { success: false, error: "Prescription already dispensed" },
        { status: 409 }
      );
    }

    // Update each item's dispensed quantity
    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        await tx.prescriptionItem.update({
          where: { id: item.prescriptionItemId },
          data: { dispensedQty: item.dispensedQty },
        });
      }

      // Check if all items are fully dispensed
      const updatedItems = await tx.prescriptionItem.findMany({
        where: { prescriptionId: data.prescriptionId },
      });

      const allDispensed = updatedItems.every(
        (item) => item.dispensedQty >= item.quantity
      );
      const anyDispensed = updatedItems.some((item) => item.dispensedQty > 0);

      const newStatus = allDispensed
        ? "DISPENSED"
        : anyDispensed
        ? "PARTIALLY_DISPENSED"
        : "PENDING";

      await tx.prescription.update({
        where: { id: data.prescriptionId },
        data: {
          status: newStatus,
          dispensedById: session.user.id,
          dispensedAt: new Date(),
          notes: data.notes,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Prescription dispensed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 422 }
      );
    }
    console.error("POST /api/pharmacy error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
