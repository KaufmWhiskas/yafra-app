import { assertAlmostEquals, assertEquals } from "@std/assert";
import { createGoogleFetcher } from "./googleFetcher.ts";
import { BoundingBox } from "./scanner.ts";

const TEST_BBOX: BoundingBox = {
  minLat: 47.3,
  minLon: 8.5,
  maxLat: 47.4,
  maxLon: 8.6,
};

Deno.test("createGoogleFetcher() should call Google Places API with correct headers to enforce $0 SKU", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  let requestedHeaders: HeadersInit | undefined;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = input.toString();
    requestedHeaders = init?.headers;
    return Promise.resolve(new Response(JSON.stringify({ places: [] })));
  }) as typeof fetch;

  try {
    const fetcher = createGoogleFetcher("DUMMY_API_KEY");
    await fetcher.fetchRestaurants(TEST_BBOX);

    assertEquals(
      requestedUrl,
      "https://places.googleapis.com/v1/places:searchNearby",
    );

    const headers = new Headers(requestedHeaders);
    assertEquals(headers.get("X-Goog-Api-Key"), "DUMMY_API_KEY");
    assertEquals(
      headers.get("X-Goog-FieldMask"),
      "places.id,places.location,places.displayName",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("createGoogleFetcher() should correctly parse Google API response into RestaurantRecords", async () => {
  const originalFetch = globalThis.fetch;

  const mockGoogleResponse = {
    places: [
      {
        id: "place_123",
        location: { latitude: 47.3769, longitude: 8.5417 },
        displayName: { text: "Google Bistro" },
      },
    ],
  };

  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(JSON.stringify(mockGoogleResponse)),
    )) as typeof fetch;

  try {
    const fetcher = createGoogleFetcher("DUMMY_API_KEY");
    const results = await fetcher.fetchRestaurants(TEST_BBOX);

    assertEquals(results.length, 1);
    assertEquals(results[0].name, "Google Bistro");
    assertEquals(results[0].location, "POINT(8.5417 47.3769)");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("createGoogleFetcher() should convert BoundingBox to a circle locationRestriction", async () => {
  const originalFetch = globalThis.fetch;
  let requestBody: any; // We use 'any' here just to parse the intercepted unknown payload

  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.body) {
      requestBody = JSON.parse(init.body.toString());
    }
    return Promise.resolve(new Response(JSON.stringify({ places: [] })));
  }) as typeof fetch;

  try {
    const fetcher = createGoogleFetcher("DUMMY_API_KEY");
    await fetcher.fetchRestaurants(TEST_BBOX);

    const circle = requestBody?.locationRestriction?.circle;

    // Midpoint of TEST_BBOX (minLat: 47.3, maxLat: 47.4, minLon: 8.5, maxLon: 8.6)
    assertAlmostEquals(circle?.center?.latitude, 47.35);
    assertAlmostEquals(circle?.center?.longitude, 8.55);

    // The Haversine distance from center (47.35, 8.55) to a corner (47.4, 8.6) is roughly 6.8km.
    // Google Places API requires the radius in meters.
    assertEquals(typeof circle?.radius, "number");
    assertEquals(
      circle.radius > 6700 && circle.radius < 6900,
      true,
      "Radius should be ~6800 meters",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
