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
import { VoucherModalProps } from "./types";
import { useOwnerUsers } from "@/hooks/useOwner";

export function VoucherModal({
  open,
  onClose,
  onSave,
}: VoucherModalProps) {
  const { data: users = [], isLoading: usersLoading } = useOwnerUsers();
  const [formData, setFormData] = useState({
    userId: "",
    type: "deposit",
    amount: "",
    currency: "INR",
    method: "",
    reference: "",
    status: "completed", // Default to completed so balance is added immediately
    txnHash: "",
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        userId: "",
        type: "deposit",
        amount: "",
        currency: "INR",
        method: "",
        reference: "",
        status: "completed",
        txnHash: "",
      });
    }
  }, [open]);

  // Update currency when method changes
  React.useEffect(() => {
    if (formData.method === "crypto") {
      setFormData((prev) => ({ ...prev, currency: "USDT" }));
    } else if (formData.method === "bank") {
      setFormData((prev) => ({ ...prev, currency: "USD" }));
    } else if (formData.method === "admin_credits") {
      setFormData((prev) => ({ ...prev, currency: "INR" }));
    }
  }, [formData.method]);

  const validateForm = () => {
    if (!formData.userId) return "Please select a user";
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

    const voucherData: any = {
      userId: parseInt(formData.userId, 10),
      type: formData.type === "withdrawal" ? "withdraw" : formData.type, // Normalize type to match backend
      amount: formData.amount.toString(), // Backend expects string
    };

    // Only include optional fields if they have values
    if (formData.currency) voucherData.currency = formData.currency;
    if (formData.method) voucherData.method = formData.method;
    if (formData.reference) voucherData.reference = formData.reference;
    if (formData.txnHash) voucherData.txnHash = formData.txnHash;
    if (formData.status) voucherData.status = formData.status;

    onSave(voucherData);
    // Form will reset when modal closes (handled by useEffect)
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-h-[95vh] overflow-y-auto max-w-3xl w-[95vw] sm:w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-foreground text-xl font-semibold">
            Create New Voucher
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Add a new voucher for a user
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="user-select" className="text-foreground font-medium text-sm">
                  Select User <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.userId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, userId: value })
                  }
                  required
                  disabled={usersLoading}
                >
                  <SelectTrigger
                    id="user-select"
                    className="bg-input border text-foreground h-10 w-full"
                  >
                    <SelectValue placeholder={usersLoading ? "Loading users..." : "Select a user"} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border max-h-[300px]">
                    {users.map((user: any) => (
                      <SelectItem
                        key={user.id}
                        value={user.id.toString()}
                        className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black"
                      >
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-select" className="text-foreground font-medium text-sm">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                  required
                >
                  <SelectTrigger
                    id="type-select"
                    className="bg-input border text-foreground h-10 w-full"
                  >
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

              <div className="space-y-2">
                <Label htmlFor="amount-input" className="text-foreground font-medium text-sm">
                  Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="amount-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="bg-input border text-foreground h-10 w-full"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency-select" className="text-foreground font-medium text-sm">
                  Currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger
                    id="currency-select"
                    className="bg-input border text-foreground h-10 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    {formData.method === "crypto" ? (
                      <>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="BNB">BNB</SelectItem>
                        <SelectItem value="TRX">TRX</SelectItem>
                      </>
                    ) : formData.method === "admin_credits" ? (
                      <>
                        <SelectItem value="INR">INR</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="method-select" className="text-foreground font-medium text-sm">
                  Payment Method
                </Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) =>
                    setFormData({ ...formData, method: value })
                  }
                >
                  <SelectTrigger
                    id="method-select"
                    className="bg-input border text-foreground h-10 w-full"
                  >
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="admin_credits">Admin Credits</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.method === "bank" && (
                <div className="space-y-2">
                  <Label htmlFor="reference-input" className="text-foreground font-medium text-sm">
                    Reference
                  </Label>
                  <Input
                    id="reference-input"
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    className="bg-input border text-foreground h-10 w-full"
                    placeholder="Transaction reference"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status-select" className="text-foreground font-medium text-sm">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger
                    id="status-select"
                    className="bg-input border text-foreground h-10 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="pending">Pending (Balance not added)</SelectItem>
                    <SelectItem value="completed">Completed (Balance added immediately)</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                {formData.type === "deposit" || formData.type === "bonus" ? (
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {formData.status === "completed"
                      ? "Balance will be added to user account immediately"
                      : "Balance will be added when status is changed to completed"}
                  </p>
                ) : null}
              </div>

              {formData.method === "crypto" && (
                <div className="space-y-2">
                  <Label htmlFor="txn-hash-input" className="text-foreground font-medium text-sm">
                    Transaction Hash
                  </Label>
                  <Input
                    id="txn-hash-input"
                    value={formData.txnHash || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, txnHash: e.target.value })
                    }
                    className="bg-input border text-foreground h-10 w-full"
                    placeholder="Transaction hash"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-foreground h-10 w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full sm:w-auto order-1 sm:order-2"
          >
            Create Voucher
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
