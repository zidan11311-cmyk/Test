import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==================== DATE UTILITIES ====================

export function formatDate(date: Date | string | null | undefined, fmt = "MMM dd, yyyy"): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "—";
    return format(d, fmt);
  } catch {
    return "—";
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, "MMM dd, yyyy HH:mm");
}

export function formatTime(date: Date | string | null | undefined): string {
  return formatDate(date, "HH:mm");
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(d)) return "—";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "—";
  }
}

export function calculateAge(dateOfBirth: Date | string | null | undefined): number {
  if (!dateOfBirth) return 0;
  try {
    const dob = typeof dateOfBirth === "string" ? parseISO(dateOfBirth) : dateOfBirth;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 0;
  }
}

// ==================== STRING UTILITIES ====================

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

export function formatName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ==================== NUMBER UTILITIES ====================

export function formatCurrency(
  amount: number,
  currency = "NGN",
  locale = "en-NG"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function roundTo(num: number, decimals: number): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// ==================== ID GENERATORS ====================

export function generatePatientId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `P-${year}-${paddedCount}`;
}

export function generateAppointmentId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `APT-${year}-${paddedCount}`;
}

export function generateDoctorId(count: number): string {
  const paddedCount = String(count).padStart(3, "0");
  return `D-${paddedCount}`;
}

export function generateNurseId(count: number): string {
  const paddedCount = String(count).padStart(3, "0");
  return `N-${paddedCount}`;
}

export function generateRecordId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `MR-${year}-${paddedCount}`;
}

export function generatePrescriptionId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `RX-${year}-${paddedCount}`;
}

export function generateLabTestId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `LT-${year}-${paddedCount}`;
}

export function generateInvoiceId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `INV-${year}-${paddedCount}`;
}

export function generatePaymentId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `PAY-${year}-${paddedCount}`;
}

export function generateEmergencyId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `EM-${year}-${paddedCount}`;
}

export function generateAdmissionId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `ADM-${year}-${paddedCount}`;
}

export function generateDischargeId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `DC-${year}-${paddedCount}`;
}

export function generateFollowUpId(count: number): string {
  const year = new Date().getFullYear();
  const paddedCount = String(count).padStart(4, "0");
  return `FU-${year}-${paddedCount}`;
}

// ==================== ENUM FORMATTERS ====================

export function formatBloodGroup(bg: string): string {
  const mapping: Record<string, string> = {
    A_POSITIVE: "A+",
    A_NEGATIVE: "A-",
    B_POSITIVE: "B+",
    B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+",
    AB_NEGATIVE: "AB-",
    O_POSITIVE: "O+",
    O_NEGATIVE: "O-",
    UNKNOWN: "Unknown",
  };
  return mapping[bg] || bg;
}

export function formatRole(role: string): string {
  const mapping: Record<string, string> = {
    ADMIN: "Administrator",
    DOCTOR: "Doctor",
    NURSE: "Nurse",
    PHARMACIST: "Pharmacist",
    LAB_TECHNICIAN: "Lab Technician",
    RECEPTIONIST: "Receptionist",
  };
  return mapping[role] || role;
}

export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => capitalize(word))
    .join(" ");
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    ACTIVE: "green",
    INACTIVE: "gray",
    DISCHARGED: "blue",
    DECEASED: "red",
    SCHEDULED: "blue",
    CONFIRMED: "green",
    IN_PROGRESS: "yellow",
    COMPLETED: "green",
    CANCELLED: "red",
    NO_SHOW: "gray",
    PENDING: "yellow",
    DISPENSED: "green",
    PARTIALLY_DISPENSED: "orange",
    ORDERED: "blue",
    SAMPLE_COLLECTED: "yellow",
    DRAFT: "gray",
    PARTIALLY_PAID: "orange",
    PAID: "green",
    OVERDUE: "red",
    REFUNDED: "purple",
    WAITING: "yellow",
    TRIAGE: "orange",
    TREATMENT: "blue",
    OBSERVATION: "purple",
    ADMITTED: "green",
    TRANSFERRED: "blue",
    AVAILABLE: "green",
    OCCUPIED: "red",
    MAINTENANCE: "yellow",
    RESERVED: "blue",
    P1_IMMEDIATE: "red",
    P2_URGENT: "orange",
    P3_LESS_URGENT: "yellow",
    P4_NON_URGENT: "green",
    P5_DECEASED: "gray",
  };
  return colorMap[status] || "gray";
}

export function getEmergencyPriorityLabel(priority: string): string {
  const mapping: Record<string, string> = {
    P1_IMMEDIATE: "P1 - Immediate",
    P2_URGENT: "P2 - Urgent",
    P3_LESS_URGENT: "P3 - Less Urgent",
    P4_NON_URGENT: "P4 - Non-Urgent",
    P5_DECEASED: "P5 - Deceased",
  };
  return mapping[priority] || priority;
}

// ==================== VALIDATION UTILITIES ====================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
}

export function isValidNationalId(id: string): boolean {
  return id.length >= 8 && id.length <= 20;
}

// ==================== ARRAY UTILITIES ====================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      return {
        ...groups,
        [groupKey]: [...(groups[groupKey] || []), item],
      };
    },
    {} as Record<string, T[]>
  );
}

export function sortBy<T>(array: T[], key: keyof T, direction: "asc" | "desc" = "asc"): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

// ==================== PAGINATION UTILITIES ====================

export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): (number | "...")[] {
  const totalPageNumbers = siblingCount + 5;

  if (totalPageNumbers >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftDots = leftSiblingIndex > 2;
  const showRightDots = rightSiblingIndex < totalPages - 2;

  if (!showLeftDots && showRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "...", totalPages];
  }

  if (showLeftDots && !showRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, "...", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, "...", ...middleRange, "...", totalPages];
}

// ==================== BMI CALCULATOR ====================

export function calculateBMI(weight: number, height: number): number {
  if (!weight || !height) return 0;
  const heightInMeters = height / 100;
  return roundTo(weight / (heightInMeters * heightInMeters), 1);
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

// ==================== DEBOUNCE ====================

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
