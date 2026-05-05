import { assertEquals } from "@std/assert";
import { createSearchFetcher } from "./fetcher.ts";

Deno.test("createSearchFetcher() makes a POST request to Google Places API with correct headers and body", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  let requestedHeaders: HeadersInit | undefined;
  let requestedMethod = "";
  let requestedBody: { input?: string; sessionToken?: string } | undefined;

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
