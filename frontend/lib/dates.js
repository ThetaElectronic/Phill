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

export function formatRelative(value, fallback = "Timestamp pending") {
  const date = safeDate(value);
  if (!date) return fallback;

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 1) return "Just now";
  if (Math.abs(diffMinutes) < 60) {
    const minutes = Math.abs(diffMinutes);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ${diffMinutes < 0 ? "ago" : "from now"}`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    const hours = Math.abs(diffHours);
    return `${hours} hour${hours === 1 ? "" : "s"} ${diffHours < 0 ? "ago" : "from now"}`;
  }

  const diffDays = Math.round(diffHours / 24);
  const days = Math.abs(diffDays);
  return `${days} day${days === 1 ? "" : "s"} ${diffDays < 0 ? "ago" : "from now"}`;
}
