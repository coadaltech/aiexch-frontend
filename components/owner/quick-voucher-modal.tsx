"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, DollarSign, Shield, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateVoucher, useUserLedger } from "@/hooks/useOwner";

type VoucherType = "deposit" | "withdraw" | "limit";

const TYPE_CONFIG: Record<
  VoucherType,
  { label: string; description: string; badgeColor: string; icon: React.ElementType }
> = {
  deposit: {
    label: "Deposit Voucher",
    description: "Adds funds to the user's cash balance.",
    badgeColor: "bg-blue-600",
    icon: DollarSign,
  },
  withdraw: {
    label: "Withdraw Voucher",
    description: "Deducts funds from the user's cash balance.",
    badgeColor: "bg-orange-600",
    icon: Wallet,
  },
  limit: {
    label: "Limit Voucher",
    description: "Adds to the user's credit limit.",
    badgeColor: "bg-indigo-600",
    icon: Shield,
  },
};

type QuickUser = {
  id: string;
  username: string;
  email?: string | null;
};

export function QuickVoucherModal({
  open,
  onClose,
  user,
  type,
}: {
  open: boolean;
  onClose: () => void;
  user: QuickUser | null;
  type: VoucherType;
}) {
  const config = TYPE_CONFIG[type];
  const createMutation = useCreateVoucher();
  const { data: userLedger, isLoading: ledgerLoading } = useUserLedger(
    type === "limit" && open && user?.id ? user.id : null,
  );

  const [formData, setFormData] = useState({
    amount: "",
    method: "",
    reference: "",
    remarks: "",
    status: "approved",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFormData({
        amount: "",
        method: "",
        reference: "",
        remarks: "",
        status: "approved",
      });
      setError(null);
    }
  }, [open]);

  const validateForm = () => {
    if (!user?.id) return "No user selected";
    if (!formData.amount?.trim()) return "Amount is required";
    if (parseFloat(formData.amount) <= 0) return "Amount must be greater than 0";
    return null;
  };

  const handleSave = () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const voucherData: any = {
      userId: user!.id,
      type,
      amount: formData.amount.toString(),
      status: formData.status,
    };
    if (formData.method)    voucherData.method    = formData.method;
    if (formData.reference) voucherData.reference = formData.reference;
    if (formData.remarks)   voucherData.remarks   = formData.remarks;

    createMutation.mutate(voucherData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border max-h-[95vh] overflow-y-auto max-w-2xl w-[95vw] sm:w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-foreground text-xl font-semibold flex items-center gap-2">
            Add {config.label}
            <Badge className={cn(config.badgeColor, "text-white capitalize text-xs")}>{type}</Badge>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            {config.description}
            {user && (
              <span className="block mt-1">
                For user: <span className="font-semibold text-foreground">{user.username}</span>
                {user.email && <span className="text-muted-foreground"> ({user.email})</span>}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {type === "limit" && user?.id && (
            <div className="flex gap-4 mb-4 p-2 rounded-md bg-muted/50 text-sm">
              {ledgerLoading ? (
                <span className="text-muted-foreground">Loading limits...</span>
              ) : userLedger ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Fix Limit: </span>
                    <span className="font-semibold text-foreground">
                      ₹{parseFloat(userLedger.fixLimit ?? "0").toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Final Limit: </span>
                    <span className="font-semibold text-foreground">
                      ₹{parseFloat(userLedger.finalLimit ?? "0").toFixed(2)}
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-foreground font-medium text-sm">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-input border text-foreground h-10 w-full"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium text-sm">Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => setFormData({ ...formData, method: value })}
              >
                <SelectTrigger className="bg-input border text-foreground h-10 w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="admin_credits">Admin Credits</SelectItem>
                  {type === "limit" && <SelectItem value="admin_deposit">Admin Deposit</SelectItem>}
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium text-sm">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-input border text-foreground h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-foreground font-medium text-sm">Reference</Label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="bg-input border text-foreground h-10 w-full"
                placeholder="Transaction reference or ID"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label className="text-foreground font-medium text-sm">Remarks</Label>
              <Textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="bg-input border text-foreground w-full min-h-[80px]"
                placeholder="Optional remarks"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={createMutation.isPending}
            className="text-foreground h-10 w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full sm:w-auto order-1 sm:order-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${config.label}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
