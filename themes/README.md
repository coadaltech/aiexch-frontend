# Multi-Theme Layout System

This platform supports multiple **layout themes** (Default, Diamond, Betfair) that
change the UI structure/chrome — separate from the existing **color
customization** (which still lives in Admin → Settings → Preferences and is
untouched). The two compose: a theme picks the layout; the color overlay tints it.

## How it works

```
<html data-theme="diamond">           ← set pre-paint by ThemeInitScript, kept in sync by ThemeProvider
  QueryProvider
    ThemeProvider                      ← resolves active theme, persists choice, exposes useSiteTheme()
      … app providers …
        MainLayout                     ← ALL business logic: auth redirects, ledger socket, route flags
          ThemedShell                  ← picks the active theme's shell from the registry
            DefaultShell | DiamondShell | BetfairShell
              <Header/> <AppSidebar/> … ← shared, logic-bearing components (reused, never duplicated)
                {page content}
```

- **Business logic stays in `MainLayout` + pages.** Shells own *only* visual
  chrome and receive route flags (`hideHeader`, `isCasinoRoute`, `isHomeOrRoot`)
  as props. Switching theme never touches behaviour.
- **Switching is instant, no reload** — `setTheme()` changes React context state,
  `ThemedShell` re-renders the new shell, and `<html data-theme>` updates.
- **Persistence**: the user's choice is saved to `localStorage` **and** a 1-year
  cookie (`site-theme`). On load, `ThemeProvider` resolves in priority order:
  saved choice → admin default (`settings.activeTheme`) → first enabled → `default`.
  A disabled/removed theme can never get "stuck".

## File map

| Path | Responsibility |
|------|----------------|
| `themes/types.ts` | `ThemeKey`, `ThemeMeta`, `ThemeShellProps` contracts |
| `themes/registry.ts` | Theme **metadata** + `resolveThemeKey()` (no components — safe to import anywhere) |
| `themes/shell-registry.tsx` | Maps theme key → shell component (the only importer of heavy layout code) |
| `themes/default/`, `themes/diamond/`, `themes/betfair/` | One folder per theme; each exports a `*Shell` |
| `contexts/ThemeContext.tsx` | `ThemeProvider` + `useSiteTheme()` |
| `components/theme/themed-shell.tsx` | Renders the active shell |
| `components/theme/theme-switcher.tsx` | User-facing switcher (homepage) |
| `components/theme/theme-init-script.tsx` | Sets `data-theme` before first paint (no flash) |
| `app/(admin)/owner/theme-management/page.tsx` | Admin: default theme + enable/disable |

## Adding a new theme (no core/business changes)

1. Create `themes/<key>/<key>-shell.tsx` exporting a component of type
   `ThemeShell` (use an existing shell as a template; reuse `Header`/`AppSidebar`).
2. Add one entry to `THEMES` in `themes/registry.ts`.
3. Add one line to `SHELLS` in `themes/shell-registry.tsx`.
4. (Optional) Add `html[data-theme="<key>"]` rules in `app/globals.css`.

It then appears automatically in the admin Theme Management page and the user
switcher. No changes to `MainLayout`, pages, or any business logic.

## Backend — where the active default + enabled list live

Theme config is resolved **per domain**, with two layers:

1. **Per white label (primary).** Stored on the existing `whitelabels.layout`
   JSON field as `activeTheme` + `enabledThemes` — **no schema migration** (the
   `layout` text column already exists). Managed in **Admin → White Labels →
   edit → "Layout Theme" tab** (`components/owner/whitelabel/LayoutThemeTab.tsx`).
   Every white label's themes are managed independently there.

2. **Global fallback.** `settings.active_theme` + `settings.enabled_themes`
   (added by migration `0107_rainy_pixie.sql`) are used for the root /
   non-white-label domain and whenever a white label doesn't set its own.

`GET /public/settings` resolves by `x-whitelabel-domain`: if the domain matches
an active white label it returns that white label's `layout.activeTheme` /
`enabledThemes`; otherwise the global `settings` values. The frontend
`ThemeProvider` reads `activeTheme` / `enabledThemes` from this one endpoint, so
per-white-label theming "just works" with no client changes. The color
`theme` fields (global + per white label) are unchanged.

## Migration plan

1. **DB migration** (additive, backward-compatible — both columns are nullable
   with safe defaults, so existing rows and the current platform keep working):
   ```bash
   cd aiexch-backend
   bun run db:migrate          # applies drizzle/0107_rainy_pixie.sql
   ```
   Existing `settings` rows get `active_theme = 'default'` and
   `enabled_themes = ["default","diamond","betfair"]` by column default.
2. **Deploy backend** (settings/public route changes are additive).
3. **Deploy frontend.** With no user choice and default config, every visitor
   sees the **Default** shell — byte-for-byte the previous layout. Zero-risk
   rollout; rollback is just reverting the frontend.
4. (Optional) In Admin → White Labels → edit a white label → **Layout Theme**
   tab, set that white label's default theme and toggle which themes its users
   can switch between.
