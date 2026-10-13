/** Error devuelto por la API (`{ code, message, details }`) o por la red. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export const NETWORK_ERROR_CODE = "NETWORK_ERROR";

/**
 * Mensajes para la interfaz. El backend ya responde en espanol, pero sin tildes y con
 * textos tecnicos; aqui se ajustan los casos que la persona usuaria ve con frecuencia.
 */
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos.",
  ACCOUNT_NOT_ACTIVE:
    "Tu cuenta aún no está habilitada. Verifica tu correo y espera a que aprueben tu solicitud.",
  EMAIL_DOMAIN_NOT_ALLOWED: "Usa tu correo institucional @uniguajira.edu.co.",
  ORIGIN_NOT_ALLOWED: "La solicitud se bloqueó por seguridad. Recarga la página e intenta de nuevo.",
  CSRF_TOKEN_INVALID: "Tu sesión cambió. Recarga la página e intenta de nuevo.",
  UNAUTHENTICATED: "Tu sesión terminó. Inicia sesión de nuevo.",
  SERVICE_BUSY: "El servicio está ocupado. Intenta de nuevo en unos segundos.",
  VALIDATION_ERROR: "Revisa los datos del formulario.",
  INVALID_TOKEN: "El enlace no es válido o ya expiró.",
  TEMPORARY_PASSWORD_EXPIRED:
    "Tu contraseña temporal venció. Usa «¿Olvidaste tu contraseña?» o pide una nueva a la coordinación.",
  PASSWORD_CHANGE_REQUIRED: "Debes cambiar tu contraseña temporal antes de continuar.",
  INVALID_CURRENT_PASSWORD: "La contraseña actual no es correcta.",
  PASSWORD_UNCHANGED: "La nueva contraseña debe ser distinta de la actual.",
  MAIL_DELIVERY_FAILED: "No pudimos enviar el correo. Intenta de nuevo en unos minutos.",
  PASSWORD_RESET_DISABLED:
    "La recuperación de contraseña no está disponible por ahora. Pide ayuda a la coordinación del semillero.",
  EMAIL_ALREADY_REGISTERED: "Ya existe una cuenta con ese correo. Inicia sesión con ella.",
  REGISTRATION_DISABLED:
    "El registro público no está disponible por ahora. Pide una invitación a la coordinación del semillero.",
  [NETWORK_ERROR_CODE]: "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
};

function retryAfterSeconds(details: unknown) {
  const value = (details as { retryAfterSeconds?: unknown } | null)?.retryAfterSeconds;
  return typeof value === "number" && value > 0 ? value : null;
}

/** Mensaje legible para mostrar en la interfaz a partir de cualquier error. */
export function describeError(error: unknown) {
  if (!(error instanceof ApiRequestError)) {
    return "Ocurrió un error inesperado. Intenta de nuevo.";
  }

  if (error.code === "TOO_MANY_REQUESTS") {
    const seconds = retryAfterSeconds(error.details);
    const minutes = seconds ? Math.ceil(seconds / 60) : null;

    return minutes
      ? `Demasiados intentos. Intenta de nuevo en ${minutes} ${minutes === 1 ? "minuto" : "minutos"}.`
      : "Demasiados intentos. Intenta de nuevo más tarde.";
  }

  return MESSAGES[error.code] ?? error.message;
}

/**
 * Mensajes por campo a partir de un error del backend: los campos de un error de validacion
 * (`details: [{ field, rules }]`) y el correo cuando el dominio no esta permitido.
 */
export function fieldErrorMessages<Field extends string>(error: unknown, messages: Record<Field, string>) {
  const fields = invalidFields(error);
  const result: Partial<Record<Field, string>> = {};

  for (const field of Object.keys(messages) as Field[]) {
    if (fields.includes(field)) {
      result[field] = messages[field];
    }
  }

  if (error instanceof ApiRequestError && error.code === "EMAIL_DOMAIN_NOT_ALLOWED" && "email" in messages) {
    result["email" as Field] = MESSAGES.EMAIL_DOMAIN_NOT_ALLOWED;
  }

  return result;
}

/** Campos señalados por un error de validacion del backend (`details: [{ field, rules }]`). */
export function invalidFields(error: unknown) {
  if (!(error instanceof ApiRequestError) || !Array.isArray(error.details)) {
    return [];
  }

  return error.details
    .map((detail) => (detail as { field?: unknown }).field)
    .filter((field): field is string => typeof field === "string");
}
