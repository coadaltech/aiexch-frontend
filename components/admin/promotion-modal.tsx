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
import { useCreatePromotion, useUpdatePromotion } from "@/hooks/useAdmin";
import { FileUpload } from "@/components/ui/file-upload";
import { Promotion, PromotionModalProps } from "./types";

export function PromotionModal({
  open,
  onClose,
  promotion,
  onSave,
}: PromotionModalProps) {
  const [formData, setFormData] = useState<Promotion>({
    title: "",
    description: "",
    type: "deposit",
    imageUrl: "",
    status: "active",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (promotion) {
      setFormData({
        ...promotion,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        type: "deposit",
        imageUrl: "",
        status: "active",
      });
    }
    setSelectedFile(null);
  }, [promotion, open]);

  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();

  const handleSave = async () => {
    const form = new FormData();

    form.append("title", formData.title);
    form.append("description", formData.description || "");
    form.append("type", formData.type);
    form.append("status", formData.status);

    if (selectedFile) {
      console.log("image send");
      form.append("imageUrl", selectedFile);
    }

    if (promotion?.id) {
      console.log("formdata", formData);
      updateMutation.mutate(
        { id: promotion.id, body: form },
        {
          onSuccess: () => {
            onSave();
            onClose();
          },
        }
      );
    } else {
      createMutation.mutate(form, {
        onSuccess: () => {
          onSave();
          onClose();
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border border-border bg-background text-foreground max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {promotion ? "Edit Promotion" : "Create New Promotion"}
          </DialogTitle>
        </DialogHeader>

        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 w-full">
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Welcome Bonus"
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit Bonus</SelectItem>
                  <SelectItem value="free_spins">Free Spins</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                  <SelectItem value="no_deposit">No Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Promotion Image</Label>
              <FileUpload
                onFileSelect={(file) => {
                  setSelectedFile(file);
                }}
                currentImageUrl={
                  typeof formData.imageUrl === "string"
                    ? formData.imageUrl
                    : undefined
                }
                accept="image/jpeg,image/jpg,image/png,image/webp"
                maxSize={5}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="bg-input"
              placeholder="Promotion description and terms..."
              rows={24}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSave}
            disabled={!formData.title || !formData.type}
            isLoading={isLoading}
          >
            {promotion ? "Update" : "Create"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
