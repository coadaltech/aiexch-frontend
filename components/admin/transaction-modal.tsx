"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { TransactionModalProps } from "./types";

export function TransactionModal({
  open,
  onClose,
  onSave,
}: TransactionModalProps) {
  const [formData, setFormData] = useState({
    userId: "",
    type: "deposit",
    amount: "",
    currency: "USD",
    method: "",
    reference: "",
    status: "pending",
    txnHash: "",
  });

  // Update currency when method changes
  React.useEffect(() => {
    if (formData.method === "crypto") {
      setFormData((prev) => ({ ...prev, currency: "USDT" }));
    } else if (formData.method === "bank") {
      setFormData((prev) => ({ ...prev, currency: "USD" }));
    }
  }, [formData.method]);

  const validateForm = () => {
    if (!formData.userId?.trim()) return "User ID is required";
    if (!formData.amount?.trim()) return "Amount is required";
    if (parseFloat(formData.amount) <= 0)
      return "Amount must be greater than 0";
    return null;
  };

  const handleSave = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    onSave({
      ...formData,
      userId: parseInt(formData.userId, 10),
      amount: parseFloat(formData.amount),
    });

    // Reset form
    setFormData({
      userId: "",
      type: "deposit",
      amount: "",
      currency: "USD",
      method: "",
      reference: "",
      status: "pending",
      txnHash: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Create New Transaction
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new transaction for a user
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">User ID</Label>
              <Input
                type="number"
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                className="bg-input border text-foreground"
                placeholder="Enter user ID"
                required
              />
            </div>

            <div>
              <Label className="text-muted-foreground">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                required
              >
                <SelectTrigger className="bg-input border text-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground">Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="bg-input border text-foreground"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label className="text-muted-foreground">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger className="bg-input border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  {formData.method === "crypto" ? (
                    <>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="BNB">BNB</SelectItem>
                      <SelectItem value="TRX">TRX</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) =>
                  setFormData({ ...formData, method: value })
                }
              >
                <SelectTrigger className="bg-input border text-foreground">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.method === "bank" && (
              <div>
                <Label className="text-muted-foreground">Reference</Label>
                <Input
                  value={formData.reference}
                  onChange={(e) =>
                    setFormData({ ...formData, reference: e.target.value })
                  }
                  className="bg-input border text-foreground"
                  placeholder="Transaction reference"
                />
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-input border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.method === "crypto" && (
              <div>
                <Label className="text-muted-foreground">
                  Transaction Hash
                </Label>
                <Input
                  value={formData.txnHash || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, txnHash: e.target.value })
                  }
                  className="bg-input border text-foreground"
                  placeholder="Transaction hash"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground"
          >
            Create Transaction
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-foreground">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}