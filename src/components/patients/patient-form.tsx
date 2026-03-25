"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { Loader2, Save, X } from "lucide-react";

const patientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodGroup: z.enum([
    "A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE",
    "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE", "UNKNOWN"
  ]).optional(),
  phone: z.string().min(7, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  nationalId: z.string().optional(),
  insuranceNumber: z.string().optional(),
  insuranceProvider: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

interface PatientFormProps {
  initialData?: Partial<PatientFormValues & { id: string }>;
  isEdit?: boolean;
}

export function PatientForm({ initialData, isEdit = false }: PatientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      dateOfBirth: initialData?.dateOfBirth || "",
      gender: initialData?.gender || "MALE",
      bloodGroup: initialData?.bloodGroup || "UNKNOWN",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      postalCode: initialData?.postalCode || "",
      country: initialData?.country || "Nigeria",
      nationalId: initialData?.nationalId || "",
      insuranceNumber: initialData?.insuranceNumber || "",
      insuranceProvider: initialData?.insuranceProvider || "",
      emergencyContact: initialData?.emergencyContact || "",
      emergencyPhone: initialData?.emergencyPhone || "",
      emergencyRelation: initialData?.emergencyRelation || "",
      allergies: "",
      chronicConditions: "",
      notes: initialData?.notes || "",
    },
  });

  const onSubmit = async (data: PatientFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        allergies: data.allergies
          ? data.allergies.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
        chronicConditions: data.chronicConditions
          ? data.chronicConditions.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
      };

      const url = isEdit
        ? `/api/patients/${initialData?.id}`
        : "/api/patients";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save patient");
      }

      const result = await response.json();

      toast({
        title: isEdit ? "Patient Updated" : "Patient Registered",
        description: isEdit
          ? "Patient information has been updated successfully."
          : `Patient registered with ID: ${result.data?.patientId}`,
        variant: "default",
      });

      router.push(`/patients/${result.data?.id}`);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save patient",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              {...register("firstName")}
              error={errors.firstName?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              {...register("lastName")}
              error={errors.lastName?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">
              Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              {...register("dateOfBirth")}
              error={errors.dateOfBirth?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">
              Gender <span className="text-destructive">*</span>
            </Label>
            <Select
              defaultValue={watch("gender")}
              onValueChange={(val) => setValue("gender", val as "MALE" | "FEMALE" | "OTHER")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Select
              defaultValue={watch("bloodGroup")}
              onValueChange={(val) => setValue("bloodGroup", val as PatientFormValues["bloodGroup"])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A_POSITIVE">A+</SelectItem>
                <SelectItem value="A_NEGATIVE">A-</SelectItem>
                <SelectItem value="B_POSITIVE">B+</SelectItem>
                <SelectItem value="B_NEGATIVE">B-</SelectItem>
                <SelectItem value="AB_POSITIVE">AB+</SelectItem>
                <SelectItem value="AB_NEGATIVE">AB-</SelectItem>
                <SelectItem value="O_POSITIVE">O+</SelectItem>
                <SelectItem value="O_NEGATIVE">O-</SelectItem>
                <SelectItem value="UNKNOWN">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID</Label>
            <Input
              id="nationalId"
              placeholder="National ID number"
              {...register("nationalId")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 xxx xxx xxxx"
              {...register("phone")}
              error={errors.phone?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="patient@example.com"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Street address"
              {...register("address")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="City" {...register("city")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" placeholder="State" {...register("state")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              placeholder="Postal code"
              {...register("postalCode")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="Country"
              {...register("country")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Insurance Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="insuranceProvider">Insurance Provider</Label>
            <Input
              id="insuranceProvider"
              placeholder="Insurance company name"
              {...register("insuranceProvider")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="insuranceNumber">Insurance Number</Label>
            <Input
              id="insuranceNumber"
              placeholder="Policy number"
              {...register("insuranceNumber")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Contact Name</Label>
            <Input
              id="emergencyContact"
              placeholder="Full name"
              {...register("emergencyContact")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Phone Number</Label>
            <Input
              id="emergencyPhone"
              type="tel"
              placeholder="Phone number"
              {...register("emergencyPhone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyRelation">Relationship</Label>
            <Input
              id="emergencyRelation"
              placeholder="e.g., Spouse, Parent"
              {...register("emergencyRelation")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Medical Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="allergies">Known Allergies</Label>
            <Input
              id="allergies"
              placeholder="e.g., Penicillin, Aspirin, Peanuts (comma separated)"
              {...register("allergies")}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple allergies with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chronicConditions">Chronic Conditions</Label>
            <Input
              id="chronicConditions"
              placeholder="e.g., Diabetes, Hypertension (comma separated)"
              {...register("chronicConditions")}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple conditions with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Any additional notes about the patient..."
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
          {isEdit ? "Update Patient" : "Register Patient"}
        </Button>
      </div>
    </form>
  );
}
