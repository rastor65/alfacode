export const THEME_PREFERENCES = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** Sin preferencia guardada se sigue el tema del sistema operativo. */
export const DEFAULT_THEME: ThemePreference = "system";

/** Cookie (no sensible) para que el servidor renderice el tema correcto sin parpadeo. */
export const THEME_COOKIE_NAME = "alfacode_theme";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference) ? (value as ThemePreference) : DEFAULT_THEME;
}

export function themeCookie(theme: ThemePreference, secure: boolean) {
  return `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
