export const CATEGORIES = ["Technical", "Cultural", "Sports", "Workshop", "Talk", "Community"] as const;
export type Category = (typeof CATEGORIES)[number];

export type EventData = {
  id: string;
  title: string;
  organizer: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  category: Category;
  tags: string[];
  registrationDeadline: string | null;
  expectedAudience: number | null;
  popularity: number;
  isDemo: boolean;
  createdAt?: string;
};

export type StudentData = {
  id: string;
  name: string;
  interests: string[];
  categoryPreferences: string[];
  organizerAffinity: string[];
};

export type EventInput = Omit<EventData, "id" | "popularity" | "isDemo" | "createdAt">;
