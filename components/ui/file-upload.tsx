"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { useImagePreview } from "@/hooks/use-image-preview";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "./input";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  currentImageUrl?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = "image/*",
  maxSize = 5,
  currentImageUrl,
  disabled = false,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const preview = useImagePreview(selectedFile);

  const handleFile = useCallback(
    (file: File) => {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);
    },
    [maxSize, onFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) handleFile(files[0]);
    },
    [handleFile, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const files = e.target.files;
      if (files && files[0]) handleFile(files[0]);
    },
    [handleFile, disabled]
  );

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onFileSelect]);

  const openFileDialog = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Card
        className={cn(
          "relative border-2 border-dashed rounded-lg cursor-pointer transition-colors p-4 flex items-center justify-center",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-muted hover:border-primary",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={openFileDialog}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {preview || currentImageUrl ? (
          <div className="relative w-full h-48">
            <Image
              src={preview === null ? currentImageUrl : preview}
              alt="Preview"
              fill
              className="object-cover rounded"
              sizes="100vw"
            />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 p-1"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {dragActive ? (
              <Upload className="h-10 w-10" />
            ) : (
              <ImageIcon className="h-10 w-10" />
            )}
            <p className="text-sm text-center">
              Click to upload or drag and drop <br />
              PNG, JPG, WebP up to {maxSize}MB
            </p>
          </div>
        )}
      </Card>

      {selectedFile && (
        <p className="text-sm text-muted-foreground">
          Selected: {selectedFile.name} (
          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
    </div>
  );
}
