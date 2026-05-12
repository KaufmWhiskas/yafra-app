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
 * Sorts an array of restaurants by their physical distance from a given origin point.
 * Why: Enhances UX by ensuring list views and contextual prompts prioritize visually and physically relevant locations.
 */
export function sortRestaurantsByDistance(
  restaurants: Restaurant[],
  origin: Coordinate,
): Restaurant[] {
  return [...restaurants].sort((a, b) => {
    const distanceA = calculateDistance(origin, {
      latitude: a.latitude,
      longitude: a.longitude,
    });
    const distanceB = calculateDistance(origin, {
      latitude: b.latitude,
      longitude: b.longitude,
    });

    return distanceA - distanceB;
  });
}

/**
 * Filters an array of restaurants, keeping only those within a specified radius (in kilometers) from a center point.
 * Why: Prevents memory leaks and UI lag in map components by actively pruning stale, off-screen data from the React state.
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
