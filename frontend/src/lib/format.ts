/** Fechas en la zona horaria del semillero (plan-desarrollo: America/Bogota). */
const dateFormatter = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", dateStyle: "long" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value: string | Date) {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | Date) {
  return dateTimeFormatter.format(new Date(value));
}

/** Fecha de calendario `YYYY-MM-DD` corta ("15 mar"), sin desplazamiento de zona horaria. */
export function formatShortDay(day: string) {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", day: "2-digit", month: "short" }).format(new Date(`${day}T00:00:00Z`)).replace(".", "");
}

/** Dia calendario de America/Bogota (UTC-5 fijo) de un instante ISO; coincide con el que usa el backend. */
export function bogotaDay(iso: string) {
  return new Date(Date.parse(iso) - 5 * 3_600_000).toISOString().slice(0, 10);
}
