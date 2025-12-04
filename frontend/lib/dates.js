export function safeDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDateTime(value, fallback = "Timestamp pending") {
  const date = safeDate(value);
  if (!date) return fallback;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

export function formatTime(value, fallback = "Timestamp pending") {
  const date = safeDate(value);
  if (!date) return fallback;
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
