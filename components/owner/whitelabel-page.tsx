"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Whitelabel, WhitelabelTheme } from "./types";
import {
  GeneralTab,
  ThemeTab,
  LayoutTab,
  ConfigTab,
  PreferencesTab,
  PermissionsTab,
  PreviewTab,
} from "./whitelabel";

interface WhitelabelPageProps {
  whitelabel?: Whitelabel;
  onSave: (data: Whitelabel) => void;
  isLoading?: boolean;
  title: string;
}

const getDefaultTheme = (): WhitelabelTheme => {
  if (typeof window === 'undefined') {
    return {
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
  }
  const root = getComputedStyle(document.documentElement);
  return {
    background: root.getPropertyValue("--background").trim() || "#120a1c",
    foreground: root.getPropertyValue("--foreground").trim() || "#fff8ec",
    card: root.getPropertyValue("--card").trim() || "#221233",
    cardForeground:
      root.getPropertyValue("--card-foreground").trim() || "#f4e2c8",
    primary: root.getPropertyValue("--primary").trim() || "#ffd85c",
    primaryForeground:
      root.getPropertyValue("--primary-foreground").trim() || "#1b1300",
    secondary: root.getPropertyValue("--secondary").trim() || "#5b2e8a",
    secondaryForeground:
      root.getPropertyValue("--secondary-foreground").trim() || "#f4e2c8",
    muted: root.getPropertyValue("--muted").trim() || "#3a275e",
    mutedForeground:
      root.getPropertyValue("--muted-foreground").trim() || "#d9c8b3",
    accent: root.getPropertyValue("--accent").trim() || "#ffbf4d",
    accentForeground:
      root.getPropertyValue("--accent-foreground").trim() || "#1c1400",
    border: root.getPropertyValue("--border").trim() || "#3f2a60",
    input: root.getPropertyValue("--input").trim() || "#6943a1",
    ring: root.getPropertyValue("--ring").trim() || "#ffd85c",
    popover: root.getPropertyValue("--popover").trim() || "#221233",
    popoverForeground:
      root.getPropertyValue("--popover-foreground").trim() || "#f4e2c8",
    success: root.getPropertyValue("--success").trim() || "#5fc24d",
    error: root.getPropertyValue("--error").trim() || "#e85854",
    info: root.getPropertyValue("--info").trim() || "#009ed4",
    sidebar: root.getPropertyValue("--sidebar").trim() || "#120a1c",
    sidebarForeground:
      root.getPropertyValue("--sidebar-foreground").trim() || "#f4e2c8",
    sidebarPrimary:
      root.getPropertyValue("--sidebar-primary").trim() || "#ffd85c",
    sidebarPrimaryForeground:
      root.getPropertyValue("--sidebar-primary-foreground").trim() || "#1b1300",
    sidebarAccent:
      root.getPropertyValue("--sidebar-accent").trim() || "#ffbf4d",
    sidebarAccentForeground:
      root.getPropertyValue("--sidebar-accent-foreground").trim() || "#1c1400",
    sidebarBorder:
      root.getPropertyValue("--sidebar-border").trim() || "#3f2a60",
    sidebarRing: root.getPropertyValue("--sidebar-ring").trim() || "#ffd85c",
    radius: root.getPropertyValue("--radius").trim() || "0.5rem",
    fontFamily:
      root.getPropertyValue("--font-inter").trim() || "Inter, sans-serif",
  };
};

export function WhitelabelPage({
  whitelabel,
  onSave,
  isLoading,
  title,
}: WhitelabelPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [completedTabs, setCompletedTabs] = useState<string[]>([]);

  const [formData, setFormData] = useState<Whitelabel>({
    name: "",
    domain: "",
    title: "",
    description: "",
    status: "active",
    contactEmail: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
      telegram: "",
      whatsapp: "",
    },
    theme: getDefaultTheme(),
    layout: {
      sidebarType: "sidebar-1",
      bannerType: "banner-1",
    },
    config: {
      dbName: "casino_main",
      s3FolderName: "casino-assets",
    },
    preferences: {
      language: "en",
      currency: "USD",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      enableLiveChat: true,
      enableNotifications: true,
      maintenanceMode: false,
    },
    permissions: {
      casino: true,
      sports: true,
      liveCasino: true,
      promotions: true,
      transactions: true,
      userManagement: false,
      reports: false,
      settings: false,
    },
  });

  useEffect(() => {
    if (whitelabel) {
      setFormData(whitelabel);
      setCompletedTabs([
        "general",
        "theme",
        "layout",
        "config",
        "preferences",
        "permissions",
        "preview",
      ]);
    }
  }, [whitelabel]);

  const tabs = [
    "general",
    "theme",
    "layout",
    "config",
    "preferences",
    "permissions",
    "preview",
  ];

  const validateTab = (tab: string): boolean => {
    if (tab === "general")
      return !!(formData.name && formData.domain && formData.contactEmail);
    if (tab === "theme") return true;
    if (tab === "layout") return true;
    if (tab === "config")
      return !!(formData.config?.dbName && formData.config?.s3FolderName);
    if (tab === "preferences") return true;
    if (tab === "permissions") return true;
    if (tab === "preview") return true;
    return false;
  };

  const handleTabChange = (value: string) => {
    const currentIndex = tabs.indexOf(activeTab);
    const targetIndex = tabs.indexOf(value);

    if (
      targetIndex > currentIndex &&
      !completedTabs.includes(tabs[targetIndex - 1])
    ) {
      return;
    }

    if (validateTab(activeTab) && !completedTabs.includes(activeTab)) {
      setCompletedTabs([...completedTabs, activeTab]);
    }

    setActiveTab(value);
  };

  const isTabDisabled = (tab: string): boolean => {
    const tabIndex = tabs.indexOf(tab);
    if (tabIndex === 0) return false;
    return !completedTabs.includes(tabs[tabIndex - 1]);
  };

  const updateTheme = (key: keyof WhitelabelTheme, value: string) => {
    setFormData({
      ...formData,
      theme: {
        ...formData.theme,
        [key]: value,
      },
    });
  };

  const applyTemplate = (template: any) => {
    setFormData({ ...formData, theme: template.theme });
  };

  const applyThemeForTesting = () => {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      try {
        const iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const root = iframeDoc.documentElement;
          Object.entries(formData.theme).forEach(([key, value]) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {title}
          </h1>
        </div>
        <Button
          onClick={() => onSave(formData)}
          className="bg-primary"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : whitelabel ? "Update" : "Create"}
        </Button>
      </div>

      <Card className="bg-card border">
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general" disabled={isTabDisabled("general")}>
                General
              </TabsTrigger>
              <TabsTrigger value="theme" disabled={isTabDisabled("theme")}>
                Theme
              </TabsTrigger>
              <TabsTrigger value="layout" disabled={isTabDisabled("layout")}>
                Layout
              </TabsTrigger>
              <TabsTrigger value="config" disabled={isTabDisabled("config")}>
                Config
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                disabled={isTabDisabled("preferences")}
              >
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="permissions"
                disabled={isTabDisabled("permissions")}
              >
                Permissions
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={isTabDisabled("preview")}>
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-6">
              <GeneralTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="theme" className="mt-6">
              <ThemeTab
                formData={formData}
                updateTheme={updateTheme}
                applyTemplate={applyTemplate}
                applyThemeForTesting={applyThemeForTesting}
              />
            </TabsContent>

            <TabsContent value="layout" className="mt-6">
              <LayoutTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="config" className="mt-6">
              <ConfigTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="preferences" className="mt-6">
              <PreferencesTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="permissions" className="mt-6">
              <PermissionsTab formData={formData} setFormData={setFormData} />
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              <PreviewTab applyThemeForTesting={applyThemeForTesting} />
            </TabsContent>
          </Tabs>


        </CardContent>
      </Card>
    </div>
  );
}
