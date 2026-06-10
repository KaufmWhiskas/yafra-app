import { CATEGORY_MAP } from "../constants/categories";

export function getCategoryDisplayName(
  rawCuisine: string | null | undefined,
): string {
  if (!rawCuisine) return "Restaurant";

  const normalizedKey = rawCuisine.toLowerCase().trim();
  const matchedCategory = CATEGORY_MAP[normalizedKey];

  if (matchedCategory && matchedCategory.displayName) {
    return matchedCategory.displayName;
  }

  // Fallback: Turn "some_weird_type_restaurant" into "Some Weird Type"
  return rawCuisine
    .replace(/_restaurant$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
