import "server-only";

import { cookies } from "next/headers";

import { THEME_COOKIE_NAME, parseThemePreference } from "./theme";

/** Preferencia de tema guardada, para renderizarla desde el servidor. */
export async function getThemePreference() {
  return parseThemePreference((await cookies()).get(THEME_COOKIE_NAME)?.value);
}
