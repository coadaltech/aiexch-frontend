import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Star } from "lucide-react";
import { THEMES, DEFAULT_THEME_KEY } from "@/themes/registry";
import { THEME_COLOR_SCHEMAS, defaultThemeColors } from "@/themes/theme-colors";
import { Whitelabel } from "../types";

interface LayoutThemeTabProps {
  formData: Whitelabel;
  setFormData: (data: Whitelabel) => void;
}

/**
 * Per-white-label LAYOUT theme management. Lives inside the white-label edit
 * screen so every white label's themes are managed independently. Stored on the
 * existing `layout` JSON field (`activeTheme` + `enabledThemes`) — no schema
 * change. This controls the layout SHELL (Default / Diamond / Betfair …); the
 * color palette is still managed in the separate "Theme" (colors) tab.
 *
 * The public `/public/settings` endpoint returns these per matched domain, so a
 * visitor on this white label's domain gets exactly this default + switch list.
 */
export function LayoutThemeTab({ formData, setFormData }: LayoutThemeTabProps) {
  const layout = formData.layout ?? { sidebarType: "sidebar-1", bannerType: "banner-1" };
  const activeTheme = layout.activeTheme ?? DEFAULT_THEME_KEY;
  const enabled = layout.enabledThemes ?? THEMES.map((t) => t.key);
  const enabledSet = useMemo(() => new Set(enabled), [enabled]);

  const patchLayout = (patch: Partial<NonNullable<Whitelabel["layout"]>>) => {
    setFormData({ ...formData, layout: { ...layout, ...patch } });
  };

  const setActiveTheme = (key: string) => {
    // Selecting a default always implies it's enabled.
    const nextEnabled = enabledSet.has(key) ? enabled : [...enabled, key];
    patchLayout({ activeTheme: key, enabledThemes: nextEnabled });
  };

  const toggleEnabled = (key: string, on: boolean) => {
    let next = on ? [...new Set([...enabled, key])] : enabled.filter((k) => k !== key);
    if (!next.length) next = [DEFAULT_THEME_KEY];
    // If the current default got disabled, move it to the first enabled theme.
    let nextActive = activeTheme;
    if (!on && key === activeTheme) nextActive = next[0];
    patchLayout({ enabledThemes: next, activeTheme: nextActive });
  };

  // ── Per-theme colour overrides ──────────────────────────────────────────────
  const themeColors = layout.themeColors ?? {};
  const colorFor = (themeKey: string, fieldKey: string, fallback: string) =>
    themeColors[themeKey]?.[fieldKey] ?? fallback;

  const setColor = (themeKey: string, fieldKey: string, value: string) => {
    const seeded = { ...defaultThemeColors(themeKey), ...(themeColors[themeKey] ?? {}) };
    patchLayout({
      themeColors: { ...themeColors, [themeKey]: { ...seeded, [fieldKey]: value } },
    });
  };

  // Themes that are enabled AND expose an editable palette.
  const colorThemes = THEMES.filter(
    (t) => enabledSet.has(t.key) && THEME_COLOR_SCHEMAS[t.key]?.length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="font-semibold text-foreground">Layout Theme</h3>
          <p className="text-sm text-muted-foreground">
            Choose this white label’s default layout and which layouts its users can switch between.
          </p>
        </div>
      </div>

      {/* Default layout theme */}
      <div className="max-w-sm space-y-2">
        <Label className="flex items-center gap-1.5 text-muted-foreground">
          <Star className="h-4 w-4" /> Default Theme
        </Label>
        <Select value={activeTheme} onValueChange={setActiveTheme}>
          <SelectTrigger className="bg-input border text-foreground">
            <SelectValue placeholder="Select default theme" />
          </SelectTrigger>
          <SelectContent className="bg-card border">
            {THEMES.filter((t) => enabledSet.has(t.key)).map((t) => (
              <SelectItem key={t.key} value={t.key}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enable / disable per theme */}
      <div className="space-y-3">
        <Label className="text-muted-foreground">Available Themes</Label>
        {THEMES.map((t) => {
          const isOn = enabledSet.has(t.key);
          const isDefault = t.key === activeTheme;
          return (
            <div
              key={t.key}
              className="flex items-center justify-between gap-4 rounded-lg border bg-input/30 p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="mt-1 h-6 w-6 shrink-0 rounded-full border"
                  style={{ background: t.swatch }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{t.name}</span>
                    {t.badge && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t.badge}
                      </span>
                    )}
                    {isDefault && (
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{t.description}</p>
                </div>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={(v) => toggleEnabled(t.key, v)}
                disabled={isDefault}
                aria-label={`Enable ${t.name} theme`}
              />
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground">
          New themes added under <code>/themes</code> appear here automatically — no code change.
        </p>
      </div>

      {/* Per-theme colour overrides */}
      {colorThemes.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Theme Colours</Label>
            <p className="text-xs text-muted-foreground">
              Override the signature colours of each enabled layout theme. Leave as-is to use the theme defaults.
            </p>
          </div>

          {colorThemes.map((t) => (
            <div key={t.key} className="rounded-lg border bg-input/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border"
                  style={{ background: t.swatch }}
                />
                <span className="font-medium text-foreground">{t.name}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {THEME_COLOR_SCHEMAS[t.key].map((field) => {
                  const val = colorFor(t.key, field.key, field.default);

                  // A named-choice control (e.g. the TomExch header "Gradient /
                  // Single colour" style toggle).
                  if (field.type === "select") {
                    return (
                      <div key={field.key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{field.label}</Label>
                        <Select
                          value={val}
                          onValueChange={(v) => setColor(t.key, field.key, v)}
                        >
                          <SelectTrigger className="h-9 bg-input border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border">
                            {(field.options ?? []).map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }

                  // The TomExch second gradient colour is irrelevant in "solid"
                  // header mode — dim it so the editor reads clearly.
                  const dimmed =
                    field.key === "headerTo" &&
                    colorFor(t.key, "headerMode", "gradient") === "solid";

                  return (
                    <div key={field.key} className={`space-y-1 ${dimmed ? "opacity-40" : ""}`}>
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={val}
                          onChange={(e) => setColor(t.key, field.key, e.target.value)}
                          className="h-9 w-10 shrink-0 cursor-pointer rounded border bg-transparent"
                          aria-label={`${t.name} ${field.label}`}
                        />
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => setColor(t.key, field.key, e.target.value)}
                          className="h-9 w-full rounded border bg-input px-2 text-sm text-foreground"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
