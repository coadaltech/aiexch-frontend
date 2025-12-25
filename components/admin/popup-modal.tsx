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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { useCreatePopup, useUpdatePopup } from "@/hooks/useAdmin";
import { uploadFile } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { Popup, PopupModalProps } from "./types";

export function PopupModal({ open, onClose, popup, onSave }: PopupModalProps) {
  const [formData, setFormData] = useState<Popup>({
    title: "",
    imageUrl: "",
    targetPage: "",
    status: "active",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (popup) {
      setFormData({
        title: popup.title || "",
        imageUrl: popup.imageUrl || "",
        targetPage: popup.targetPage || "",
        status: popup.status || "active",
      });
    } else {
      setFormData({
        title: "",
        imageUrl: "",
        targetPage: "",
        status: "active",
      });
    }
    setSelectedFile(null);
  }, [popup, open]);

  const createMutation = useCreatePopup();
  const updateMutation = useUpdatePopup();

  const handleSave = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("targetPage", formData.targetPage);
    formDataToSend.append("status", formData.status);

    if (selectedFile) {
      formDataToSend.append("image", selectedFile);
    } else if (popup?.imageUrl) {
      formDataToSend.append("image", formData.imageUrl);
    }

    if (popup?.id) {
      updateMutation.mutate({ id: popup.id, formData: formDataToSend }, {
        onSuccess: () => {
          onSave();
          onClose();
        },
      });
    } else {
      createMutation.mutate(formDataToSend, {
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
      <DialogContent className="bg-card border max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {popup ? "Edit Popup" : "Create New Popup"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Title</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="bg-casino-darker border-casino-primary/30 text-foreground"
              placeholder="Welcome Bonus"
            />
          </div>

          <div>
            <Label className="text-muted-foreground">Target Page</Label>
            <Select
              value={formData.targetPage}
              onValueChange={(value) =>
                setFormData({ ...formData, targetPage: value })
              }
            >
              <SelectTrigger className="bg-casino-darker border-casino-primary/30 text-foreground">
                <SelectValue placeholder="Select page" />
              </SelectTrigger>
              <SelectContent className="bg-white border text-black">
                <SelectItem value="home" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Home</SelectItem>
                <SelectItem value="casino" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Casino</SelectItem>
                <SelectItem value="sports" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Sports</SelectItem>
                <SelectItem value="live-casino" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Live Casino</SelectItem>
                <SelectItem value="promotions" className="hover:bg-gray-100 hover:text-black focus:bg-gray-100 focus:text-black">Promotions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-muted-foreground">Popup Image</Label>
            <FileUpload
              onFileSelect={setSelectedFile}
              currentImageUrl={formData.imageUrl}
              accept="image/*"
              maxSize={5}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.status === "active"}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  status: checked ? "active" : "paused",
                })
              }
            />
            <Label className="text-muted-foreground">Active</Label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSave}
            disabled={
              !formData.title ||
              !formData.targetPage ||
              (!popup && !selectedFile)
            }
            isLoading={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {popup ? "Update" : "Create"}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-foreground hover:bg-accent hover:text-accent-foreground"
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
