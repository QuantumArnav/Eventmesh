import type { Metadata } from "next";
import { EventDetail } from "@/components/event-detail";
import { getEvent } from "@/lib/event-store";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const event = await getEvent((await params).id);
    if (!event) return { title: "Event not found | EventMesh IITH" };
    const description = `${event.description.slice(0, 150)} ${event.isDemo ? "Illustrative demo event." : "Local EventMesh listing."}`;
    return { title: `${event.title} | EventMesh IITH`, description, openGraph: { title: event.title, description, type: "article" } };
  } catch { return { title: "Event | EventMesh IITH" }; }
}

export default async function EventPage({ params }: Props) {
  return <EventDetail id={(await params).id} />;
}
