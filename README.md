# MedCore HMS — Hospital Clinic Management System

A comprehensive, production-ready Hospital Management System built with **Next.js 14**, **TypeScript**, **Prisma ORM**, **NextAuth.js**, and **Tailwind CSS**.

---

## Features

### Modules
| Module | Description |
|--------|-------------|
| **Authentication & RBAC** | Secure login with 6 roles: Admin, Doctor, Nurse, Pharmacist, Lab Technician, Receptionist |
| **Patient Registration** | Full patient profiles, medical history, allergies, insurance |
| **Emergency Room (ER)** | Real-time triage with 5-level priority system (P1–P5) |
| **Nurse Module** | Ward management, bed occupancy, vital signs tracking |
| **Pharmacy Module** | Prescription management and medication dispensing |
| **Laboratory Module** | Lab test ordering and results management |
| **Doctor Module** | Doctor profiles, scheduling, medical records |
| **Appointment Scheduling** | Conflict-aware booking with multiple appointment types |
| **Billing & Invoicing** | Invoice generation, payment tracking, multiple payment methods |
| **Discharge Management** | Admission/discharge workflow with documentation |
| **Reports & Analytics** | KPIs, demographics, performance metrics |
| **Administration** | User management, audit logs, system settings |
| **WhatsApp Integration** | Placeholder for notification integration |

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v4 (Credentials Provider + JWT)
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/         # Login page
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── patients/      # Patient management
│   │   ├── appointments/  # Appointment scheduling
│   │   ├── doctors/       # Doctor directory
│   │   ├── emergency/     # Emergency room
│   │   ├── pharmacy/      # Pharmacy module
│   │   ├── laboratory/    # Lab module
│   │   ├── nursing/       # Nursing module
│   │   ├── billing/       # Billing & invoicing
│   │   ├── discharge/     # Discharge management
│   │   ├── reports/       # Reports & analytics
│   │   └── admin/         # Administration
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth handlers
│   │   ├── patients/      # Patient CRUD
│   │   ├── appointments/  # Appointment CRUD
│   │   ├── doctors/       # Doctor CRUD
│   │   ├── pharmacy/      # Pharmacy operations
│   │   ├── laboratory/    # Lab operations
│   │   ├── billing/       # Billing operations
│   │   └── emergency/     # Emergency operations
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Sidebar, Header
│   ├── dashboard/         # Dashboard components
│   ├── patients/          # Patient components
│   ├── appointments/      # Appointment components
│   └── providers/         # Context providers
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # NextAuth config + RBAC
│   └── utils.ts           # Utility functions
└── types/
    └── index.ts           # TypeScript types
prisma/
└── schema.prisma          # Database schema (20+ models)
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or Docker)
- npm / yarn / pnpm

### 1. Clone & Install

```bash
git clone <repository-url>
cd hospital-cms
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hospital_db"
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set Up Database

```bash
# Push schema to database
npm run prisma:push

# Or use migrations
npm run prisma:migrate

# Open Prisma Studio (optional)
npm run prisma:studio
```

### 4. Seed Demo Data

Create a seed file or manually insert demo users:

```sql
-- Example admin user (password: Admin@123)
INSERT INTO users (id, email, name, password, role) VALUES
('admin-001', 'admin@medcore.com', 'System Admin', '$2a$12$...', 'ADMIN');
```

Or use the Prisma seed script if provided.

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Docker Setup

```bash
# Start PostgreSQL only
docker-compose up db -d

# Start everything
docker-compose up -d

# Start with pgAdmin
docker-compose --profile tools up -d
```

---

## Role-Based Access Control

| Permission | Admin | Doctor | Nurse | Pharmacist | Lab Tech | Receptionist |
|------------|-------|--------|-------|------------|----------|--------------|
| Patients (Read) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Patients (Write) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Medical Records | ✅ | ✅ | Read | Read | Read | ❌ |
| Appointments | ✅ | ✅ | Read | ❌ | ❌ | ✅ |
| Pharmacy | ✅ | Read | ❌ | ✅ | ❌ | ❌ |
| Laboratory | ✅ | ✅ | Read | ❌ | ✅ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Emergency | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Administration | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Database Schema

The Prisma schema includes 20+ models:

- **Users, Accounts, Sessions** — Authentication
- **Patient** — Patient demographics and medical info
- **Doctor, Nurse** — Medical staff profiles
- **Ward, Bed, Admission** — Inpatient management
- **Appointment** — Scheduling
- **MedicalRecord, VitalSign** — Clinical data
- **Medication, MedicationInventory** — Drug management
- **Prescription, PrescriptionItem** — Prescription workflow
- **LabTest, LabResult** — Laboratory management
- **EmergencyCase** — Emergency triage
- **Invoice, InvoiceItem, Payment** — Billing
- **Discharge** — Discharge documentation
- **FollowUp** — Follow-up management
- **Notification** — Alerts and messaging
- **AuditLog** — Security audit trail
- **Department, SystemSettings** — Configuration

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/patients` | List/create patients |
| GET/PUT/DELETE | `/api/patients/[id]` | Patient CRUD |
| GET/POST | `/api/appointments` | List/create appointments |
| GET/POST | `/api/doctors` | List/create doctors |
| GET/POST | `/api/pharmacy` | Prescriptions & dispensing |
| GET/POST | `/api/laboratory` | Lab tests & results |
| GET/POST | `/api/billing` | Invoices & payments |
| GET/POST | `/api/emergency` | Emergency cases |

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Support

For issues and feature requests, please open a GitHub issue.

Built with by MedCore Systems Team.
