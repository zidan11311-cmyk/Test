import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import { UserCog, Phone, Mail, Star, Stethoscope } from "lucide-react";

export const metadata: Metadata = {
  title: "Doctors",
};

async function getDoctors() {
  return prisma.doctor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { name: true, email: true, phone: true, avatar: true, isActive: true },
      },
      _count: {
        select: { appointments: true, medicalRecords: true },
      },
    },
  });
}

export default async function DoctorsPage() {
  const doctors = await getDoctors();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Doctors</h1>
          <p className="text-muted-foreground mt-1">
            Medical staff directory – {doctors.length} registered doctors
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <UserCog className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{doctors.length}</p>
              <p className="text-xs text-muted-foreground">Total Doctors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {doctors.filter((d) => d.isAvailable).length}
              </p>
              <p className="text-xs text-muted-foreground">Available Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">
                {[...new Set(doctors.map((d) => d.specialization))].length}
              </p>
              <p className="text-xs text-muted-foreground">Specializations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctors Grid */}
      {doctors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <UserCog className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No doctors registered</p>
            <p className="text-sm mt-1">
              Doctors are added through the Administration module
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(doctor.user.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold truncate">Dr. {doctor.user.name}</p>
                      <Badge
                        variant={doctor.isAvailable ? "success" : "gray"}
                        className="text-[10px] shrink-0"
                      >
                        {doctor.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {doctor.specialization}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {doctor.doctorId}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-foreground font-medium">Department:</span>
                    <span>{doctor.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-foreground font-medium">Experience:</span>
                    <span>{doctor.experience} years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-foreground font-medium">Fee:</span>
                    <span>₦{doctor.consultationFee.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{doctor._count.appointments} appointments</span>
                  <span>·</span>
                  <span>{doctor._count.medicalRecords} records</span>
                </div>

                {doctor.user.phone && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {doctor.user.phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{doctor.user.email}</span>
                </div>

                {doctor.availableDays.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {doctor.availableDays.slice(0, 4).map((day) => (
                      <Badge key={day} variant="outline" className="text-[10px] px-1.5 py-0">
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                    {doctor.availableDays.length > 4 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        +{doctor.availableDays.length - 4}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
