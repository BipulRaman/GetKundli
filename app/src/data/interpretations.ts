import type { PlanetId } from "../astro/types";

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
