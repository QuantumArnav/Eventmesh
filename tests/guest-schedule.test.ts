import { describe, expect, it } from "vitest";
import { GUEST_SCHEDULE_KEY, readGuestSchedule, writeGuestSchedule } from "../lib/guest-schedule";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  };
}

describe("device-local schedule", () => {
  it("round-trips saved events and priorities without requiring an account", () => {
    const storage = memoryStorage();
    expect(writeGuestSchedule(storage, { eventA: "SAVED", eventB: "MUST_ATTEND" })).toBe(true);
    expect(readGuestSchedule(storage)).toEqual({ eventA: "SAVED", eventB: "MUST_ATTEND" });
    expect(writeGuestSchedule(storage, { eventB: "INTERESTED" })).toBe(true);
    expect(readGuestSchedule(storage)).toEqual({ eventB: "INTERESTED" });
  });

  it("ignores malformed or invalid browser data", () => {
    const storage = memoryStorage();
    storage.setItem(GUEST_SCHEDULE_KEY, "not json");
    expect(readGuestSchedule(storage)).toEqual({});
    storage.setItem(GUEST_SCHEDULE_KEY, JSON.stringify({ eventA: "SAVED", eventB: "invalid", "bad/id": "MUST_ATTEND" }));
    expect(readGuestSchedule(storage)).toEqual({ eventA: "SAVED" });
  });

  it("reports unavailable browser storage instead of claiming a save", () => {
    const storage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(readGuestSchedule(storage)).toEqual({});
    expect(writeGuestSchedule(storage, { eventA: "SAVED" })).toBe(false);
  });
});
