import { RestaurantFetcher } from "./service.ts";
import { BoundingBox } from "./scanner.ts";
import { RestaurantRecord } from "./parser.ts";

interface GooglePlace {
  id?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  displayName?: {
    text: string;
  };
}

// Haversine formula to calculate distance in meters
function calculateRadiusInMeters(
  centerLat: number,
  centerLon: number,
  cornerLat: number,
  cornerLon: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (value: number) => (value * Math.PI) / 180;

  const phi1 = toRad(centerLat);
  const phi2 = toRad(cornerLat);
  const deltaPhi = toRad(cornerLat - centerLat);
  const deltaLambda = toRad(cornerLon - centerLon);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function createGoogleFetcher(apiKey: string): RestaurantFetcher {
  return {
    fetchRestaurants: async (
      bbox: BoundingBox,
    ): Promise<RestaurantRecord[]> => {
      const url = "https://places.googleapis.com/v1/places:searchNearby";

      const centerLat = (bbox.minLat + bbox.maxLat) / 2;
      const centerLon = (bbox.minLon + bbox.maxLon) / 2;

      const radius = calculateRadiusInMeters(
        centerLat,
        centerLon,
        bbox.maxLat,
        bbox.maxLon,
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.location,places.displayName",
        },
        body: JSON.stringify({
          includedTypes: ["restaurant"],
          locationRestriction: {
            circle: {
              center: {
                latitude: centerLat,
                longitude: centerLon,
              },
              radius: radius,
            },
          },
        }),
      });

      const data = await response.json();

      return (data.places || []).map((
        place: GooglePlace,
      ): RestaurantRecord => ({
        name: place.displayName?.text ?? "Unknown",
        cuisine: "",
        location:
          `POINT(${place.location.longitude} ${place.location.latitude})`,
      }));
    },
  };
}
