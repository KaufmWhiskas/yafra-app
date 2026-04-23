interface OSMElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    cuisine?: string;
    [key: string]: string | undefined;
  };
}

interface OSMData {
  elements?: OSMElement[];
}

interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface RestaurantRecord {
  name: string;
  cuisine: string;
  location: GeoJSONPoint;
}

/**
 * Transforms raw OpenStreetMap data into a format suitable for the Supabase database.
 * * @param osmData The raw JSON response from the Overpass API.
 * @returns An array of formatted restaurant objects.
 */
export function parseOSMData(osmData: OSMData): RestaurantRecord[] {
  if (!osmData?.elements) {
    return [];
  }

  return osmData.elements
    .filter((element): element is OSMElement =>
      element.type === "node" && !!element.tags?.name
    )
    .map((element): RestaurantRecord => {
      const name = element.tags?.name ?? "";
      const cuisine = element.tags?.cuisine ?? "";
      return {
        name,
        cuisine,
        location: {
          type: "Point",
          coordinates: [element.lon, element.lat],
        },
      };
    });
}
