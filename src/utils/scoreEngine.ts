import { SCORE_DESCRIPTORS } from "../constants/scoring";

// Define color pivots (RGB format for fast math)
const RGB_RED = { r: 220, g: 53, b: 69 }; // 1.0
const RGB_YELLOW = { r: 255, g: 193, b: 7 }; // 3.0
const RGB_LIGHT_GREEN = { r: 139, g: 195, b: 74 }; // 4.0
const RGB_DARK_GREEN = { r: 26, g: 122, b: 54 }; // 5.0

const rgbToHex = (r: number, g: number, b: number) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const interpolateColor = (
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number },
  factor: number,
): string => {
  const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val)));
  return rgbToHex(
    clamp(c1.r + factor * (c2.r - c1.r)),
    clamp(c1.g + factor * (c2.g - c1.g)),
    clamp(c1.b + factor * (c2.b - c1.b)),
  );
};

export function getScoreDescriptor(score: number): string {
  const validScore = Math.max(1.0, Math.min(5.0, score));
  // Look for the first threshold that the score meets or exceeds
  for (const threshold of SCORE_DESCRIPTORS) {
    if (validScore >= threshold.score) return threshold.label;
  }
  return SCORE_DESCRIPTORS[SCORE_DESCRIPTORS.length - 1].label;
}

export function getScoreColor(score: number): string {
  const validScore = Math.max(1.0, Math.min(5.0, score));

  if (validScore <= 3.0) {
    // 1.0 to 3.0 (Range: 2.0)
    const factor = (validScore - 1.0) / 2.0;
    return interpolateColor(RGB_RED, RGB_YELLOW, factor);
  } else if (validScore <= 4.0) {
    // 3.0 to 4.0 (Range: 1.0)
    const factor = (validScore - 3.0) / 1.0;
    return interpolateColor(RGB_YELLOW, RGB_LIGHT_GREEN, factor);
  } else {
    // 4.0 to 5.0 (Range: 1.0)
    const factor = (validScore - 4.0) / 1.0;
    return interpolateColor(RGB_LIGHT_GREEN, RGB_DARK_GREEN, factor);
  }
}
