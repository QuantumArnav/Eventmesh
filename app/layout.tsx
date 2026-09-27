import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { CampusProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "EventMesh IITH | Campus Event Intelligence",
  description: "Discover what matters. Schedule smarter. An intelligent event layer for IIT Hyderabad.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><CampusProvider><AppShell>{children}</AppShell></CampusProvider></body></html>;
}
