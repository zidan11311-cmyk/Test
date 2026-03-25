import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateDoctorId, hashPassword } from "@/lib/utils";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createDoctorSchema = z.object({
  // User fields
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  // Doctor fields
  specialization: z.string().min(2),
  qualification: z.string().min(2),
  licenseNumber: z.string().min(3),
  department: z.string().min(2),
  consultationFee: z.number().min(0).optional().default(0),
  availableDays: z.array(z.string()).optional().default([]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  bio: z.string().optional(),
  experience: z.number().min(0).optional().default(0),
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
    const department = searchParams.get("department") || "";
    const available = searchParams.get("available") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { specialization: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
        { doctorId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (department) where.department = { contains: department, mode: "insensitive" };
    if (available === "true") where.isAvailable = true;

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              appointments: true,
              medicalRecords: true,
            },
          },
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: doctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/doctors error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createDoctorSchema.parse(body);

    // Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 409 }
      );
    }

    // Check for duplicate license
    const existingLicense = await prisma.doctor.findUnique({
      where: { licenseNumber: validatedData.licenseNumber },
    });

    if (existingLicense) {
      return NextResponse.json(
        { success: false, error: "License number already registered" },
        { status: 409 }
      );
    }

    const doctorCount = await prisma.doctor.count();
    const doctorId = generateDoctorId(doctorCount + 1);
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email.toLowerCase(),
          password: hashedPassword,
          role: "DOCTOR",
          phone: validatedData.phone,
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          doctorId,
          userId: user.id,
          specialization: validatedData.specialization,
          qualification: validatedData.qualification,
          licenseNumber: validatedData.licenseNumber,
          department: validatedData.department,
          consultationFee: validatedData.consultationFee || 0,
          availableDays: validatedData.availableDays || [],
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          bio: validatedData.bio,
          experience: validatedData.experience || 0,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      });

      return doctor;
    });

    return NextResponse.json(
      { success: true, data: result, message: "Doctor registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 422 }
      );
    }
    console.error("POST /api/doctors error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
