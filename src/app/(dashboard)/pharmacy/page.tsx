"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Pill, RefreshCw, Search, CheckCircle, Package } from "lucide-react";
import { formatDate, formatStatus } from "@/lib/utils";

interface Prescription {
  id: string;
  prescriptionId: string;
  status: string;
  createdAt: string;
  notes?: string | null;
  patient: { firstName: string; lastName: string; patientId: string };
  doctor: { user: { name: string }; specialization: string };
  items: Array<{
    id: string;
    dosage: string;
    frequency: string;
    route: string;
    duration: string;
    quantity: number;
    dispensedQty: number;
    instructions?: string | null;
    medication: { id: string; name: string; genericName?: string | null; strength?: string | null; unit: string };
  }>;
}

const statusVariant: Record<string, "success" | "gray" | "warning" | "error" | "orange"> = {
  PENDING: "warning",
  DISPENSED: "success",
  PARTIALLY_DISPENSED: "orange",
  CANCELLED: "error",
};

export default function PharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [dispensing, setDispensing] = useState(false);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ type: "prescriptions", limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/pharmacy?${params}`);
      const data = await res.json();
      if (data.success) setPrescriptions(data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load prescriptions", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [search, statusFilter]);

  const handleDispense = async (prescription: Prescription) => {
    setDispensing(true);
    try {
      const items = prescription.items.map((item) => ({
        prescriptionItemId: item.id,
        dispensedQty: item.quantity,
      }));

      const res = await fetch("/api/pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId: prescription.id, items }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to dispense");
      }

      toast({ title: "Prescription Dispensed", description: `${prescription.prescriptionId} has been dispensed successfully` });
      setSelectedPrescription(null);
      fetchPrescriptions();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to dispense",
        variant: "destructive"
      });
    } finally {
      setDispensing(false);
    }
  };

  const pendingCount = prescriptions.filter(p => p.status === "PENDING").length;
  const dispensedCount = prescriptions.filter(p => p.status === "DISPENSED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Pill className="h-6 w-6 text-orange-500" />
          Pharmacy
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage prescriptions and medication dispensing
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Prescriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{dispensedCount}</p>
              <p className="text-xs text-muted-foreground">Dispensed Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Pill className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{prescriptions.length}</p>
              <p className="text-xs text-muted-foreground">Total Prescriptions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Prescriptions</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="w-48 h-8 text-sm"
              />
              <div className="flex gap-1">
                {["", "PENDING", "DISPENSED", "PARTIALLY_DISPENSED"].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s || "All"}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={fetchPrescriptions} className="h-8">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Prescribed By</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading prescriptions...
                  </TableCell>
                </TableRow>
              ) : prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No prescriptions found
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((rx) => (
                  <TableRow key={rx.id}>
                    <TableCell className="text-xs font-mono">{rx.prescriptionId}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{rx.patient.firstName} {rx.patient.lastName}</p>
                      <p className="text-xs text-muted-foreground">{rx.patient.patientId}</p>
                    </TableCell>
                    <TableCell className="text-sm">Dr. {rx.doctor.user.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {rx.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="text-xs">
                            <span className="font-medium">{item.medication.name}</span>
                            {item.medication.strength && (
                              <span className="text-muted-foreground"> {item.medication.strength}</span>
                            )}
                          </div>
                        ))}
                        {rx.items.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{rx.items.length - 2} more</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(rx.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[rx.status] || "gray"} className="text-xs">
                        {formatStatus(rx.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedPrescription(rx)}
                        disabled={rx.status === "DISPENSED" || rx.status === "CANCELLED"}
                      >
                        {rx.status === "PENDING" ? "Dispense" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dispense Dialog */}
      {selectedPrescription && (
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Prescription: {selectedPrescription.prescriptionId}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium">
                  {selectedPrescription.patient.firstName} {selectedPrescription.patient.lastName}
                </p>
                <p className="text-muted-foreground text-xs">
                  Prescribed by Dr. {selectedPrescription.doctor.user.name} ·{" "}
                  {formatDate(selectedPrescription.createdAt)}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Medications:</p>
                {selectedPrescription.items.map((item) => (
                  <div key={item.id} className="rounded-md border p-3 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.medication.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Qty: {item.quantity} {item.medication.unit}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.dosage} · {item.frequency} · {item.duration}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Route: {item.route.toLowerCase()}
                    </p>
                    {item.instructions && (
                      <p className="text-xs text-muted-foreground">
                        Instructions: {item.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPrescription(null)}>
                Cancel
              </Button>
              {selectedPrescription.status === "PENDING" && (
                <Button
                  onClick={() => handleDispense(selectedPrescription)}
                  loading={dispensing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Dispense All
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
