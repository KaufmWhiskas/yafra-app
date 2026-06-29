export interface RestaurantRecord {
  name: string;
  cuisine?: string;
  location: string;
  google_place_id?: string;
  google_rating?: number;
  details?: Record<string, unknown>;
}

interface OsmElement {
  readonly type: 'node' | 'way' | 'relation';
  readonly id: number;
  readonly lat?: number;
  readonly lon?: number;
  readonly tags?: { readonly [key: string]: string };
  readonly nodes?: readonly number[];
  readonly center?: { readonly lat: number; readonly lon: number };
}

interface OsmData {
  readonly elements: readonly OsmElement[];
}

/**
 * Parses raw JSON data from the Overpass API into a structured array of RestaurantRecords.
 * It handles both 'node' and 'way' elements, extracting common restaurant tags.
 *
 * @param osmData The raw JSON response from the Overpass API.
 * @returns An array of standardized restaurant records.
 */
export function parseOSMData(osmData: OsmData): RestaurantRecord[] {
  const restaurants: RestaurantRecord[] = [];
  const nodes = new Map<number, { lat: number; lon: number }>();
  const uniqueRestaurants = new Set<string>();

  // First pass: collect all node coordinates for way lookups
  for (const element of osmData.elements) {
    if (element.type === 'node' && element.lat && element.lon) {
      nodes.set(element.id, { lat: element.lat, lon: element.lon });
    }
  }

  // Second pass: process elements that are restaurants
  for (const element of osmData.elements) {
    if (
      element.tags &&
      (element.tags.amenity === 'restaurant' ||
        element.tags.amenity === 'fast_food' ||
        element.tags.amenity === 'cafe')
    ) {
      if (!element.tags.name) {
        continue; // Skip unnamed restaurants
      }

      let lat: number | undefined;
      let lon: number | undefined;

      if (element.type === 'node' && element.lat && element.lon) {
        lat = element.lat;
        lon = element.lon;
      } else if (element.type === 'way' && element.center) {
        // For ways, Overpass API can provide a center point
        lat = element.center.lat;
        lon = element.center.lon;
      }

      if (lat !== undefined && lon !== undefined) {
        const uniqueKey = `${element.tags.name}|${lat}|${lon}`;
        if (!uniqueRestaurants.has(uniqueKey)) {
          uniqueRestaurants.add(uniqueKey);
          restaurants.push({
            name: element.tags.name,
            cuisine: element.tags.cuisine,
            location: `POINT(${lon} ${lat})`,
            google_place_id: element.tags['ref:google'],
          });
        }
      }
    }
  }

  return restaurants;
}
