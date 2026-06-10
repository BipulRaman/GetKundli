import type { PlanetId } from "../astro/types";

export interface City {
  name: string;
  lat: number;
  lon: number;
  tz: number;
}

/** A small set of preset locations for convenience. */
export const CITIES: City[] = [
  { name: "New Delhi, India", lat: 28.6139, lon: 77.209, tz: 5.5 },
  { name: "Mumbai, India", lat: 19.076, lon: 72.8777, tz: 5.5 },
  { name: "Bengaluru, India", lat: 12.9716, lon: 77.5946, tz: 5.5 },
  { name: "Kolkata, India", lat: 22.5726, lon: 88.3639, tz: 5.5 },
  { name: "Chennai, India", lat: 13.0827, lon: 80.2707, tz: 5.5 },
  { name: "Hyderabad, India", lat: 17.385, lon: 78.4867, tz: 5.5 },
  { name: "Kathmandu, Nepal", lat: 27.7172, lon: 85.324, tz: 5.75 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278, tz: 0 },
  { name: "New York, USA", lat: 40.7128, lon: -74.006, tz: -5 },
  { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708, tz: 4 },
  { name: "Singapore", lat: 1.3521, lon: 103.8198, tz: 8 },
  { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093, tz: 11 },
];

export const PLANET_SIGNIFICATIONS: Record<PlanetId, string> = {
  Sun: "Soul, ego, vitality, father, authority and leadership.",
  Moon: "Mind, emotions, mother, comfort and the public.",
  Mars: "Energy, courage, drive, siblings and conflict.",
  Mercury: "Intellect, communication, commerce and adaptability.",
  Jupiter: "Wisdom, fortune, expansion, children and dharma.",
  Venus: "Love, beauty, relationships, luxury and the arts.",
  Saturn: "Discipline, karma, longevity, delay and responsibility.",
  Rahu: "Desire, ambition, the unconventional and worldly obsession.",
  Ketu: "Detachment, spirituality, past karma and liberation.",
};

export const SIGN_TRAITS: string[] = [
  "Bold, pioneering and energetic (ruled by Mars).",
  "Steady, sensual and resourceful (ruled by Venus).",
  "Curious, communicative and versatile (ruled by Mercury).",
  "Nurturing, emotional and protective (ruled by the Moon).",
  "Confident, dignified and creative (ruled by the Sun).",
  "Analytical, practical and precise (ruled by Mercury).",
  "Harmonious, diplomatic and fair (ruled by Venus).",
  "Intense, secretive and transformative (ruled by Mars).",
  "Optimistic, philosophical and free (ruled by Jupiter).",
  "Ambitious, disciplined and patient (ruled by Saturn).",
  "Innovative, humanitarian and detached (ruled by Saturn).",
  "Compassionate, imaginative and spiritual (ruled by Jupiter).",
];

export const HOUSE_MEANINGS: string[] = [
  "Self, personality, body and overall vitality.",
  "Wealth, family, speech and values.",
  "Courage, siblings, communication and effort.",
  "Home, mother, happiness and property.",
  "Creativity, children, intellect and romance.",
  "Health, enemies, debts and service.",
  "Partnerships, marriage and public dealings.",
  "Longevity, transformation, secrets and inheritance.",
  "Fortune, dharma, higher learning and the guru.",
  "Career, status, authority and karma.",
  "Gains, income, networks and aspirations.",
  "Losses, expenses, liberation and foreign lands.",
];

export const DASHA_THEMES: Record<PlanetId, string> = {
  Sun: "A period emphasizing authority, recognition, health of the self and ties with the father.",
  Moon: "Emotional focus, domestic matters, public life and care from or for the mother.",
  Mars: "Drive, property, competition and bursts of energy — channel it constructively.",
  Mercury: "Learning, trade, communication and intellectual pursuits come to the fore.",
  Jupiter: "Growth, wisdom, prosperity, family expansion and spiritual development.",
  Venus: "Relationships, comforts, creativity, luxury and material enjoyment.",
  Saturn: "Hard work, discipline, delays that mature you, and long-term karma.",
  Rahu: "Worldly ambition, sudden changes, unconventional gains and intense desire.",
  Ketu: "Detachment, introspection, spiritual turns and release of old patterns.",
};
