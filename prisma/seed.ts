import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@12345", 12);

  // Create default admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@medcore.com" },
    update: {},
    create: {
      email: "admin@medcore.com",
      name: "System Admin",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  // Create a sample doctor user
  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@medcore.com" },
    update: {},
    create: {
      email: "doctor@medcore.com",
      name: "Dr. John Smith",
      password: await bcrypt.hash("Doctor@12345", 12),
      role: "DOCTOR",
      isActive: true,
    },
  });

  // Create doctor profile
  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialization: "General Medicine",
      licenseNumber: "LIC-001",
      isAvailable: true,
    },
  });

  // Create a sample nurse user
  await prisma.user.upsert({
    where: { email: "nurse@medcore.com" },
    update: {},
    create: {
      email: "nurse@medcore.com",
      name: "Nurse Sarah Johnson",
      password: await bcrypt.hash("Nurse@12345", 12),
      role: "NURSE",
      isActive: true,
    },
  });

  // Create a receptionist user
  await prisma.user.upsert({
    where: { email: "reception@medcore.com" },
    update: {},
    create: {
      email: "reception@medcore.com",
      name: "Reception Staff",
      password: await bcrypt.hash("Recept@12345", 12),
      role: "RECEPTIONIST",
      isActive: true,
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("─────────────────────────────────────");
  console.log("🔐 Default Login Credentials:");
  console.log("─────────────────────────────────────");
  console.log("Admin:       admin@medcore.com     / Admin@12345");
  console.log("Doctor:      doctor@medcore.com    / Doctor@12345");
  console.log("Nurse:       nurse@medcore.com     / Nurse@12345");
  console.log("Reception:   reception@medcore.com / Recept@12345");
  console.log("─────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
