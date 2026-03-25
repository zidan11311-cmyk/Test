import {
  Role,
  Gender,
  BloodGroup,
  AppointmentStatus,
  AppointmentType,
  PatientStatus,
  BedStatus,
  WardType,
  PrescriptionStatus,
  LabTestStatus,
  LabTestPriority,
  InvoiceStatus,
  PaymentMethod,
  EmergencyPriority,
  EmergencyStatus,
  DischargeType,
  MedicationRoute
} from "@prisma/client";

export type {
  Role,
  Gender,
  BloodGroup,
  AppointmentStatus,
  AppointmentType,
  PatientStatus,
  BedStatus,
  WardType,
  PrescriptionStatus,
  LabTestStatus,
  LabTestPriority,
  InvoiceStatus,
  PaymentMethod,
  EmergencyPriority,
  EmergencyStatus,
  DischargeType,
  MedicationRoute,
};

// ==================== AUTH TYPES ====================

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
}

export interface SessionUser extends AuthUser {
  accessToken?: string;
}

// ==================== PATIENT TYPES ====================

export interface PatientBasic {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: Gender;
  bloodGroup: BloodGroup;
  phone: string;
  email?: string | null;
  status: PatientStatus;
  createdAt: Date | string;
}

export interface PatientFull extends PatientBasic {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  nationalId?: string | null;
  insuranceNumber?: string | null;
  insuranceProvider?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  allergies: string[];
  chronicConditions: string[];
  notes?: string | null;
  photo?: string | null;
  updatedAt: Date | string;
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup?: BloodGroup;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  nationalId?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  allergies?: string[];
  chronicConditions?: string[];
  notes?: string;
}

// ==================== DOCTOR TYPES ====================

export interface DoctorBasic {
  id: string;
  doctorId: string;
  specialization: string;
  department: string;
  consultationFee: number;
  isAvailable: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
  };
}

export interface DoctorFull extends DoctorBasic {
  qualification: string;
  licenseNumber: string;
  availableDays: string[];
  startTime?: string | null;
  endTime?: string | null;
  bio?: string | null;
  experience: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateDoctorInput {
  userId: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  department: string;
  consultationFee?: number;
  availableDays?: string[];
  startTime?: string;
  endTime?: string;
  bio?: string;
  experience?: number;
}

// ==================== APPOINTMENT TYPES ====================

export interface AppointmentBasic {
  id: string;
  appointmentId: string;
  appointmentDate: Date | string;
  duration: number;
  type: AppointmentType;
  status: AppointmentStatus;
  reason?: string | null;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor: {
    id: string;
    doctorId: string;
    specialization: string;
    user: { name: string };
  };
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  duration?: number;
  type?: AppointmentType;
  reason?: string;
  notes?: string;
}

// ==================== MEDICAL RECORD TYPES ====================

export interface MedicalRecordBasic {
  id: string;
  recordId: string;
  visitDate: Date | string;
  chiefComplaint: string;
  diagnosis: string;
  treatment?: string | null;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
  };
  doctor: {
    id: string;
    user: { name: string };
    specialization: string;
  };
}

// ==================== PRESCRIPTION TYPES ====================

export interface PrescriptionWithItems {
  id: string;
  prescriptionId: string;
  status: PrescriptionStatus;
  createdAt: Date | string;
  patient: {
    firstName: string;
    lastName: string;
    patientId: string;
  };
  doctor: {
    user: { name: string };
    specialization: string;
  };
  items: Array<{
    id: string;
    dosage: string;
    frequency: string;
    route: MedicationRoute;
    duration: string;
    quantity: number;
    dispensedQty: number;
    instructions?: string | null;
    medication: {
      id: string;
      name: string;
      genericName?: string | null;
      strength?: string | null;
      unit: string;
    };
  }>;
}

// ==================== LAB TYPES ====================

export interface LabTestWithResults {
  id: string;
  testId: string;
  testName: string;
  testType: string;
  category: string;
  priority: LabTestPriority;
  status: LabTestStatus;
  sampleType?: string | null;
  cost: number;
  createdAt: Date | string;
  completedAt?: Date | string | null;
  patient: {
    firstName: string;
    lastName: string;
    patientId: string;
  };
  doctor: {
    user: { name: string };
  };
  results: Array<{
    id: string;
    parameter: string;
    value: string;
    unit?: string | null;
    normalRange?: string | null;
    isAbnormal: boolean;
    interpretation?: string | null;
  }>;
}

// ==================== EMERGENCY TYPES ====================

export interface EmergencyCaseBasic {
  id: string;
  caseId: string;
  patientName?: string | null;
  patientAge?: number | null;
  patientGender?: Gender | null;
  priority: EmergencyPriority;
  status: EmergencyStatus;
  chiefComplaint: string;
  arrivalMode?: string | null;
  createdAt: Date | string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  } | null;
  assignedDoctor?: {
    id: string;
    user: { name: string };
    specialization: string;
  } | null;
}

export interface CreateEmergencyCaseInput {
  patientId?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: Gender;
  priority: EmergencyPriority;
  chiefComplaint: string;
  arrivalMode?: string;
  triageNotes?: string;
  assignedDoctorId?: string;
}

// ==================== BILLING TYPES ====================

export interface InvoiceWithDetails {
  id: string;
  invoiceId: string;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  dueDate?: Date | string | null;
  createdAt: Date | string;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  items: Array<{
    id: string;
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  payments: Array<{
    id: string;
    paymentId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string | null;
    createdAt: Date | string;
  }>;
}

export interface CreateInvoiceInput {
  patientId: string;
  items: Array<{
    description: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }>;
  discount?: number;
  tax?: number;
  dueDate?: string;
  notes?: string;
}

// ==================== DISCHARGE TYPES ====================

export interface DischargeWithDetails {
  id: string;
  dischargeId: string;
  dischargeDate: Date | string;
  dischargeType: DischargeType;
  finalDiagnosis: string;
  dischargeSummary?: string | null;
  followUpDate?: Date | string | null;
  followUpInstructions?: string | null;
  patientCondition?: string | null;
  patient: {
    firstName: string;
    lastName: string;
    patientId: string;
  };
  doctor: {
    user: { name: string };
    specialization: string;
  };
  admission: {
    admissionId: string;
    admissionDate: Date | string;
    ward: { name: string };
  };
}

// ==================== VITAL SIGNS TYPES ====================

export interface VitalSignInput {
  patientId: string;
  medicalRecordId?: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bloodGlucose?: number;
  notes?: string;
}

// ==================== DASHBOARD TYPES ====================

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  pendingLabTests: number;
  pendingPrescriptions: number;
  activeEmergencyCases: number;
  totalRevenue: number;
  occupiedBeds: number;
  totalBeds: number;
}

export interface RecentActivity {
  id: string;
  type: "appointment" | "patient" | "emergency" | "lab" | "prescription";
  description: string;
  time: string;
  status?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ==================== FORM TYPES ====================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface PatientFormData extends CreatePatientInput {
  confirmPhone?: string;
}

export interface AppointmentFormData extends CreateAppointmentInput {
  // additional form-specific fields
}

// ==================== NAVIGATION TYPES ====================

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  roles?: Role[];
  badge?: number;
  children?: NavItem[];
}

// ==================== NOTIFICATION TYPES ====================

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: Date | string;
  readAt?: Date | string | null;
}
