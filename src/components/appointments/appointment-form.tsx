"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, X, Search } from "lucide-react";

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  duration: z.number().min(15).max(240).optional(),
  type: z.enum([
    "CONSULTATION", "FOLLOW_UP", "EMERGENCY", "PROCEDURE", "LAB_TEST", "VACCINATION"
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Doctor {
  id: string;
  doctorId: string;
  specialization: string;
  department: string;
  consultationFee: number;
  user: { name: string };
}

export function AppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: preselectedPatientId || "",
      doctorId: "",
      appointmentDate: "",
      appointmentTime: "09:00",
      duration: 30,
      type: "CONSULTATION",
      reason: "",
      notes: "",
    },
  });

  // Load doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const res = await fetch("/api/doctors?limit=100");
        const data = await res.json();
        if (data.success) {
          setDoctors(data.data || []);
        }
      } catch {
        console.error("Failed to load doctors");
      } finally {
        setIsLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Load patients (with search)
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoadingPatients(true);
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (patientSearch) params.set("search", patientSearch);
        const res = await fetch(`/api/patients?${params}`);
        const data = await res.json();
        if (data.success) {
          setPatients(data.data || []);
        }
      } catch {
        console.error("Failed to load patients");
      } finally {
        setIsLoadingPatients(false);
      }
    };

    const debounce = setTimeout(fetchPatients, 300);
    return () => clearTimeout(debounce);
  }, [patientSearch]);

  const onSubmit = async (data: AppointmentFormValues) => {
    setIsSubmitting(true);
    try {
      // Combine date and time
      const appointmentDateTime = new Date(
        `${data.appointmentDate}T${data.appointmentTime}`
      ).toISOString();

      const payload = {
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentDate: appointmentDateTime,
        duration: data.duration || 30,
        type: data.type,
        reason: data.reason,
        notes: data.notes,
      };

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create appointment");
      }

      const result = await response.json();

      toast({
        title: "Appointment Scheduled",
        description: `Appointment created with ID: ${result.data?.appointmentId}`,
      });

      router.push("/appointments");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === watch("patientId"));
  const selectedDoctor = doctors.find((d) => d.id === watch("doctorId"));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Patient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Search Patient <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Type to search patients..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Select Patient <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("patientId")}
              onValueChange={(val) => setValue("patientId", val)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingPatients ? "Loading..." : "Select patient"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.patientId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.patientId && (
              <p className="text-destructive text-xs">
                {errors.patientId.message}
              </p>
            )}
          </div>

          {selectedPatient && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
              <p className="text-muted-foreground">
                ID: {selectedPatient.patientId} · Phone: {selectedPatient.phone}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Doctor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Doctor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Select Doctor <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("doctorId")}
              onValueChange={(val) => setValue("doctorId", val)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingDoctors ? "Loading..." : "Select doctor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.user.name} – {doctor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.doctorId && (
              <p className="text-destructive text-xs">
                {errors.doctorId.message}
              </p>
            )}
          </div>

          {selectedDoctor && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <p className="font-medium">Dr. {selectedDoctor.user.name}</p>
              <p className="text-muted-foreground">
                {selectedDoctor.specialization} · {selectedDoctor.department}
              </p>
              <p className="text-muted-foreground">
                Consultation fee: ₦{selectedDoctor.consultationFee.toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointment Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="appointmentDate">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="appointmentDate"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              {...register("appointmentDate")}
              error={errors.appointmentDate?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointmentTime">
              Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id="appointmentTime"
              type="time"
              {...register("appointmentTime")}
              error={errors.appointmentTime?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Appointment Type</Label>
            <Select
              defaultValue={watch("type")}
              onValueChange={(val) =>
                setValue("type", val as AppointmentFormValues["type"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONSULTATION">Consultation</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
                <SelectItem value="PROCEDURE">Procedure</SelectItem>
                <SelectItem value="LAB_TEST">Lab Test</SelectItem>
                <SelectItem value="VACCINATION">Vaccination</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select
              defaultValue="30"
              onValueChange={(val) => setValue("duration", Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Input
              id="reason"
              placeholder="Brief description of the reason..."
              {...register("reason")}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Any additional notes..."
              {...register("notes")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Schedule Appointment
        </Button>
      </div>
    </form>
  );
}
