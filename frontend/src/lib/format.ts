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
