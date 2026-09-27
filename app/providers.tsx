"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { EventData, StudentData } from "@/lib/types";
import type { Preference } from "@/lib/schedule-optimizer";

type CampusContext = {
  events: EventData[];
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
  const [student, setStudent] = useState<StudentData | null>(null);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<Record<string, Preference>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [eventData, profileData] = await Promise.all([
        fetch("/api/events", { cache: "no-store" }).then(jsonOrThrow),
        fetch("/api/profile", { cache: "no-store" }).then(jsonOrThrow),
      ]);
      setEvents(eventData);
      setStudent(profileData.student);
      setSavedEventIds(profileData.savedEventIds);
      setPreferences(profileData.preferences ?? {});
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load campus data"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = setTimeout(() => void refresh(), 0); return () => clearTimeout(timer); }, [refresh]);

  const toggleSaved = async (id: string) => {
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

  return <Context.Provider value={{ events, student, savedEventIds, preferences, loading, error, refresh, toggleSaved, setPreference }}>{children}</Context.Provider>;
}

export function useCampus() {
  const value = useContext(Context);
  if (!value) throw new Error("useCampus must be used within CampusProvider");
  return value;
}
