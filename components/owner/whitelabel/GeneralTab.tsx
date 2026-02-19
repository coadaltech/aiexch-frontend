import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/ui/file-upload";
import { Whitelabel } from "../types";

interface GeneralTabProps {
  formData: Whitelabel;
  setFormData: (data: Whitelabel) => void;
}

export function GeneralTab({ formData, setFormData }: GeneralTabProps) {
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Casino Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              validateField("name", e.target.value);
            }}
            placeholder="Royal Casino"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <Label className="text-muted-foreground">Domain *</Label>
          <Input
            value={formData.domain}
            onChange={(e) => {
              setFormData({ ...formData, domain: e.target.value });
              validateField("domain", e.target.value);
            }}
            placeholder="royal.casino.com"
            className={errors.domain ? "border-red-500" : ""}
          />
          {errors.domain && (
            <p className="text-xs text-red-500">{errors.domain}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Title</Label>
          <Input
            value={formData.title || ""}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Best Online Casino"
          />
        </div>
        <div>
          <Label className="text-muted-foreground">Description</Label>
          <Input
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Play and win big at our casino"
          />
        </div>
      </div>
      <div>
        <Label className="text-muted-foreground">Contact Email *</Label>
        <Input
          value={formData.contactEmail}
          onChange={(e) => {
            setFormData({ ...formData, contactEmail: e.target.value });
            validateField("contactEmail", e.target.value);
          }}
          placeholder="contact@casino.com"
          type="email"
          className={errors.contactEmail ? "border-red-500" : ""}
        />
        {errors.contactEmail && (
          <p className="text-xs text-red-500">{errors.contactEmail}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground mb-2 block">Logo</Label>
          <FileUpload
            onFileSelect={(file) => {
              setFormData({ ...formData, logo: file as any });
            }}
            currentImageUrl={
              typeof formData.logo === "string" ? formData.logo : undefined
            }
            maxSize={2}
          />
        </div>
        <div>
          <Label className="text-muted-foreground mb-2 block">Favicon</Label>
          <FileUpload
            onFileSelect={(file) => {
              setFormData({ ...formData, favicon: file as any });
            }}
            currentImageUrl={
              typeof formData.favicon === "string"
                ? formData.favicon
                : undefined
            }
            maxSize={1}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.status === "active"}
          onCheckedChange={(checked) =>
            setFormData({
              ...formData,
              status: checked ? "active" : "inactive",
            })
          }
        />
        <Label className="text-muted-foreground">Active</Label>
      </div>
      
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold text-foreground">Social Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Facebook</Label>
            <Input
              value={formData.socialLinks?.facebook || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value },
                })
              }
              placeholder="https://facebook.com/yourpage"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Twitter</Label>
            <Input
              value={formData.socialLinks?.twitter || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                })
              }
              placeholder="https://twitter.com/yourhandle"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Instagram</Label>
            <Input
              value={formData.socialLinks?.instagram || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                })
              }
              placeholder="https://instagram.com/yourprofile"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">YouTube</Label>
            <Input
              value={formData.socialLinks?.youtube || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, youtube: e.target.value },
                })
              }
              placeholder="https://youtube.com/yourchannel"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">Telegram</Label>
            <Input
              value={formData.socialLinks?.telegram || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, telegram: e.target.value },
                })
              }
              placeholder="https://t.me/yourgroup"
            />
          </div>
          <div>
            <Label className="text-muted-foreground">WhatsApp</Label>
            <Input
              value={formData.socialLinks?.whatsapp || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, whatsapp: e.target.value },
                })
              }
              placeholder="https://wa.me/1234567890"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
