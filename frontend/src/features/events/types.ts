export const EVENT_TYPES = { meeting: "Reunión", training: "Capacitación", academic: "Evento académico", call: "Convocatoria", internal: "Actividad interna", other: "Otra actividad" };
export const EVENT_STATUSES = { scheduled: "Programada", in_progress: "En curso", completed: "Finalizada", cancelled: "Cancelada" };
export const EVENT_MODES = { onsite: "Presencial", online: "Virtual", hybrid: "Híbrida" };
export const PARTICIPANT_ROLES = { participant: "Participante", speaker: "Ponente", organizer: "Organizador" };
export const ATTENDANCE_STATUSES = { registered: "Inscrito (sin confirmar)", attended: "Asistió", absent: "Ausente" };
export type EventPermissions = { canEdit: boolean; canManageParticipants: boolean; canRecordAttendance: boolean; canManageEvidence: boolean; canUploadEvidence: boolean; allowedTransitions: (keyof typeof EVENT_STATUSES)[]; canDelete: boolean };
export type EventItem = {
  id: string; title: string; description: string | null; type: keyof typeof EVENT_TYPES; mode: keyof typeof EVENT_MODES; status: keyof typeof EVENT_STATUSES;
  startsAt: string; endsAt: string; location: string | null; url: string | null; organizerId: string; organizer: { id: string; fullName: string };
  projectId: string | null; project: { id: string; name: string } | null; participantCount: number;
  externalOrganizer: string | null; requirements: string | null; registrationUrl: string | null; cancellationReason: string | null;
  permissions: EventPermissions;
};
export type EventPage = { items: EventItem[]; total: number; page: number; pageSize: number; permissions: { canCreateInstitutional: boolean } };
export type Participant = { userId: string; fullName: string; role: keyof typeof PARTICIPANT_ROLES; attendance: keyof typeof ATTENDANCE_STATUSES; recordedAt: string | null };
export type ParticipantPage = { items: Participant[]; total: number; page: number; pageSize: number; permissions: EventPermissions };
export type Evidence = { id: string; title: string; category: string };
export type Person = { id: string; fullName: string };

/** El producto trabaja en Bogota (UTC-5); no usa la zona horaria del equipo. */
export function bogotaInput(value: string | Date) {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? new Date(ms - 5 * 3600000).toISOString().slice(0, 16) : "";
}
export function localInputToUtc(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}:00-05:00`);
  return Number.isFinite(parsed.getTime()) && bogotaInput(parsed) === value ? parsed.toISOString() : null;
}
export function validMonth(value: string | undefined) { return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : undefined; }
export function monthDays(month: string) {
  if (!validMonth(month)) return [];
  const last = new Date(`${month}-01T12:00:00Z`); last.setUTCMonth(last.getUTCMonth() + 1); last.setUTCDate(0);
  return Array.from({ length: last.getUTCDate() }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}
export function monthShift(month: string, delta: number) {
  const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + delta);
  return validMonth(date.toISOString().slice(0, 7)) ?? month;
}
export function overlapsDay(event: Pick<EventItem, "startsAt" | "endsAt">, day: string) {
  const start = new Date(`${day}T00:00:00-05:00`).getTime(), end = start + 86400000;
  return Date.parse(event.startsAt) < end && Date.parse(event.endsAt) > start;
}

export type EventStatus = keyof typeof EVENT_STATUSES;
export const EVENT_STATUS_KEYS = Object.keys(EVENT_STATUSES) as EventStatus[];

/** Maximo que acepta el backend por pagina; el calendario lee el mes completo. */
export const EVENTS_PAGE_SIZE = 100;

const shortDay = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short" });
const clock = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dayKey = (value: string) => bogotaInput(value).slice(0, 10);

/** Cuando ocurre una actividad, en hora de Bogota: "26 oct · 09:00–10:30" o "5 mar – 7 mar" si cruza dias. */
export function formatEventRange(startsAt: string, endsAt: string) {
  const day = (value: string) => {
    const parts = shortDay.formatToParts(new Date(value));
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
    return `${part("day")} ${part("month").replace(".", "")}`;
  };
  const time = (value: string) => clock.format(new Date(value));

  if (dayKey(startsAt) === dayKey(endsAt)) return `${day(startsAt)} · ${time(startsAt)}–${time(endsAt)}`;
  return `${day(startsAt)} ${time(startsAt)} – ${day(endsAt)} ${time(endsAt)}`;
}

/** Cifras de las actividades cargadas: conteo por estado e inscritos. */
export function eventStats(events: readonly Pick<EventItem, "status" | "participantCount">[]) {
  const byStatus = Object.fromEntries(EVENT_STATUS_KEYS.map((key) => [key, 0])) as Record<EventStatus, number>;
  let enrolled = 0;

  for (const event of events) {
    byStatus[event.status] += 1;
    enrolled += event.participantCount;
  }

  return { byStatus, enrolled };
}

/** Actividades que coinciden con un dia, en el orden recibido. */
export function eventsOnDay<T extends Pick<EventItem, "startsAt" | "endsAt">>(events: readonly T[], day: string) {
  return events.filter((event) => overlapsDay(event, day));
}
