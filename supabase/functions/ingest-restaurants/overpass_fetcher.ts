import { RestaurantFetcher } from "./service.ts";
import { parseOSMData } from "./parser.ts";

export const overpassFetcher: RestaurantFetcher = {
  fetchRestaurants: async (bbox) => {
    // 1. Build the Overpass query using the `bbox`
    // (Hint: Check your Git history or stash for the query we removed from service.ts)

    // 2. Fetch from https://overpass-api.de/api/interpreter
    // Remember to include your User-Agent and Accept headers!

    // 3. Handle non-ok HTTP responses by throwing an error

    // 4. Parse the JSON response using `parseOSMData`

    // 5. Return the array of RestaurantRecords
    return [];
  },
};
