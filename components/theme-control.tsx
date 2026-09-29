"use client";

import { useEffect, useSyncExternalStore } from "react";

type ThemePreference = "light" | "dark" | "system";
const key = "eventmesh-theme";
const changeEvent = "eventmesh-theme-change";

function isPreference(value: string | undefined): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  window.dispatchEvent(new Event(changeEvent));
}

function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  return () => window.removeEventListener(changeEvent, callback);
}

function getPreference(): ThemePreference {
  const preference = document.documentElement.dataset.themePreference;
  return isPreference(preference) ? preference : "system";
}

export function ThemeControl() {
  const preference = useSyncExternalStore(subscribe, getPreference, () => "system");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (getPreference() === "system") applyTheme("system");
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return;
      applyTheme(isPreference(event.newValue ?? undefined) ? event.newValue as ThemePreference : "system");
    };
    media.addEventListener("change", onSystemChange);
    window.addEventListener("storage", onStorage);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return <label className="theme-control"><span>Theme</span><select aria-label="Theme" value={preference} onChange={(event) => {
    const next = event.target.value as ThemePreference;
    try { window.localStorage.setItem(key, next); } catch { /* Continue with this tab's preference. */ }
    applyTheme(next);
  }}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label>;
}
