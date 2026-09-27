import type { EventData } from "./types";

function escapeText(value: string): string { return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,"); }
function utcStamp(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - 330 * 60_000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function fold(line: string): string {
  const parts: string[] = [];
  let segment = "";
  for (const character of line) {
    if (new TextEncoder().encode(segment + character).length > 73) { parts.push(segment); segment = ` ${character}`; }
    else segment += character;
  }
  parts.push(segment);
  return parts.join("\r\n");
}

export function generateIcs(events: EventData[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EventMesh IITH//Campus Event Network//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:EventMesh IITH"];
  for (const event of events) lines.push(
    "BEGIN:VEVENT", `UID:${event.id}@eventmesh-iith`, `DTSTAMP:${now}`,
    `DTSTART:${utcStamp(event.date, event.startTime)}`, `DTEND:${utcStamp(event.date, event.endTime)}`,
    `SUMMARY:${escapeText(event.title)}`, `DESCRIPTION:${escapeText(`${event.description}\nOrganizer: ${event.organizer}${event.isDemo ? "\nDemo event; verify details before attending." : ""}`)}`,
    `LOCATION:${escapeText(event.venue)}`, "END:VEVENT",
  );
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadIcs(events: EventData[], filename: string): void {
  const url = URL.createObjectURL(new Blob([generateIcs(events)], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
