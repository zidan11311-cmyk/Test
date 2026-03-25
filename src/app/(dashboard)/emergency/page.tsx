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
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  AlertTriangle, Plus, RefreshCw, Clock, Activity
} from "lucide-react";
import { formatDateTime, timeAgo } from "@/lib/utils";

interface EmergencyCase {
  id: string;
  caseId: string;
  patientName?: string | null;
  patientAge?: number | null;
  priority: string;
  status: string;
  chiefComplaint: string;
  arrivalMode?: string | null;
  createdAt: string;
  patient?: { id: string; firstName: string; lastName: string; patientId: string } | null;
  assignedDoctor?: { id: string; user: { name: string } } | null;
}

const priorityColors: Record<string, string> = {
  P1_IMMEDIATE: "bg-red-600 text-white",
  P2_URGENT: "bg-orange-500 text-white",
  P3_LESS_URGENT: "bg-yellow-500 text-black",
  P4_NON_URGENT: "bg-green-500 text-white",
  P5_DECEASED: "bg-gray-600 text-white",
};

const priorityLabels: Record<string, string> = {
  P1_IMMEDIATE: "P1 Immediate",
  P2_URGENT: "P2 Urgent",
  P3_LESS_URGENT: "P3 Less Urgent",
  P4_NON_URGENT: "P4 Non-Urgent",
  P5_DECEASED: "P5 Deceased",
};

const statusVariant: Record<string, "success" | "gray" | "info" | "error" | "warning" | "orange"> = {
  WAITING: "warning",
  TRIAGE: "orange",
  TREATMENT: "info",
  OBSERVATION: "purple" as "info",
  ADMITTED: "success",
  DISCHARGED: "gray",
  TRANSFERRED: "info",
  DECEASED: "error",
};

export default function EmergencyPage() {
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCase, setShowNewCase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "",
    priority: "P2_URGENT",
    chiefComplaint: "",
    arrivalMode: "Walk-in",
    triageNotes: "",
  });

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/emergency?active=true&limit=50");
      const data = await res.json();
      if (data.success) setCases(data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load emergency cases", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCases, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chiefComplaint) {
      toast({ title: "Error", description: "Chief complaint is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: formData.patientName || undefined,
          patientAge: formData.patientAge ? parseInt(formData.patientAge) : undefined,
          patientGender: formData.patientGender || undefined,
          priority: formData.priority,
          chiefComplaint: formData.chiefComplaint,
          arrivalMode: formData.arrivalMode,
          triageNotes: formData.triageNotes || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create case");
      }

      toast({ title: "Emergency Case Created", description: "Case has been registered in the system" });
      setShowNewCase(false);
      setFormData({
        patientName: "",
        patientAge: "",
        patientGender: "",
        priority: "P2_URGENT",
        chiefComplaint: "",
        arrivalMode: "Walk-in",
        triageNotes: "",
      });
      fetchCases();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create case",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/emergency?action=update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast({ title: "Status Updated", description: `Case status updated to ${status}` });
      fetchCases();
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const activeCases = cases.filter(c =>
    ["WAITING", "TRIAGE", "TREATMENT", "OBSERVATION"].includes(c.status)
  );

  const priorityCounts = {
    P1: cases.filter(c => c.priority === "P1_IMMEDIATE").length,
    P2: cases.filter(c => c.priority === "P2_URGENT").length,
    P3: cases.filter(c => c.priority === "P3_LESS_URGENT").length,
    P4: cases.filter(c => c.priority === "P4_NON_URGENT").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            Emergency Room
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage emergency cases in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCases} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowNewCase(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            New Emergency
          </Button>
        </div>
      </div>

      {/* Priority Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "P1 Immediate", count: priorityCounts.P1, color: "border-red-500 bg-red-50 text-red-800" },
          { label: "P2 Urgent", count: priorityCounts.P2, color: "border-orange-500 bg-orange-50 text-orange-800" },
          { label: "P3 Less Urgent", count: priorityCounts.P3, color: "border-yellow-500 bg-yellow-50 text-yellow-800" },
          { label: "P4 Non-Urgent", count: priorityCounts.P4, color: "border-green-500 bg-green-50 text-green-800" },
        ].map((item) => (
          <Card key={item.label} className={`border-2 ${item.color.split(" ")[0]}`}>
            <CardContent className={`p-4 ${item.color.split(" ").slice(1).join(" ")}`}>
              <p className="text-3xl font-bold">{item.count}</p>
              <p className="text-xs font-medium mt-1">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Cases Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-red-500" />
            Active Emergency Cases ({activeCases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Case ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Arrival Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading emergency cases...
                  </TableCell>
                </TableRow>
              ) : activeCases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 opacity-30" />
                      <p>No active emergency cases</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                activeCases.map((em) => (
                  <TableRow key={em.id}>
                    <TableCell>
                      <span className={`rounded px-2 py-1 text-xs font-bold ${priorityColors[em.priority] || "bg-gray-100"}`}>
                        {em.priority.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{em.caseId}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">
                          {em.patient
                            ? `${em.patient.firstName} ${em.patient.lastName}`
                            : em.patientName || "Unidentified"}
                        </p>
                        {em.patientAge && (
                          <p className="text-xs text-muted-foreground">{em.patientAge} years</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {em.chiefComplaint}
                    </TableCell>
                    <TableCell className="text-xs">{em.arrivalMode || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[em.status] || "gray"} className="text-xs">
                        {em.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo(em.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={em.status}
                        onValueChange={(val) => handleStatusUpdate(em.id, val)}
                      >
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WAITING">Waiting</SelectItem>
                          <SelectItem value="TRIAGE">Triage</SelectItem>
                          <SelectItem value="TREATMENT">Treatment</SelectItem>
                          <SelectItem value="OBSERVATION">Observation</SelectItem>
                          <SelectItem value="ADMITTED">Admitted</SelectItem>
                          <SelectItem value="DISCHARGED">Discharged</SelectItem>
                          <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Emergency Case Dialog */}
      <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Register Emergency Case
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Patient Name</Label>
                <Input
                  placeholder="If known"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Age</Label>
                <Input
                  type="number"
                  placeholder="Estimated age"
                  value={formData.patientAge}
                  onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select
                  value={formData.patientGender}
                  onValueChange={(val) => setFormData({ ...formData, patientGender: val })}
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
              <div className="space-y-1.5">
                <Label>Arrival Mode</Label>
                <Select
                  value={formData.arrivalMode}
                  onValueChange={(val) => setFormData({ ...formData, arrivalMode: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                    <SelectItem value="Ambulance">Ambulance</SelectItem>
                    <SelectItem value="Police">Police</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P1_IMMEDIATE">P1 - Immediate (Life threatening)</SelectItem>
                  <SelectItem value="P2_URGENT">P2 - Urgent (Serious)</SelectItem>
                  <SelectItem value="P3_LESS_URGENT">P3 - Less Urgent (Moderate)</SelectItem>
                  <SelectItem value="P4_NON_URGENT">P4 - Non-Urgent (Minor)</SelectItem>
                  <SelectItem value="P5_DECEASED">P5 - Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Chief Complaint <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Main presenting complaint..."
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Triage Notes</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Initial assessment notes..."
                value={formData.triageNotes}
                onChange={(e) => setFormData({ ...formData, triageNotes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewCase(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-700"
                loading={isSubmitting}
              >
                Register Emergency
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
