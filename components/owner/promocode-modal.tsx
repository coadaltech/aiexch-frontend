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
import { Promocode, PromoCodeModalProps } from "./types";

export function PromoCodeModal({
  open,
  onClose,
  promocode,
  onSave,
}: PromoCodeModalProps) {
  const [formData, setFormData] = useState<Promocode>({
    code: "",
    type: "bonus",
    value: "",
    usageLimit: undefined,
    validFrom: "",
    validTo: "",
    status: "active",
  });

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  React.useEffect(() => {
    if (open) {
      if (promocode) {
        setFormData({
          ...promocode,
          validFrom: formatDateForInput(promocode.validFrom),
          validTo: formatDateForInput(promocode.validTo),
        });
      } else {
        setFormData({
          code: "",
          type: "bonus",
          value: "",
          usageLimit: undefined,
          validFrom: "",
          validTo: "",
          status: "active",
        });
      }
    }
  }, [open, promocode]);

  const validateForm = () => {
    if (!formData.code?.trim()) return "Code is required";
    if (!formData.type?.trim()) return "Type is required";
    if (!formData.value?.trim()) return "Value is required";
    return null;
  };

  const handleSave = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {promocode ? "Edit Promocode" : "Create New Promocode"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {promocode
              ? "Update promocode details"
              : "Create a new promotional code"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Code</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                className="bg-casino-darker border-casino-primary/30 text-foreground"
                placeholder="PROMO2024"
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
                <SelectTrigger className="bg-casino-darker border-casino-primary/30 text-foreground">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="bonus">Bonus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-muted-foreground">Value</Label>
              <Input
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                className="bg-casino-darker border-casino-primary/30 text-foreground"
                placeholder="50"
                required
              />
            </div>

            <div>
              <Label className="text-muted-foreground">Usage Limit</Label>
              <Input
                type="number"
                value={formData.usageLimit || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usageLimit: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
                className="bg-casino-darker border-casino-primary/30 text-foreground"
                placeholder="Leave empty for unlimited"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Valid From</Label>
              <Input
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) =>
                  setFormData({ ...formData, validFrom: e.target.value })
                }
                className="bg-casino-darker border-casino-primary/30 text-foreground [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            <div>
              <Label className="text-muted-foreground">Valid To</Label>
              <Input
                type="datetime-local"
                value={formData.validTo}
                onChange={(e) =>
                  setFormData({ ...formData, validTo: e.target.value })
                }
                className="bg-casino-darker border-casino-primary/30 text-foreground [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                required
              >
                <SelectTrigger className="bg-casino-darker border-casino-primary/30 text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} className="bg-primary text-black">
            {promocode ? "Update" : "Create"}
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-foreground">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
