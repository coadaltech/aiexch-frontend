import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Whitelabel } from "../types";

interface ConfigTabProps {
  formData: Whitelabel;
  setFormData: (data: Whitelabel) => void;
}

export function ConfigTab({ formData, setFormData }: ConfigTabProps) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    if (!value.trim()) {
      newErrors[field] = "This field is required";
    } else {
      delete newErrors[field];
    }
    setErrors(newErrors);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <Label className="text-muted-foreground">Database Name *</Label>
        <Input
          value={formData.config?.dbName}
          onChange={(e) => {
            setFormData({ ...formData, config: { ...formData.config!, dbName: e.target.value } });
            validateField("dbName", e.target.value);
          }}
          placeholder="casino_db_001"
          className={`bg-input border text-foreground ${errors.dbName ? "border-red-500" : ""}`}
        />
        {errors.dbName && <p className="text-xs text-red-500 mt-1">{errors.dbName}</p>}
      </div>

      <div>
        <Label className="text-muted-foreground">AWS S3 Folder Name *</Label>
        <Input
          value={formData.config?.s3FolderName}
          onChange={(e) => {
            setFormData({ ...formData, config: { ...formData.config!, s3FolderName: e.target.value } });
            validateField("s3FolderName", e.target.value);
          }}
          placeholder="casino-assets/client-001"
          className={`bg-input border text-foreground ${errors.s3FolderName ? "border-red-500" : ""}`}
        />
        {errors.s3FolderName && <p className="text-xs text-red-500 mt-1">{errors.s3FolderName}</p>}
      </div>
    </div>
  );
}
