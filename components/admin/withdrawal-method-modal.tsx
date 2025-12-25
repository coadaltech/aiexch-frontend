"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  useCreateWithdrawalMethod,
  useUpdateWithdrawalMethod,
} from "@/hooks/useAdmin";
import { WithdrawalMethodModalProps } from "./types";

export function WithdrawalMethodModal({
  open,
  onClose,
  method,
}: WithdrawalMethodModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "crypto",
    currency: "INR",
    minAmount: "100",
    maxAmount: "100000",
    processingTime: "1-3 business days",
    feePercentage: "0",
    feeFixed: "0",
    instructions: "",
    status: "active",
  });

  const createMutation = useCreateWithdrawalMethod();
  const updateMutation = useUpdateWithdrawalMethod();

  useEffect(() => {
    if (method) {
      setFormData({
        name: method.name || "",
        type: method.type || "crypto",
        currency: method.currency || "INR",
        minAmount: method.minAmount || "100",
        maxAmount: method.maxAmount || "100000",
        processingTime: method.processingTime || "1-3 business days",
        feePercentage: method.feePercentage || "0",
        feeFixed: method.feeFixed || "0",
        instructions: method.instructions || "",
        status: method.status || "active",
      });
    } else {
      setFormData({
        name: "",
        type: "crypto",
        currency: "INR",
        minAmount: "100",
        maxAmount: "100000",
        processingTime: "1-3 business days",
        feePercentage: "0",
        feeFixed: "0",
        instructions: "",
        status: "active",
      });
    }
  }, [method, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (method) {
        await updateMutation.mutateAsync({ id: method.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {method ? "Edit Withdrawal Method" : "Add Withdrawal Method"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Method Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="bg-casino-darker border-casino-primary/30 mt-2"
              placeholder="e.g., Bitcoin, Bank Transfer"
              required
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="bg-casino-darker border-casino-primary/30 mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border">
                {/* <SelectItem value="crypto">Cryptocurrency</SelectItem> */}
                <SelectItem value="bank">Bank Transfer</SelectItem>
                {/* <SelectItem value="ewallet">E-Wallet</SelectItem> */}
                {/* <SelectItem value="card">Card</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, currency: value }))
              }
            >
              <SelectTrigger className="bg-casino-darker border-casino-primary/30 mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border">
                <SelectItem value="INR">INR</SelectItem>
                {/* <SelectItem value="USD">USD</SelectItem> */}
                {/* <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Min Amount</Label>
              <Input
                value={formData.minAmount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minAmount: e.target.value,
                  }))
                }
                className="bg-casino-darker border-casino-primary/30 mt-2"
                placeholder="100"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Max Amount</Label>
              <Input
                value={formData.maxAmount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxAmount: e.target.value,
                  }))
                }
                className="bg-casino-darker border-casino-primary/30 mt-2"
                placeholder="100000"
              />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Processing Time</Label>
            <Input
              value={formData.processingTime}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  processingTime: e.target.value,
                }))
              }
              className="bg-casino-darker border-casino-primary/30 mt-2"
              placeholder="1-3 business days"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Fee %</Label>
              <Input
                value={formData.feePercentage}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    feePercentage: e.target.value,
                  }))
                }
                className="bg-casino-darker border-casino-primary/30 mt-2"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Fixed Fee</Label>
              <Input
                value={formData.feeFixed}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, feeFixed: e.target.value }))
                }
                className="bg-casino-darker border-casino-primary/30 mt-2"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Instructions</Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  instructions: e.target.value,
                }))
              }
              className="bg-casino-darker border-casino-primary/30 mt-2"
              placeholder="Instructions for users"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="bg-casino-darker border-casino-primary/30 mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-casino-primary/30 text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {method ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
