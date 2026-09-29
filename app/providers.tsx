"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { EventData, StudentData } from "@/lib/types";
import type { Preference } from "@/lib/schedule-optimizer";
import { GUEST_SCHEDULE_KEY, loadGuestSchedule, saveGuestSchedule } from "@/lib/guest-schedule";

type CampusContext = {
  events: EventData[];
  account: { id: string; name: string | null; email: string | null; image: string | null; role: string } | null;
  student: StudentData | null;
  savedEventIds: string[];
  preferences: Record<string, Preference>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  toggleSaved: (id: string) => Promise<void>;
  setPreference: (id: string, preference: Preference) => Promise<void>;
};

const Context = createContext<CampusContext | null>(null);

async function jsonOrThrow(response: Response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body;
}

export function CampusProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [account, setAccount] = useState<CampusContext["account"]>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Record<string, Preference>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [eventData, profileResponse] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }).then(jsonOrThrow),
        fetch("/api/profile", { cache: "no-store" }),
      ]);
      setEvents(eventData);
      if (profileResponse.status === 401) {
        const guest = loadGuestSchedule();
        setAccount(null); setStudent(null); setSavedEventIds(Object.keys(guest)); setPreferences(guest);
      } else {
        const profileData = await jsonOrThrow(profileResponse);
        setAccount(profileData.account);
        setStudent(profileData.student);
        setSavedEventIds(profileData.savedEventIds);
        setPreferences(profileData.preferences ?? {});
      }
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load campus data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [refresh]);

  useEffect(() => {
    const syncGuestSchedule = (event: StorageEvent) => {
      if (account || (event.key !== GUEST_SCHEDULE_KEY && event.key !== null)) return;
      const guest = loadGuestSchedule();
      setSavedEventIds(Object.keys(guest));
      setPreferences(guest);
    };
    window.addEventListener("storage", syncGuestSchedule);
    return () => window.removeEventListener("storage", syncGuestSchedule);
  }, [account]);

  const toggleSaved = async (id: string) => {
    if (!account) {
      const next = { ...preferences };
      if (savedEventIds.includes(id)) delete next[id]; else next[id] = "SAVED";
      if (!saveGuestSchedule(next)) {
        setError("Browser storage is unavailable, so this event could not be saved on this device.");
        return;
      }
      setSavedEventIds(Object.keys(next));
      setPreferences(next);
      setError(null);
      return;
    }
    const wasSaved = savedEventIds.includes(id);
    setSavedEventIds((current) => wasSaved ? current.filter((value) => value !== id) : [...current, id]);
    try {
      const response = await fetch("/api/saved", { method: wasSaved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id }) });
      const data = await jsonOrThrow(response);
      setSavedEventIds(data.savedEventIds);
      setPreferences((current) => {
        const next = { ...current };
        if (wasSaved) delete next[id]; else next[id] = "SAVED";
        return next;
      });
      setError(null);
    } catch (cause) {
      setSavedEventIds((current) => wasSaved ? [...current, id] : current.filter((value) => value !== id));
      setError(cause instanceof Error ? cause.message : "Could not update schedule");
    }
  };

  const setPreference = async (id: string, preference: Preference) => {
    if (!account) {
      const next = { ...preferences, [id]: preference };
      if (!saveGuestSchedule(next)) {
        setError("Browser storage is unavailable, so this priority could not be saved on this device.");
        return;
      }
      setPreferences(next);
      setSavedEventIds(Object.keys(next));
      setError(null);
      return;
    }
    const old = preferences;
    setPreferences((current) => ({ ...current, [id]: preference }));
    try {
      const response = await fetch("/api/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: id, preference }) });
      const data = await jsonOrThrow(response);
      setPreferences(data.preferences);
      setSavedEventIds(Object.keys(data.preferences));
      setError(null);
    } catch (cause) { setPreferences(old); setError(cause instanceof Error ? cause.message : "Could not update event priority"); }
  };

  return <Context.Provider value={{ events, account, student, savedEventIds, preferences, loading, error, refresh, toggleSaved, setPreference }}>{children}</Context.Provider>;
}

export function useCampus() {
  const value = useContext(Context);
  if (!value) throw new Error("useCampus must be used within CampusProvider");
  return value;
}
