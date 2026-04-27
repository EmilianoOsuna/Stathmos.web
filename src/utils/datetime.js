export const WORKSHOP_TIMEZONE = "America/Mazatlan";
export const WORKSHOP_OFFSET = "-07:00";

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

export const formatDateWorkshop = (value, options = {}) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX", {
    timeZone: WORKSHOP_TIMEZONE,
    ...options,
  });
};

export const formatTimeWorkshop = (value, options = {}) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("es-MX", {
    timeZone: WORKSHOP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
};

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

export const todayWorkshopYmd = () => toWorkshopYmd(new Date());
