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
import { DollarSign, Plus, RefreshCw, CreditCard, CheckCircle } from "lucide-react";
import { formatDate, formatCurrency, formatStatus } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceId: string;
  status: string;
  total: number;
  amountPaid: number;
  balance: number;
  createdAt: string;
  dueDate?: string | null;
  patient: { id: string; patientId: string; firstName: string; lastName: string; phone: string };
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
    method: string;
    createdAt: string;
  }>;
}

const statusVariant: Record<string, "success" | "gray" | "warning" | "error" | "orange" | "info"> = {
  DRAFT: "gray",
  PENDING: "warning",
  PARTIALLY_PAID: "orange",
  PAID: "success",
  OVERDUE: "error",
  CANCELLED: "gray",
  REFUNDED: "info",
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    method: "CASH",
    reference: "",
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/billing?${params}`);
      const data = await res.json();
      if (data.success) setInvoices(data.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load invoices", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handlePayment = async () => {
    if (!selectedInvoice || !paymentData.amount) {
      toast({ title: "Error", description: "Please enter payment amount", variant: "destructive" });
      return;
    }

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Invalid payment amount", variant: "destructive" });
      return;
    }

    if (amount > selectedInvoice.balance) {
      toast({ title: "Error", description: "Payment exceeds outstanding balance", variant: "destructive" });
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/billing?action=payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount,
          method: paymentData.method,
          reference: paymentData.reference || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment failed");
      }

      toast({ title: "Payment Recorded", description: `Payment of ${formatCurrency(amount)} has been recorded` });
      setShowPaymentDialog(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: "", method: "CASH", reference: "" });
      fetchInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Payment failed",
        variant: "destructive"
      });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const pendingAmount = invoices
    .filter(i => ["PENDING", "PARTIALLY_PAID", "OVERDUE"].includes(i.status))
    .reduce((sum, inv) => sum + inv.balance, 0);
  const paidCount = invoices.filter(i => i.status === "PAID").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-emerald-500" />
          Billing & Invoicing
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage patient invoices and payments
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Total Collected</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-xl font-bold">{formatCurrency(pendingAmount)}</p>
              <p className="text-xs text-muted-foreground">Outstanding Balance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{paidCount}</p>
              <p className="text-xs text-muted-foreground">Paid Invoices</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{invoices.length}</p>
              <p className="text-xs text-muted-foreground">Total Invoices</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Invoices</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[
                  { label: "All", value: "" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Partial", value: "PARTIALLY_PAID" },
                  { label: "Paid", value: "PAID" },
                  { label: "Overdue", value: "OVERDUE" },
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
              <Button variant="outline" size="sm" onClick={fetchInvoices} className="h-8">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-xs font-mono">{inv.invoiceId}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{inv.patient.firstName} {inv.patient.lastName}</p>
                      <p className="text-xs text-muted-foreground">{inv.patient.patientId}</p>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(inv.total)}</TableCell>
                    <TableCell className="text-sm text-green-600">{formatCurrency(inv.amountPaid)}</TableCell>
                    <TableCell className="text-sm font-bold">
                      {formatCurrency(inv.balance)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[inv.status] || "gray"} className="text-xs">
                        {formatStatus(inv.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {["PENDING", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentData({ ...paymentData, amount: inv.balance.toString() });
                            setShowPaymentDialog(true);
                          }}
                        >
                          Record Payment
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedInvoice(inv)}
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

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        if (!open) {
          setShowPaymentDialog(false);
          setSelectedInvoice(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium">{selectedInvoice.patient.firstName} {selectedInvoice.patient.lastName}</p>
                <p className="text-muted-foreground text-xs">{selectedInvoice.invoiceId}</p>
                <div className="flex justify-between mt-2 text-xs">
                  <span>Total: <strong>{formatCurrency(selectedInvoice.total)}</strong></span>
                  <span>Paid: <strong className="text-green-600">{formatCurrency(selectedInvoice.amountPaid)}</strong></span>
                  <span>Balance: <strong className="text-red-600">{formatCurrency(selectedInvoice.balance)}</strong></span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Payment Amount (₦)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    max={selectedInvoice.balance}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentData.method}
                    onValueChange={(val) => setPaymentData({ ...paymentData, method: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                      <SelectItem value="MOBILE_PAYMENT">Mobile Payment</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Reference Number (optional)</Label>
                  <Input
                    placeholder="Transaction/receipt reference"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              loading={submittingPayment}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
