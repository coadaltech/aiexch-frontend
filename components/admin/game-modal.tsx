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
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { GameModalProps } from "./types";

const initialState = {
  name: "",
  image: "",
  link: "",
  popular: false,
  hot: false,
  order: "" as string | number,
  status: "active",
};

export function GameModal({
  open,
  onClose,
  game,
  onSave,
  isLoading,
}: GameModalProps) {
  const [formData, setFormData] = useState(initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || "",
        image: game.image || "",
        link: game.link || "",
        popular: game.popular || false,
        hot: game.hot || false,
        order: game.order ?? "",
        status: game.status || "active",
      });
    } else {
      setFormData({
        name: "",
        image: "",
        link: "",
        popular: false,
        hot: false,
        order: "",
        status: "active",
      });
    }
    setSelectedFile(null);
  }, [game, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = new FormData();
    form.append("name", formData.name);
    form.append("link", formData.link);
    form.append("popular", formData.popular ? "true" : "false");
    form.append("hot", formData.hot ? "true" : "false");
    form.append("order", String(formData.order || 0));
    form.append("status", formData.status);

    if (selectedFile) {
      form.append("image", selectedFile);
    } else if (formData.image) {
      form.append("image", formData.image);
    }

    if (game?.id) {
      onSave({ gameId: game.id, body: form });
    } else {
      onSave(form);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {game ? "Edit Game" : "Add Game"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Game Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-background border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Game Image</Label>
            <FileUpload
              onFileSelect={setSelectedFile}
              currentImageUrl={formData.image}
              accept="image/*"
              maxSize={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link" className="text-foreground">
              Game Link
            </Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
              className="bg-background border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order" className="text-foreground">
              Order
            </Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: e.target.value,
                })
              }
              onFocus={(e) => e.target.select()}
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="popular"
              checked={formData.popular}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, popular: checked })
              }
            />
            <Label htmlFor="popular" className="text-foreground">
              Popular
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="hot"
              checked={formData.hot}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, hot: checked })
              }
            />
            <Label htmlFor="hot" className="text-foreground">
              Hot
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              {game ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
