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
import { ArrowLeft, Save } from "lucide-react";

export interface TransactionLimitModalUser {
  id: string;
  username: string;
  transactionLimit?: string | number;
}

interface TransactionLimitModalProps {
  open: boolean;
  onClose: () => void;
  user: TransactionLimitModalUser | null;
  onConfirm: (data: { transactionLimit: string }) => void;
  isLoading?: boolean;
}

export function TransactionLimitModal({
  open,
  onClose,
  user,
  onConfirm,
  isLoading = false,
}: TransactionLimitModalProps) {
  const [value, setValue] = useState("0");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && user) {
      setValue(user.transactionLimit != null ? String(user.transactionLimit) : "0");
      setError("");
    }
  }, [open, user]);

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (!Number.isFinite(num) || num < 0) {
      setError("Enter a valid amount (0 or greater)");
      return;
    }
    setError("");
    onConfirm({ transactionLimit: String(num) });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            Transaction Limit
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-5">
          <p className="text-primary font-medium">{user.username}</p>

          <div className="space-y-2">
            <Label htmlFor="tx-limit" className="text-sm font-medium text-foreground">
              Max stake per bet
            </Label>
            <Input
              id="tx-limit"
              type="number"
              min="0"
              step="1"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              className={error ? "border-destructive" : ""}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              0 means no per-bet cap. The user will only be limited by the market max.
            </p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="gap-2"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="gap-2 bg-primary text-primary-foreground"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
