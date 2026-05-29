import { Region } from "react-native-maps";
import { Restaurant } from "../types";

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export function getRegionBBox(region: Region): BoundingBox {
  return {
    minLat: region.latitude - region.latitudeDelta / 2,
    maxLat: region.latitude + region.latitudeDelta / 2,
    minLon: region.longitude - region.longitudeDelta / 2,
    maxLon: region.longitude + region.longitudeDelta / 2,
  };
}

export function calculateDistance(
  coord1: Coordinate,
  coord2: Coordinate,
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
  const dLon = (coord2.longitude - coord1.longitude) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * (Math.PI / 180)) *
      Math.cos(coord2.latitude * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Synthetic distance reduction applied during proximity calculations to prioritize
 * restaurants with custom platform reviews over standard provider entries.
 */
const APP_RATING_SORT_BONUS_KM = 2;

/**
 * Sorts an array of restaurants by their physical distance from a given origin point.
 * Enhances UX by ensuring list views and contextual prompts prioritize visually and physically relevant locations.
 * Restaurants with an `app_rating` are given a "bonus" to appear higher in the sort order.
 *
 * @param restaurants The full list of restaurants to sort.
 * @param origin The coordinate to calculate the distance from.
 * @returns A new array of restaurants sorted from closest to furthest.
 */
export function sortRestaurantsByDistance(
  restaurants: Restaurant[],
  origin: Coordinate,
): Restaurant[] {
  return [...restaurants].sort((a, b) => {
    let distanceA = calculateDistance(origin, {
      latitude: a.latitude,
      longitude: a.longitude,
    });
    if (a.app_rating) {
      distanceA -= APP_RATING_SORT_BONUS_KM;
    }

    let distanceB = calculateDistance(origin, {
      latitude: b.latitude,
      longitude: b.longitude,
    });
    if (b.app_rating) {
      distanceB -= APP_RATING_SORT_BONUS_KM;
    }

    return distanceA - distanceB;
  });
}

/**
 * Returns a strict subset of the closest restaurants to a given coordinate.
 * Ignores all rating bonuses to provide a true physical proximity list.
 *
 * @param restaurants The full array of restaurants.
 * @param location The geographic center point.
 * @param limit The maximum number of restaurants to return.
 * @returns The sliced array of closest restaurants.
 */
export function getClosestRestaurants(
  restaurants: Restaurant[],
  location: Coordinate,
  limit: number,
): Restaurant[] {
  return [...restaurants]
    .sort((a, b) => {
      const distA = calculateDistance(location, {
        latitude: a.latitude,
        longitude: a.longitude,
      });
      const distB = calculateDistance(location, {
        latitude: b.latitude,
        longitude: b.longitude,
      });
      return distA - distB;
    })
    .slice(0, limit);
}

/**
 * Filters an array of restaurants, keeping only those within a specified radius (in kilometers) from a center point.
 * Prevents memory leaks and UI lag in map components by actively pruning stale, off-screen data from the React state.
 *
 * @param restaurants The full list of restaurants to filter.
 * @param center The center coordinate point.
 * @param radiusKm The maximum distance radius in kilometers.
 * @returns An array of restaurants that fall within the specified radius.
 */
export function filterWithinRadius(
  restaurants: Restaurant[],
  center: Coordinate,
  radiusKm: number,
): Restaurant[] {
  return restaurants.filter((restaurant) => {
    const distance = calculateDistance(center, {
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    });
    return distance <= radiusKm;
  });
}

/**
 * Filters and limits restaurants based on their visibility within a map region.
 * Includes a 50% buffer zone around the visible area to ensure smooth panning.
 * If the number of visible restaurants exceeds maxMarkers, it prioritizes
 * those with the highest ratings. When zoomed out beyond the threshold,
 * unbookmarked restaurants are pruned to reduce visual clutter.
 *
 * @param restaurants The full list of restaurants.
 * @param region The current map region being displayed.
 * @param maxMarkers The maximum number of markers to return (defaults to 50).
 * @param bookmarkedIds An optional set of bookmarked restaurant IDs to retain at all zoom levels.
 * @returns An array of restaurants that fall within the buffered region.
 */
export const ZOOM_OUT_THRESHOLD = 0.2;

export function getVisibleRestaurants(
  restaurants: Restaurant[],
  region: Region,
  maxMarkers: number = 50,
  bookmarkedIds?: Set<string>,
): Restaurant[] {
  const latBuffer = region.latitudeDelta;
  const lonBuffer = region.longitudeDelta;
  const minLat = region.latitude - latBuffer;
  const maxLat = region.latitude + latBuffer;
  const minLon = region.longitude - lonBuffer;
  const maxLon = region.longitude + lonBuffer;

  const isZoomedOut = region.latitudeDelta >= ZOOM_OUT_THRESHOLD;

  const visible = restaurants.filter((r) => {
    if (
      r.latitude < minLat || r.latitude > maxLat || r.longitude < minLon ||
      r.longitude > maxLon
    ) {
      return false;
    }
    if (isZoomedOut) {
      return bookmarkedIds?.has(r.id.toString()) ?? false;
    }
    return true;
  });

  if (visible.length > maxMarkers) {
    visible.sort((a, b) => {
      // Rule 1: Bookmarks always win
      const isABookmarked = bookmarkedIds?.has(a.id.toString()) ? 1 : 0;
      const isBBookmarked = bookmarkedIds?.has(b.id.toString()) ? 1 : 0;
      if (isABookmarked !== isBBookmarked) {
        return isBBookmarked - isABookmarked;
      }

      // Rule 2: App ratings get a massive boost to ensure they beat any Google rating
      const getWeightedRating = (r: Restaurant) => {
        if (r.app_rating !== undefined && r.app_rating !== null) {
          return r.app_rating + 10;
        }
        return r.rating ?? 0;
      };

      return getWeightedRating(b) - getWeightedRating(a);
    });

    return visible.slice(0, maxMarkers);
  }

  return visible;
}
