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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoucherEditModalProps } from "./types";

export function VoucherEditModal({
  open,
  onClose,
  voucher,
  onSave,
}: VoucherEditModalProps) {
  const [formData, setFormData] = useState({
    status: "",
    remarks: "",
  });

  React.useEffect(() => {
    if (open && voucher) {
      setFormData({
        status: voucher.status || "",
        remarks: voucher.remarks || "",
      });
    }
  }, [open, voucher]);

  const handleSave = () => {
    onSave({ id: voucher.id, ...formData });
    onClose();
  };

  if (!voucher) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-h-[90vh] overflow-y-auto max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Edit Voucher
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update voucher details
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground">Remarks</Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
              className="bg-input border text-foreground w-full min-h-[80px]"
              placeholder="Optional remarks"
            />
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
