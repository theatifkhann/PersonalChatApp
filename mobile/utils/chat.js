export function formatTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function normalizeMessageKind(message, currentUserId) {
  if (message.kind === "system" || message.kind === "error") {
    return message.kind;
  }

  return message.senderId === currentUserId ? "outgoing" : "incoming";
}

export function buildAvatarFallback(label) {
  if (!label) {
    return "?";
  }

  return label.slice(0, 1).toUpperCase();
}
