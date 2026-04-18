import {
  COLOR_THEME_ATTRIBUTE,
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_COLOR_THEME,
} from '@/lib/themes/color-themes'

/**
 * Inline script renderowany w <head> PRZED hydracją.
 * Czyta wybrany motyw z localStorage i ustawia atrybut `data-theme` na <html>,
 * dzięki czemu CSS-owe zmienne motywu są dostępne od pierwszej klatki — bez FOUC.
 *
 * Format w localStorage (zgodny z zustand/persist):
 *   { "state": { "theme": "ocean" }, "version": 0 }
 */
export function ColorThemeInitScript() {
  const code = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(COLOR_THEME_STORAGE_KEY)});
    var theme = ${JSON.stringify(DEFAULT_COLOR_THEME)};
    if (raw) {
      var parsed = JSON.parse(raw);
      var candidate = parsed && parsed.state && parsed.state.theme;
      if (typeof candidate === 'string') theme = candidate;
    }
    document.documentElement.setAttribute(${JSON.stringify(COLOR_THEME_ATTRIBUTE)}, theme);
  } catch (_) {
    document.documentElement.setAttribute(${JSON.stringify(COLOR_THEME_ATTRIBUTE)}, ${JSON.stringify(DEFAULT_COLOR_THEME)});
  }
})();
  `.trim()

  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
