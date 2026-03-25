import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateAppointmentId } from "@/lib/utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  appointmentDate: z.string(),
  duration: z.number().min(15).max(240).optional().default(30),
  type: z.enum([
    "CONSULTATION", "FOLLOW_UP", "EMERGENCY", "PROCEDURE", "LAB_TEST", "VACCINATION"
  ]).optional().default("CONSULTATION"),
  reason: z.string().optional(),
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
    const doctorId = searchParams.get("doctorId") || "";
    const patientId = searchParams.get("patientId") || "";
    const date = searchParams.get("date") || "";

    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = {};

    if (search) {
      where.OR = [
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { appointmentId: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status as "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    }

    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.appointmentDate = { gte: startDate, lte: endDate };
    }

    // For non-admin roles, filter by their context
    if (session.user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.user.id },
      });
      if (doctor) {
        where.doctorId = doctor.id;
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appointmentDate: "desc" },
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
            include: {
              user: { select: { name: true } },
            },
          },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/appointments error:", error);
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
    const validatedData = createAppointmentSchema.parse(body);

    // Verify patient and doctor exist
    const [patient, doctor] = await Promise.all([
      prisma.patient.findUnique({ where: { id: validatedData.patientId } }),
      prisma.doctor.findUnique({ where: { id: validatedData.doctorId } }),
    ]);

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor not found" },
        { status: 404 }
      );
    }

    // Check for scheduling conflicts
    const appointmentDate = new Date(validatedData.appointmentDate);
    const endTime = new Date(
      appointmentDate.getTime() + (validatedData.duration || 30) * 60 * 1000
    );

    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: validatedData.doctorId,
        status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
        appointmentDate: {
          gte: appointmentDate,
          lt: endTime,
        },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { success: false, error: "Doctor has a conflicting appointment at this time" },
        { status: 409 }
      );
    }

    const appointmentCount = await prisma.appointment.count();
    const appointmentId = generateAppointmentId(appointmentCount + 1);

    const appointment = await prisma.appointment.create({
      data: {
        appointmentId,
        patientId: validatedData.patientId,
        doctorId: validatedData.doctorId,
        appointmentDate: appointmentDate,
        duration: validatedData.duration || 30,
        type: validatedData.type || "CONSULTATION",
        reason: validatedData.reason,
        notes: validatedData.notes,
        createdById: session.user.id,
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
      { success: true, data: appointment, message: "Appointment scheduled successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 422 }
      );
    }
    console.error("POST /api/appointments error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
