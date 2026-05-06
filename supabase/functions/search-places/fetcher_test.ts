import { assertEquals } from "@std/assert";
import { createSearchFetcher } from "./fetcher.ts";

Deno.test("createSearchFetcher() makes a POST request to Google Places API with correct headers and body", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  let requestedHeaders: HeadersInit | undefined;
  let requestedMethod = "";
  let requestedBody: {
    input?: string;
    sessionToken?: string;
    includedPrimaryTypes?: string[];
  } | undefined;

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = input.toString();
    requestedHeaders = init?.headers;
    requestedMethod = init?.method || "GET";
    if (init?.body) {
      requestedBody = JSON.parse(init.body.toString());
    }
    return Promise.resolve(new Response(JSON.stringify({ suggestions: [] })));
  }) as typeof fetch;

  try {
    const fetcher = createSearchFetcher("DUMMY_KEY");
    await fetcher.fetchPredictions("Pizza", "session_123");

    assertEquals(
      requestedUrl,
      "https://places.googleapis.com/v1/places:autocomplete",
    );
    assertEquals(requestedMethod, "POST");

    const headers = new Headers(requestedHeaders);
    assertEquals(headers.get("X-Goog-Api-Key"), "DUMMY_KEY");

    assertEquals(requestedBody?.input, "Pizza");
    assertEquals(requestedBody?.sessionToken, "session_123");
    assertEquals(requestedBody?.includedPrimaryTypes, ["restaurant"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("createSearchFetcher() maps Google API response to Prediction[] format", async () => {
  const originalFetch = globalThis.fetch;
  const mockGoogleResponse = {
    suggestions: [
      {
        placePrediction: {
          place: "places/123",
          text: { text: "Pizza Hut, Berlin" },
        },
      },
    ],
  };

  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(JSON.stringify(mockGoogleResponse)),
    )) as typeof fetch;

  try {
    const fetcher = createSearchFetcher("DUMMY_KEY");
    const results = await fetcher.fetchPredictions("Pizza", "session_123");

    assertEquals(results.length, 1);
    assertEquals(results[0].placeId, "places/123");
    assertEquals(results[0].description, "Pizza Hut, Berlin");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("createSearchFetcher() includes locationBias when location is provided", async () => {
  const originalFetch = globalThis.fetch;

  interface ExpectedBody {
    input?: string;
    sessionToken?: string;
    locationBias?: {
      circle?: {
        center?: { latitude?: number; longitude?: number };
        radius?: number;
      };
    };
  }
  let requestedBody: ExpectedBody | undefined;

  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    if (init?.body) {
      requestedBody = JSON.parse(init.body.toString());
    }
    return Promise.resolve(new Response(JSON.stringify({ suggestions: [] })));
  }) as typeof fetch;

  try {
    const fetcher = createSearchFetcher("DUMMY_KEY");

    await fetcher.fetchPredictions("McDonalds", "session_123", {
      latitude: 49.46,
      longitude: 8.42,
    });

    assertEquals(requestedBody?.input, "McDonalds");
    assertEquals(requestedBody?.sessionToken, "session_123");

    const circle = requestedBody?.locationBias?.circle;
    assertEquals(
      circle?.center?.latitude,
      49.46,
      "locationBias center latitude is missing or incorrect",
    );
    assertEquals(
      circle?.center?.longitude,
      8.42,
      "locationBias center longitude is missing or incorrect",
    );
    assertEquals(
      circle?.radius,
      25000.0,
      "locationBias radius should be strictly 25km",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
