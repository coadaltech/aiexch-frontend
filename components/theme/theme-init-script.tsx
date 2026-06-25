/**
 * Sets `<html data-theme>` from the persisted choice BEFORE first paint, so the
 * correct theme shell/styling is in place with no flash-of-default-theme. Mirrors
 * the existing color `ThemeScript` approach. Runs once, inline, in <head>.
 */
export function ThemeInitScript() {
  const script = `
    (function () {
      try {
        var KEY = "site-theme";
        var v = null;
        try { v = window.localStorage.getItem(KEY); } catch (e) {}
        if (!v) {
          var m = document.cookie.match(new RegExp("(?:^|;\\\\s*)" + KEY + "=([^;]*)"));
          if (m) v = decodeURIComponent(m[1]);
        }
        var known = { "default": 1, "diamond": 1, "betfair": 1 };
        document.documentElement.dataset.theme = (v && known[v]) ? v : "default";
      } catch (e) {
        document.documentElement.dataset.theme = "default";
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
