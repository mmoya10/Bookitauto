// Utilidades de fecha/hora puras (sin dependencias)

/** Devuelve "YYYY-MM-DDTHH:mm" en hora local para inputs type=datetime-local */
export function toLocalInput(d) {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 16);
}

/** Devuelve "YYYY-MM-DD" en hora local para inputs type=date */
export function toLocalDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(0, 10);
}

/** Devuelve "HH:mm" en hora local */
export function toLocalTime(d) {
  if (!d) return "";
  const dt = new Date(d);
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  return dt.toISOString().slice(11, 16);
}

/** "HH:mm–HH:mm" con hora local */
export function formatSlotLabel(start, end) {
  return `${toLocalTime(start)}-${toLocalTime(end)}`;
}
