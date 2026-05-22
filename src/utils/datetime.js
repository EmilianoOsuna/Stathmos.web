/** Zona horaria del taller mecánico */
export const WORKSHOP_TIMEZONE = "America/Mazatlan";
/** Offset de zona horaria del taller (-7 horas) */
export const WORKSHOP_OFFSET = "-07:00";

/**
 * Convierte una fecha a formato YYYY-MM-DD en la zona horaria del taller.
 * @param {string|Date|number} value - La fecha a convertir (string ISO, Date object, o timestamp)
 * @returns {string} Fecha en formato YYYY-MM-DD (ej: "2026-05-10")
 */
export const toWorkshopYmd = (value) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WORKSHOP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
};

/**
 * Formatea una fecha a formato legible en español, usando la zona horaria del taller.
 * @param {string|Date|number} value - La fecha a formatear
 * @param {Object} [options={}] - Opciones adicionales de formato para toLocaleDateString()
 * @returns {string} Fecha formateada (ej: "10/5/2026") o "—" si value es nulo
 */
export const formatDateWorkshop = (value, options = {}) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX", {
    timeZone: WORKSHOP_TIMEZONE,
    ...options,
  });
};

/**
 * Formatea una hora a formato legible en español (HH:mm), usando la zona horaria del taller.
 * @param {string|Date|number} value - La hora a formatear
 * @param {Object} [options={}] - Opciones adicionales de formato para toLocaleTimeString()
 * @returns {string} Hora formateada (ej: "14:30") o "—" si value es nulo
 */
export const formatTimeWorkshop = (value, options = {}) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("es-MX", {
    timeZone: WORKSHOP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};

/**
 * Formatea una fecha y hora completa a formato legible en español, usando la zona horaria del taller.
 * @param {string|Date|number} value - La fecha y hora a formatear
 * @param {Object} [options={}] - Opciones adicionales de formato para toLocaleString()
 * @returns {string} Fecha y hora formateada (ej: "10/05/2026 14:30") o "—" si value es nulo
 */
export const formatDateTimeWorkshop = (value, options = {}) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", {
    timeZone: WORKSHOP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en la zona horaria del taller.
 * @returns {string} Fecha actual en formato YYYY-MM-DD (ej: "2026-05-10")
 */
export const todayWorkshopYmd = () => toWorkshopYmd(new Date());
