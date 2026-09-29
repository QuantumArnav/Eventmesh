import type { Preference } from "./schedule-optimizer";

export const GUEST_SCHEDULE_KEY = "eventmesh-guest-schedule-v1";
export type GuestSchedule = Record<string, Preference>;
type ScheduleStorage = Pick<Storage, "getItem" | "setItem">;

function isPreference(value: unknown): value is Preference {
  return value === "INTERESTED" || value === "SAVED" || value === "MUST_ATTEND";
}

export function readGuestSchedule(storage: ScheduleStorage): GuestSchedule {
  try {
    const raw = storage.getItem(GUEST_SCHEDULE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, preference]) =>
      /^[a-zA-Z0-9_-]{1,100}$/.test(id) && isPreference(preference),
    ));
  } catch {
    return {};
  }
}

export function writeGuestSchedule(storage: ScheduleStorage, schedule: GuestSchedule): boolean {
  try {
    storage.setItem(GUEST_SCHEDULE_KEY, JSON.stringify(schedule));
    return true;
  } catch {
    return false;
  }
}

export function loadGuestSchedule(): GuestSchedule {
  try { return readGuestSchedule(window.localStorage); } catch { return {}; }
}

export function saveGuestSchedule(schedule: GuestSchedule): boolean {
  try { return writeGuestSchedule(window.localStorage, schedule); } catch { return false; }
}
