import { RestaurantFetcher } from './service.ts';
import { BoundingBox } from './scanner.ts';
import { RestaurantRecord } from './parser.ts';
import {
  calculateDistanceInMeters,
  coordinateToTileId,
  getTileCenterAndRadius,
} from './grid.ts';

interface GooglePlace {
  id?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  displayName?: {
    text: string;
  };
  rating?: number;
  primaryType?: string;
  userRatingCount?: number;
}

export function createGoogleFetcher(apiKey: string): RestaurantFetcher {
  return {
    fetchData: async (bbox: BoundingBox): Promise<RestaurantRecord[]> => {
      const url = 'https://places.googleapis.com/v1/places:searchNearby';

      // Is this a tiny 110m grid tile?
      // If so, use the precision center/radius.
      // If it's larger, use the legacy stretch-to-corner math.
      const isGridTile = Math.abs(bbox.maxLat - bbox.minLat) <= 0.001;

      const centerLat = (bbox.minLat + bbox.maxLat) / 2;
      const centerLon = (bbox.minLon + bbox.maxLon) / 2;

      const radius = isGridTile
        ? getTileCenterAndRadius(coordinateToTileId(centerLat, centerLon))
            .radiusMeters
        : calculateDistanceInMeters(
            centerLat,
            centerLon,
            bbox.maxLat,
            bbox.maxLon,
          );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.location,places.displayName.text,places.rating,places.primaryType,places.userRatingCount',
        },
        body: JSON.stringify({
          includedTypes: ['restaurant'],
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

      return (data.places || []).map(
        (place: GooglePlace): RestaurantRecord => ({
          name: place.displayName?.text ?? 'Unknown',
          google_place_id: place.id,
          location: `POINT(${place.location.longitude} ${place.location.latitude})`,
          cuisine: place.primaryType,
          google_rating: place.rating,
          details: { user_ratings_total: place.userRatingCount },
        }),
      );
    },
  };
}
