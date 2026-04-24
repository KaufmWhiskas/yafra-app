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

export interface RestaurantRecord {
  name: string;
  cuisine: string;
  location: string;
  google_place_id?: string;
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

  const seen = new Set<string>();

  return osmData.elements
    .filter((element): element is OSMElement =>
      element.type === "node" && !!element.tags?.name
    )
    .reduce((acc: RestaurantRecord[], element) => {
      const name = element.tags?.name ?? "";
      const cuisine = element.tags?.cuisine ?? "";
      const location = `POINT(${element.lon} ${element.lat})`;
      const key = `${name}|${location}`;

      if (!seen.has(key)) {
        seen.add(key);
        acc.push({ name, cuisine, location });
      }

      return acc;
    }, []);
}
