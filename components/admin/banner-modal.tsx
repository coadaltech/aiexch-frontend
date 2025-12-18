"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateBanner, useUpdateBanner } from "@/hooks/useAdmin";
import { uploadFile } from "@/lib/api";
import { FileUpload } from "@/components/ui/file-upload";

interface Banner {
  id?: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position?: string;
  order?: number;
  status: string;
}

interface BannerModalProps {
  open: boolean;
  onClose: () => void;
  banner?: Banner;
  onSave: () => void;
}

export function BannerModal({
  open,
  onClose,
  banner,
  onSave,
}: BannerModalProps) {
  const [formData, setFormData] = useState<Banner>({
    title: "",
    imageUrl: "",
    linkUrl: "/",
    position: "home",
    order: 1,
    status: "active",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl || "",
        position: banner.position || "home",
        order: banner.order || 1,
        status: banner.status,
      });
    } else {
      setFormData({
        title: "",
        imageUrl: "",
        linkUrl: "",
        position: "home",
        order: 1,
        status: "active",
      });
    }
  }, [banner, open]);

  const createMutation = useCreateBanner();
  const updateMutation = useUpdateBanner();

  // Override success handlers to close modal
  const handleSuccess = () => {
    onSave();
    onClose();
  };

  const handleSave = async () => {
    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("linkUrl", formData.linkUrl || "");
    formDataToSend.append("position", formData.position || "home");
    formDataToSend.append("order", formData.order?.toString() || "1");
    formDataToSend.append("status", formData.status);

    if (selectedFile) {
      formDataToSend.append("image", selectedFile);
    } else if (banner?.imageUrl) {
      formDataToSend.append("image", formData.imageUrl);
    }

    if (banner?.id) {
      updateMutation.mutate(
        { id: banner.id, formData: formDataToSend },
        { onSuccess: handleSuccess }
      );
    } else {
      createMutation.mutate(formDataToSend, { onSuccess: handleSuccess });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {banner ? "Edit Banner" : "Create New Banner"}
          </DialogTitle>
          <DialogDescription>
            {banner
              ? "Update banner details and settings"
              : "Create a new banner for your site"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }

                placeholder="Welcome Casino"
              />
            </div>

            <div>
              <Label>Position</Label>
              <Select
                value={formData.position}
                onValueChange={(value) =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="casino">Casino</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="live-casino">Live Casino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Banner Image</Label>
            <FileUpload
              onFileSelect={setSelectedFile}
              currentImageUrl={formData.imageUrl}
              accept="image/*"
              maxSize={5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Link URL</Label>
              <Input
                value={formData.linkUrl}
                onChange={(e) =>
                  setFormData({ ...formData, linkUrl: e.target.value })
                }
                placeholder="/casino"
              />
            </div>

            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) })
                }
                placeholder="1"
              />
            </div>
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
            <Label>Active</Label>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleSave}
            disabled={
              !formData.title ||
              (!banner && !selectedFile)
            }
            isLoading={isLoading}
          >
            {banner ? "Update" : "Create"}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
