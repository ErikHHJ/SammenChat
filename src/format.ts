export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function formatStamp(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === new Date().toDateString()) return time;
  const day = date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  return `${day}, ${time}`;
}

const avatarColors = ["#1f7a5c", "#1d4e89", "#b85a3d", "#6b4c9a", "#8a5a2b", "#0f6e73"];

export function avatarColor(id: string): string {
  const total = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
}
