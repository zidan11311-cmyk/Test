import { Metadata } from "next";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "New Appointment",
};

export default function NewAppointmentPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/appointments">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Schedule Appointment</h1>
          <p className="text-muted-foreground mt-1">
            Book a new appointment for a patient
          </p>
        </div>
      </div>

      <AppointmentForm />
    </div>
  );
}
