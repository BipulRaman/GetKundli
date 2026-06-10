import { signOf } from "./divisional";

/** A divisional chart definition. */
export interface VargaDef {
  id: string;
  name: string;
  factor: number;
  description: string;
}

/** The classical sixteen divisional charts (Shodashavarga). */
export const VARGAS: VargaDef[] = [
  { id: "D1", name: "Rashi", factor: 1, description: "Body, overall life" },
  { id: "D2", name: "Hora", factor: 2, description: "Wealth & resources" },
  { id: "D3", name: "Drekkana", factor: 3, description: "Siblings, courage" },
  { id: "D4", name: "Chaturthamsha", factor: 4, description: "Fortune, property" },
  { id: "D7", name: "Saptamsha", factor: 7, description: "Children, progeny" },
  { id: "D9", name: "Navamsa", factor: 9, description: "Spouse, dharma, strength" },
  { id: "D10", name: "Dashamsha", factor: 10, description: "Career, status" },
  { id: "D12", name: "Dwadashamsha", factor: 12, description: "Parents, ancestry" },
  { id: "D16", name: "Shodashamsha", factor: 16, description: "Vehicles, comforts" },
  { id: "D20", name: "Vimshamsha", factor: 20, description: "Spiritual progress" },
  { id: "D24", name: "Chaturvimshamsha", factor: 24, description: "Education, learning" },
  { id: "D27", name: "Bhamsha", factor: 27, description: "Strengths & weaknesses" },
  { id: "D30", name: "Trimshamsha", factor: 30, description: "Misfortunes, character" },
  { id: "D40", name: "Khavedamsha", factor: 40, description: "Maternal legacy" },
  { id: "D45", name: "Akshavedamsha", factor: 45, description: "Paternal legacy" },
  { id: "D60", name: "Shashtiamsha", factor: 60, description: "Past karma, all matters" },
];

const MOVABLE = 0; // chara
const FIXED = 1; // sthira
const DUAL = 2; // dvisvabhava

function modality(sign: number): number {
  return sign % 3; // 0 movable, 1 fixed, 2 dual
}

function isOdd(sign: number): boolean {
  return sign % 2 === 0; // Aries(0) is the 1st (odd) sign
}

/** Element of a sign: 0 fire, 1 earth, 2 air, 3 water. */
function element(sign: number): number {
  return sign % 4;
}

/**
 * The divisional-chart sign (0-11) for a sidereal longitude in a given varga,
 * following classical Parashari rules.
 */
export function vargaSign(longitude: number, factor: number): number {
  const sign = signOf(longitude);
  const deg = longitude % 30;

  switch (factor) {
    case 1:
      return sign;

    case 2: {
      // Hora: Sun's hora -> Leo, Moon's hora -> Cancer.
      const half = Math.floor(deg / 15); // 0 or 1
      if (isOdd(sign)) return half === 0 ? 4 : 3; // odd: Leo then Cancer
      return half === 0 ? 3 : 4; // even: Cancer then Leo
    }

    case 3: {
      // Drekkana: 1st/5th/9th from the sign.
      const part = Math.floor(deg / 10); // 0,1,2
      return (sign + part * 4) % 12;
    }

    case 4: {
      // Chaturthamsha: 1st/4th/7th/10th.
      const part = Math.floor(deg / 7.5);
      return (sign + part * 3) % 12;
    }

    case 7: {
      // Saptamsha: odd from same sign, even from the 7th.
      const part = Math.floor(deg / (30 / 7));
      const start = isOdd(sign) ? sign : (sign + 6) % 12;
      return (start + part) % 12;
    }

    case 9: {
      // Navamsa: start by modality.
      const part = Math.floor(deg / (30 / 9));
      const start =
        modality(sign) === MOVABLE
          ? sign
          : modality(sign) === FIXED
          ? (sign + 8) % 12
          : (sign + 4) % 12;
      return (start + part) % 12;
    }

    case 10: {
      // Dashamsha: odd from same sign, even from 9th.
      const part = Math.floor(deg / 3);
      const start = isOdd(sign) ? sign : (sign + 8) % 12;
      return (start + part) % 12;
    }

    case 12: {
      // Dwadashamsha: from the sign itself.
      const part = Math.floor(deg / 2.5);
      return (sign + part) % 12;
    }

    case 16: {
      // Shodashamsha: movable Aries, fixed Leo, dual Sagittarius.
      const part = Math.floor(deg / 1.875);
      const start = modality(sign) === MOVABLE ? 0 : modality(sign) === FIXED ? 4 : 8;
      return (start + part) % 12;
    }

    case 20: {
      // Vimshamsha: movable Aries, fixed Sagittarius, dual Leo.
      const part = Math.floor(deg / 1.5);
      const start = modality(sign) === MOVABLE ? 0 : modality(sign) === FIXED ? 8 : 4;
      return (start + part) % 12;
    }

    case 24: {
      // Chaturvimshamsha: odd from Leo, even from Cancer.
      const part = Math.floor(deg / 1.25);
      const start = isOdd(sign) ? 4 : 3;
      return (start + part) % 12;
    }

    case 27: {
      // Bhamsha: start by element (fire Aries, earth Cancer, air Libra, water Capricorn).
      const part = Math.floor(deg / (30 / 27));
      const el = element(sign);
      const start = el === 0 ? 0 : el === 1 ? 3 : el === 2 ? 6 : 9;
      return (start + part) % 12;
    }

    case 30: {
      // Trimshamsha: unequal Mars/Saturn/Jupiter/Mercury/Venus rulerships.
      if (isOdd(sign)) {
        if (deg < 5) return 0; // Mars -> Aries
        if (deg < 10) return 10; // Saturn -> Aquarius
        if (deg < 18) return 8; // Jupiter -> Sagittarius
        if (deg < 25) return 2; // Mercury -> Gemini
        return 6; // Venus -> Libra
      } else {
        if (deg < 5) return 1; // Venus -> Taurus
        if (deg < 12) return 5; // Mercury -> Virgo
        if (deg < 20) return 11; // Jupiter -> Pisces
        if (deg < 25) return 9; // Saturn -> Capricorn
        return 7; // Mars -> Scorpio
      }
    }

    case 40: {
      // Khavedamsha: odd from Aries, even from Libra.
      const part = Math.floor(deg / 0.75);
      const start = isOdd(sign) ? 0 : 6;
      return (start + part) % 12;
    }

    case 45: {
      // Akshavedamsha: movable Aries, fixed Leo, dual Sagittarius.
      const part = Math.floor(deg / (30 / 45));
      const start = modality(sign) === MOVABLE ? 0 : modality(sign) === FIXED ? 4 : 8;
      return (start + part) % 12;
    }

    case 60: {
      // Shashtiamsha: count the half-degree part from the sign.
      const part = Math.floor(deg * 2);
      return (sign + part) % 12;
    }

    default:
      return sign;
  }
}
