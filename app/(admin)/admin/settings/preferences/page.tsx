"use client";

import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Palette, Save, RotateCcw } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { colorTemplates } from "@/components/admin/data";

const defaultTheme = {
  background: "#120a1c",
  foreground: "#fff8ec",
  card: "#221233",
  cardForeground: "#f4e2c8",
  primary: "#ffd85c",
  primaryForeground: "#1b1300",
  secondary: "#5b2e8a",
  secondaryForeground: "#f4e2c8",
  muted: "#3a275e",
  mutedForeground: "#d9c8b3",
  accent: "#ffbf4d",
  accentForeground: "#1c1400",
  border: "#3f2a60",
  input: "#6943a1",
  ring: "#ffd85c",
  popover: "#221233",
  popoverForeground: "#f4e2c8",
  success: "#5fc24d",
  error: "#e85854",
  info: "#009ed4",
  sidebar: "#120a1c",
  sidebarForeground: "#f4e2c8",
  sidebarPrimary: "#ffd85c",
  sidebarPrimaryForeground: "#1b1300",
  sidebarAccent: "#ffbf4d",
  sidebarAccentForeground: "#1c1400",
  sidebarBorder: "#3f2a60",
  sidebarRing: "#ffd85c",
  radius: "0.5rem",
  fontFamily: "Inter, sans-serif",
};

export default function PreferencesPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [siteName, setSiteName] = useState("");
  const [logo, setLogo] = useState("");
  const [favicon, setFavicon] = useState("");
  const [authImage, setAuthImage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({
    logo: null as File | null,
    favicon: null as File | null,
    authImage: null as File | null,
  });
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || "");
      setLogo(settings.logo || "");
      setFavicon(settings.favicon || "");
      setAuthImage(settings.authImage || "");

      if (settings.theme) {
        const parsedTheme =
          typeof settings.theme === "string"
            ? JSON.parse(settings.theme)
            : settings.theme;
        setTheme({ ...defaultTheme, ...parsedTheme });
      }
    }
  }, [settings]);

  const updateThemeColor = (key: keyof typeof theme, value: string) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const applyTemplate = (template: any) => {
    setTheme(template.theme);
  };

  const resetToDefaults = () => {
    setTheme(defaultTheme);
  };

  const applyTheme = () => {
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });
  };

  const applyThemeToIframe = () => {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      try {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const root = iframeDoc.documentElement;
          Object.entries(theme).forEach(([key, value]) => {
            if (key === "fontFamily") {
              iframeDoc.body.style.fontFamily = value;
            } else {
              const cssVar = `--${key
                .replace(/([A-Z])/g, "-$1")
                .toLowerCase()}`;
              root.style.setProperty(cssVar, value);
            }
          });
        }
      } catch (e) {
        console.error("Cannot access iframe:", e);
      }
    });
  };

  const handleSaveChanges = async () => {
    const formData = {
      siteName,
      theme: JSON.stringify(theme),
      ...(selectedFiles.logo && { logo: selectedFiles.logo }),
      ...(selectedFiles.favicon && { favicon: selectedFiles.favicon }),
      ...(selectedFiles.authImage && { authImage: selectedFiles.authImage }),
    };

    updateSettings.mutate(formData);
  };

  const colorFields = [
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Preferences</h1>
        <p className="text-muted-foreground">
          Customize your platform appearance and branding
        </p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-card border">
          <TabsTrigger
            value="branding"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Branding
          </TabsTrigger>
          <TabsTrigger
            value="theme"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Theme Colors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Logo & Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Site Name</Label>
                  <Input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="bg-input border mt-2"
                    placeholder="Enter site name"
                  />
                </div>

                <div>
                  <Label className="text-muted-foreground">Main Logo</Label>
                  <div className="mt-2">
                    <FileUpload
                      onFileSelect={(file) =>
                        setSelectedFiles((prev) => ({ ...prev, logo: file }))
                      }
                      currentImageUrl={logo}
                      accept="image/*"
                      maxSize={5}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Favicon</Label>
                  <div className="mt-2">
                    <FileUpload
                      onFileSelect={(file) =>
                        setSelectedFiles((prev) => ({ ...prev, favicon: file }))
                      }
                      currentImageUrl={favicon}
                      accept="image/*"
                      maxSize={5}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">
                    Auth Page Image
                  </Label>
                  <div className="mt-2">
                    <FileUpload
                      onFileSelect={(file) =>
                        setSelectedFiles((prev) => ({
                          ...prev,
                          authImage: file,
                        }))
                      }
                      currentImageUrl={authImage}
                      accept="image/*"
                      maxSize={5}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="text-foreground">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-muted rounded-lg border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    {logo ? (
                      <img
                        src={logo}
                        alt="Logo"
                        className="h-8 object-contain"
                      />
                    ) : (
                      <div className="h-8 w-24 bg-primary/20 rounded flex items-center justify-center text-xs text-muted-foreground">
                        Logo
                      </div>
                    )}
                    <span className="text-foreground font-bold">
                      {siteName || "AIEXCH"}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    This is how your branding will appear on the platform.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="theme">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Scheme
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {colorFields.map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <Label className="text-muted-foreground">{label}</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="color"
                          value={theme[key as keyof typeof theme]}
                          onChange={(e) =>
                            updateThemeColor(
                              key as keyof typeof theme,
                              e.target.value
                            )
                          }
                          className="w-16 h-10 p-1 bg-input border"
                        />
                        <Input
                          value={theme[key as keyof typeof theme]}
                          onChange={(e) =>
                            updateThemeColor(
                              key as keyof typeof theme,
                              e.target.value
                            )
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
                    <Label className="text-muted-foreground">
                      Border Radius
                    </Label>
                    <Select
                      value={theme.radius}
                      onValueChange={(value) =>
                        updateThemeColor("radius", value)
                      }
                    >
                      <SelectTrigger className="bg-input border text-foreground w-[200px]">
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
                      value={theme.fontFamily}
                      onValueChange={(value) =>
                        updateThemeColor("fontFamily", value)
                      }
                    >
                      <SelectTrigger className="bg-input border text-foreground w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border">
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Poppins, sans-serif">
                          Poppins
                        </SelectItem>
                        <SelectItem value="Roboto, sans-serif">
                          Roboto
                        </SelectItem>
                        <SelectItem value="Open Sans, sans-serif">
                          Open Sans
                        </SelectItem>
                        <SelectItem value="Montserrat, sans-serif">
                          Montserrat
                        </SelectItem>
                        <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    onClick={applyTheme}
                    className="bg-primary text-primary-foreground hover:bg-primary/80"
                  >
                    Apply Theme
                  </Button>
                  <Button
                    type="button"
                    onClick={resetToDefaults}
                    variant="outline"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  Live Preview
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={applyThemeToIframe}
                      variant="outline"
                      size="sm"
                    >
                      Apply Theme
                    </Button>
                    <Button
                      type="button"
                      onClick={() => window.open("/", "_blank")}
                      variant="outline"
                      size="sm"
                    >
                      Full Screen
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="h-[600px] w-full">
                    <iframe
                      src="/"
                      className="w-full h-full border-0"
                      title="Live Preview"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSaveChanges}
          disabled={updateSettings.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
