import type { TabId } from "@/types/dashboard";

export interface TabDefinition {
  id: TabId;
  label: string;
  defaultSubcategories: string[];
}

export const TAB_DEFINITIONS: TabDefinition[] = [
  {
    id: "professional",
    label: "Professional",
    defaultSubcategories: [
      "Conferences & talks",
      "Workshops & seminars",
      "Job fairs & career events",
      "Industry meetups",
    ],
  },
  {
    id: "social",
    label: "Social",
    defaultSubcategories: ["Nightlife", "Food & dining events", "Culture & entertainment"],
  },
  {
    id: "networking",
    label: "Networking",
    defaultSubcategories: [
      "Business & startup mixers",
      "Industry association events",
      "Coworking / community events",
    ],
  },
  {
    id: "fitness",
    label: "Fitness",
    defaultSubcategories: [
      "Running, cycling & races",
      "Fitness classes & bootcamps",
      "Sports leagues & pickup games",
      "Yoga & wellness",
    ],
  },
  {
    id: "family",
    label: "Family",
    defaultSubcategories: [
      "Kids activities",
      "Family-friendly festivals",
      "Weekend outings",
      "Story time & library events",
    ],
  },
  {
    id: "arts",
    label: "Arts",
    defaultSubcategories: [
      "Gallery openings & exhibitions",
      "Live music & concerts",
      "Theatre & performance",
      "Film screenings",
    ],
  },
];
