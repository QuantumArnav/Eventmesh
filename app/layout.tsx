import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CampusProvider } from "./providers";
import "./globals.css";
import "./redesign.css";

export const metadata: Metadata = {
  title: "EventMesh IITH | Campus Event Intelligence",
  description: "Find campus events, build a personal schedule, and coordinate listings at IIT Hyderabad.",
};

// Runs before hydration so a saved preference never paints with the wrong palette.
const themeBootstrap = `(() => {
  try {
    const stored = localStorage.getItem("eventmesh-theme");
    const preference = stored === "light" || stored === "dark" ? stored : "system";
    const resolved = preference === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preference;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    const resolved = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.themePreference = "system";
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head><body><CampusProvider><AppShell>{children}</AppShell></CampusProvider></body></html>;
}
