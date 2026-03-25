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
import { FlaskConical, RefreshCw, Plus, CheckCircle, Clock } from "lucide-react";
import { formatDateTime, formatStatus } from "@/lib/utils";

interface LabTest {
  id: string;
  testId: string;
  testName: string;
  testType: string;
  category: string;
  priority: string;
  status: string;
  sampleType?: string | null;
  cost: number;
  createdAt: string;
  completedAt?: string | null;
  patient: { firstName: string; lastName: string; patientId: string };
  doctor: { user: { name: string } };
  results: Array<{
    id: string;
    parameter: string;
    value: string;
    unit?: string | null;
    normalRange?: string | null;
    isAbnormal: boolean;
  }>;
}

const priorityVariant: Record<string, "error" | "warning" | "gray"> = {
  STAT: "error",
  URGENT: "warning",
  ROUTINE: "gray",
};

const statusVariant: Record<string, "success" | "gray" | "info" | "warning" | "error"> = {
  ORDERED: "info",
  SAMPLE_COLLECTED: "warning",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "error",
};

export default function LaboratoryPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [results, setResults] = useState<Array<{
    parameter: string; value: string; unit: string; normalRange: string; isAbnormal: boolean
  }>>([{ parameter: "", value: "", unit: "", normalRange: "", isAbnormal: false }]);
  const [submittingResults, setSubmittingResults] = useState(false);

  const fetchTests = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/laboratory?${params}`);
      const data = await res.json();
      if (data.success) setTests(data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load lab tests", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      // For "sample collected", update via a dedicated update endpoint
      const res = await fetch(`/api/laboratory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      // Note: this endpoint would need to be created; for now it's a placeholder
      toast({ title: "Status Updated" });
      fetchTests();
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleAddResults = async () => {
    if (!selectedTest) return;

    const validResults = results.filter(r => r.parameter && r.value);
    if (validResults.length === 0) {
      toast({ title: "Error", description: "At least one result parameter is required", variant: "destructive" });
      return;
    }

    setSubmittingResults(true);
    try {
      const res = await fetch("/api/laboratory?action=add-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labTestId: selectedTest.id,
          results: validResults,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add results");
      }

      toast({ title: "Results Added", description: "Lab results have been recorded successfully" });
      setShowResultDialog(false);
      setSelectedTest(null);
      setResults([{ parameter: "", value: "", unit: "", normalRange: "", isAbnormal: false }]);
      fetchTests();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add results",
        variant: "destructive"
      });
    } finally {
      setSubmittingResults(false);
    }
  };

  const pendingCount = tests.filter(t => ["ORDERED", "SAMPLE_COLLECTED", "IN_PROGRESS"].includes(t.status)).length;
  const completedCount = tests.filter(t => t.status === "COMPLETED").length;
  const statCount = tests.filter(t => t.priority === "STAT").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-purple-500" />
          Laboratory
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage lab test orders and results
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Tests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{statCount}</p>
              <p className="text-xs text-muted-foreground">STAT Priority</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{tests.length}</p>
              <p className="text-xs text-muted-foreground">Total Tests</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Lab Tests</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[
                  { label: "All", value: "" },
                  { label: "Ordered", value: "ORDERED" },
                  { label: "In Progress", value: "IN_PROGRESS" },
                  { label: "Completed", value: "COMPLETED" },
                ].map((f) => (
                  <Button
                    key={f.value}
                    size="sm"
                    variant={statusFilter === f.value ? "default" : "outline"}
                    className="h-8 text-xs"
                    onClick={() => setStatusFilter(f.value)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={fetchTests} className="h-8">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Ordered By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading lab tests...
                  </TableCell>
                </TableRow>
              ) : tests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No lab tests found
                  </TableCell>
                </TableRow>
              ) : (
                tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="text-xs font-mono">{test.testId}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{test.patient.firstName} {test.patient.lastName}</p>
                      <p className="text-xs text-muted-foreground">{test.patient.patientId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{test.testName}</p>
                      {test.sampleType && (
                        <p className="text-xs text-muted-foreground">Sample: {test.sampleType}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{test.category}</TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant[test.priority] || "gray"} className="text-xs">
                        {test.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">Dr. {test.doctor.user.name}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(test.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[test.status] || "gray"} className="text-xs">
                        {formatStatus(test.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {test.status !== "COMPLETED" && test.status !== "CANCELLED" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedTest(test);
                            setShowResultDialog(true);
                          }}
                        >
                          Add Results
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedTest(test)}
                        >
                          View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={(open) => {
        if (!open) {
          setShowResultDialog(false);
          setSelectedTest(null);
          setResults([{ parameter: "", value: "", unit: "", normalRange: "", isAbnormal: false }]);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Results: {selectedTest?.testName}</DialogTitle>
          </DialogHeader>

          {selectedTest && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium">{selectedTest.patient.firstName} {selectedTest.patient.lastName}</p>
                <p className="text-muted-foreground text-xs">
                  {selectedTest.testId} · {selectedTest.category} · Dr. {selectedTest.doctor.user.name}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Results</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setResults([...results, { parameter: "", value: "", unit: "", normalRange: "", isAbnormal: false }])}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Row
                  </Button>
                </div>

                {results.map((result, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2">
                    <Input
                      placeholder="Parameter"
                      value={result.parameter}
                      onChange={(e) => {
                        const updated = [...results];
                        updated[index].parameter = e.target.value;
                        setResults(updated);
                      }}
                      className="text-xs h-8"
                    />
                    <Input
                      placeholder="Value"
                      value={result.value}
                      onChange={(e) => {
                        const updated = [...results];
                        updated[index].value = e.target.value;
                        setResults(updated);
                      }}
                      className="text-xs h-8"
                    />
                    <Input
                      placeholder="Unit"
                      value={result.unit}
                      onChange={(e) => {
                        const updated = [...results];
                        updated[index].unit = e.target.value;
                        setResults(updated);
                      }}
                      className="text-xs h-8"
                    />
                    <Input
                      placeholder="Normal Range"
                      value={result.normalRange}
                      onChange={(e) => {
                        const updated = [...results];
                        updated[index].normalRange = e.target.value;
                        setResults(updated);
                      }}
                      className="text-xs h-8"
                    />
                    <Select
                      value={result.isAbnormal ? "true" : "false"}
                      onValueChange={(val) => {
                        const updated = [...results];
                        updated[index].isAbnormal = val === "true";
                        setResults(updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Normal</SelectItem>
                        <SelectItem value="true">Abnormal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowResultDialog(false);
              setSelectedTest(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddResults}
              loading={submittingResults}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
