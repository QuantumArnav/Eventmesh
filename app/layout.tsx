import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CampusProvider } from "./providers";
import "./globals.css";
import "./redesign.css";

export const metadata: Metadata = {
  title: "EventMesh IITH | Campus Event Intelligence",
  description: "Find campus events, build a personal schedule, and coordinate listings at IIT Hyderabad.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body><CampusProvider><AppShell>{children}</AppShell></CampusProvider></body></html>;
}
