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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionEditModalProps } from "./types";

export function TransactionEditModal({
  open,
  onClose,
  transaction,
  onSave,
}: TransactionEditModalProps) {
  const [formData, setFormData] = useState({
    status: "",
    method: "",
    reference: "",
    txnHash: "",
  });

  React.useEffect(() => {
    if (open && transaction) {
      setFormData({
        status: transaction.status || "",
        method: transaction.method || "",
        reference: transaction.reference || "",
        txnHash: transaction.txnHash || "",
      });
    }
  }, [open, transaction]);

  const handleSave = () => {
    onSave({ id: transaction.id, ...formData });
    onClose();
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-h-[90vh] overflow-y-auto max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Edit Transaction
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update transaction details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="bg-casino-darker border-casino-primary/30 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border">
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSave}
            className="bg-primary text-primary-foreground"
          >
            Update
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-foreground">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
