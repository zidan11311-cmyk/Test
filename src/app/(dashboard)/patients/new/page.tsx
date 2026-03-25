import { Metadata } from "next";
import { PatientForm } from "@/components/patients/patient-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Register New Patient",
};

export default function NewPatientPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/patients">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Register New Patient</h1>
          <p className="text-muted-foreground mt-1">
            Fill in the patient information below to register them in the system
          </p>
        </div>
      </div>

      <PatientForm />
    </div>
  );
}
