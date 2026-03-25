import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateInvoiceId, generatePaymentId } from "@/lib/utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createInvoiceSchema = z.object({
  patientId: z.string(),
  items: z.array(
    z.object({
      description: z.string(),
      category: z.string(),
      quantity: z.number().min(1).default(1),
      unitPrice: z.number().min(0),
    })
  ).min(1, "At least one item is required"),
  discount: z.number().min(0).optional().default(0),
  tax: z.number().min(0).optional().default(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const addPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().min(0.01),
  method: z.enum([
    "CASH", "CREDIT_CARD", "DEBIT_CARD", "BANK_TRANSFER",
    "INSURANCE", "MOBILE_PAYMENT", "CHEQUE"
  ]),
  reference: z.string().optional(),
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
    const patientId = searchParams.get("patientId") || "";
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (search) {
      where.OR = [
        { invoiceId: { contains: search, mode: "insensitive" } },
        { patient: { firstName: { contains: search, mode: "insensitive" } } },
        { patient: { lastName: { contains: search, mode: "insensitive" } } },
        { patient: { patientId: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status) {
      where.status = status as "DRAFT" | "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
    }
    if (patientId) where.patientId = patientId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          items: true,
          payments: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/billing error:", error);
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

    if (action === "payment") {
      if (!["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 403 }
        );
      }

      const body = await request.json();
      const data = addPaymentSchema.parse(body);

      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { payments: true },
      });

      if (!invoice) {
        return NextResponse.json(
          { success: false, error: "Invoice not found" },
          { status: 404 }
        );
      }

      if (invoice.status === "PAID") {
        return NextResponse.json(
          { success: false, error: "Invoice already paid" },
          { status: 409 }
        );
      }

      const paymentCount = await prisma.payment.count();
      const paymentId = generatePaymentId(paymentCount + 1);

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            paymentId,
            invoiceId: data.invoiceId,
            amount: data.amount,
            method: data.method,
            reference: data.reference,
            notes: data.notes,
            processedById: session.user.id,
          },
        });

        const totalPaid = invoice.amountPaid + data.amount;
        const balance = invoice.total - totalPaid;

        let newStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
        if (balance <= 0) {
          newStatus = "PAID";
        } else if (totalPaid > 0) {
          newStatus = "PARTIALLY_PAID";
        } else {
          newStatus = "PENDING";
        }

        await tx.invoice.update({
          where: { id: data.invoiceId },
          data: {
            amountPaid: totalPaid,
            balance: Math.max(0, balance),
            status: newStatus,
          },
        });

        return payment;
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: "Payment recorded successfully",
      });
    }

    // Create invoice
    if (!["ADMIN", "RECEPTIONIST"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Receptionist or Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createInvoiceSchema.parse(body);

    // Verify patient
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    const invoiceCount = await prisma.invoice.count();
    const invoiceId = generateInvoiceId(invoiceCount + 1);

    // Calculate totals
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const taxAmount = (subtotal - discount) * (tax / 100);
    const total = subtotal - discount + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceId,
        patientId: data.patientId,
        subtotal,
        discount,
        tax: taxAmount,
        total,
        balance: total,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        createdById: session.user.id,
        items: {
          create: data.items.map((item) => ({
            description: item.description,
            category: item.category,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        patient: {
          select: { id: true, patientId: true, firstName: true, lastName: true },
        },
        items: true,
      },
    });

    return NextResponse.json(
      { success: true, data: invoice, message: "Invoice created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation error", details: error.errors },
        { status: 422 }
      );
    }
    console.error("POST /api/billing error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
