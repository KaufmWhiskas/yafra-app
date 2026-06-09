import { Restaurant } from "../types";
import { CATEGORY_MAP, FilterGroup } from "../constants/categories";

export interface FilterCriteria {
  cuisine?: string | null;
  minRating?: number | null;
  inAppReviewsOnly?: boolean;
}

/**
 * Filters a list of restaurants by a set of criteria.
 *
 * @param restaurants The array of restaurants to filter.
 * @param criteria The filtering criteria.
 * @returns A new filtered array of restaurants.
 */
export function filterRestaurants(
  restaurants: Restaurant[],
  criteria: FilterCriteria,
): Restaurant[] {
  return restaurants.filter((r) => {
    if (criteria.cuisine) {
      const categoryInfo = r.cuisine
        ? CATEGORY_MAP[r.cuisine.toLowerCase()]
        : null;

      if (!categoryInfo) {
        return false;
      }

      // Check if the selected UI group matches the defined category arrays
      const hasMatchingGroup = categoryInfo.filterGroups.includes(
        criteria.cuisine as FilterGroup,
      );
      if (!hasMatchingGroup) {
        return false;
      }
    }
    if (criteria.minRating != null) {
      const rating = r.app_rating ?? r.rating ?? 0;
      if (rating < criteria.minRating) {
        return false;
      }
    }
    if (criteria.inAppReviewsOnly && !r.app_rating) {
      return false;
    }
    return true;
  });
}
