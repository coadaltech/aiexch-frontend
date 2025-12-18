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
import { Whitelabel, WhitelabelTheme } from "../types";
import { colorTemplates } from "../data";

interface ThemeTabProps {
  formData: Whitelabel;
  updateTheme: (key: keyof WhitelabelTheme, value: string) => void;
  applyTemplate: (template: any) => void;
  applyThemeForTesting: () => void;
}

export function ThemeTab({
  formData,
  updateTheme,
  applyTemplate,
  applyThemeForTesting,
}: ThemeTabProps) {
  const themeFields = [
    { key: "background", label: "Background", placeholder: "#120a1c" },
    { key: "foreground", label: "Foreground", placeholder: "#fff8ec" },
    { key: "card", label: "Card", placeholder: "#221233" },
    { key: "cardForeground", label: "Card Foreground", placeholder: "#f4e2c8" },
    { key: "primary", label: "Primary", placeholder: "#ffd85c" },
    {
      key: "primaryForeground",
      label: "Primary Foreground",
      placeholder: "#1b1300",
    },
    { key: "secondary", label: "Secondary", placeholder: "#5b2e8a" },
    {
      key: "secondaryForeground",
      label: "Secondary Foreground",
      placeholder: "#f4e2c8",
    },
    { key: "muted", label: "Muted", placeholder: "#3a275e" },
    {
      key: "mutedForeground",
      label: "Muted Foreground",
      placeholder: "#d9c8b3",
    },
    { key: "accent", label: "Accent", placeholder: "#ffbf4d" },
    {
      key: "accentForeground",
      label: "Accent Foreground",
      placeholder: "#1c1400",
    },
    { key: "border", label: "Border", placeholder: "#3f2a60" },
    { key: "input", label: "Input", placeholder: "#6943a1" },
    { key: "ring", label: "Ring", placeholder: "#ffd85c" },
    { key: "popover", label: "Popover", placeholder: "#221233" },
    {
      key: "popoverForeground",
      label: "Popover Foreground",
      placeholder: "#f4e2c8",
    },
    { key: "success", label: "Success", placeholder: "#5fc24d" },
    { key: "error", label: "Error", placeholder: "#e85854" },
    { key: "info", label: "Info", placeholder: "#009ed4" },
    { key: "sidebar", label: "Sidebar", placeholder: "#120a1c" },
    {
      key: "sidebarForeground",
      label: "Sidebar Foreground",
      placeholder: "#f4e2c8",
    },
    { key: "sidebarPrimary", label: "Sidebar Primary", placeholder: "#ffd85c" },
    {
      key: "sidebarPrimaryForeground",
      label: "Sidebar Primary Foreground",
      placeholder: "#1b1300",
    },
    { key: "sidebarAccent", label: "Sidebar Accent", placeholder: "#ffbf4d" },
    {
      key: "sidebarAccentForeground",
      label: "Sidebar Accent Foreground",
      placeholder: "#1c1400",
    },
    { key: "sidebarBorder", label: "Sidebar Border", placeholder: "#3f2a60" },
    { key: "sidebarRing", label: "Sidebar Ring", placeholder: "#ffd85c" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-muted-foreground mb-2 block">
          Color Templates
        </Label>
        <div className="flex flex-wrap gap-2">
          {colorTemplates.map((template, index) => (
            <Button
              key={index}
              type="button"
              onClick={() => applyTemplate(template)}
              variant="outline"
              size="sm"
              className="h-auto p-2 flex flex-col items-center gap-1 text-foreground"
            >
              <div className="flex gap-1">
                {[
                  template.theme.primary,
                  template.theme.accent,
                  template.theme.background,
                ].map((color, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs">{template.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {themeFields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <Label className="text-muted-foreground">{label}</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.theme[key as keyof WhitelabelTheme]}
                onChange={(e) =>
                  updateTheme(key as keyof WhitelabelTheme, e.target.value)
                }
                className="w-16 h-10 p-1 bg-input border"
              />
              <Input
                value={formData.theme[key as keyof WhitelabelTheme]}
                onChange={(e) =>
                  updateTheme(key as keyof WhitelabelTheme, e.target.value)
                }
                className="bg-input border text-foreground"
                placeholder={placeholder}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <Label className="text-muted-foreground">Border Radius</Label>
          <Select
            value={formData.theme.radius}
            onValueChange={(value) => updateTheme("radius", value)}
          >
            <SelectTrigger className="bg-input border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border">
              <SelectItem value="0rem">None (0rem)</SelectItem>
              <SelectItem value="0.25rem">Small (0.25rem)</SelectItem>
              <SelectItem value="0.5rem">Medium (0.5rem)</SelectItem>
              <SelectItem value="0.75rem">Large (0.75rem)</SelectItem>
              <SelectItem value="1rem">Extra Large (1rem)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-muted-foreground">Font Family</Label>
          <Select
            value={formData.theme.fontFamily}
            onValueChange={(value) => updateTheme("fontFamily", value)}
          >
            <SelectTrigger className="bg-input border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border">
              <SelectItem value="Inter, sans-serif">Inter</SelectItem>
              <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
              <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
              <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
              <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
              <SelectItem value="Lato, sans-serif">Lato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
