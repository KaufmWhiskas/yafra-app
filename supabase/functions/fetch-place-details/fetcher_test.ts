import { assertEquals } from "@std/assert";
import { fetchProDetails } from "./fetcher.ts";

Deno.test("fetchProDetails makes a GET request to the correct Google Places URL with correct headers", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  let requestedHeaders: HeadersInit | undefined;
  let requestedMethod = "";

  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = input.toString();
    requestedHeaders = init?.headers;
    requestedMethod = init?.method || "GET";
    return Promise.resolve(new Response(JSON.stringify({ rating: 4.5 })));
  }) as typeof fetch;

  try {
    await fetchProDetails("place_123", "DUMMY_KEY");

    assertEquals(
      requestedUrl,
      "https://places.googleapis.com/v1/places/place_123",
    );
    assertEquals(requestedMethod, "GET");

    const headers = new Headers(requestedHeaders);
    assertEquals(headers.get("X-Goog-Api-Key"), "DUMMY_KEY");
    assertEquals(
      headers.get("X-Goog-FieldMask"),
      "rating,priceLevel,regularOpeningHours,reviews",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("fetchProDetails returns the parsed JSON data", async () => {
  const originalFetch = globalThis.fetch;
  const mockResponse = { rating: 4.5, priceLevel: 2 };

  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(JSON.stringify(mockResponse)),
    )) as typeof fetch;

  try {
    const result = await fetchProDetails("place_123", "DUMMY_KEY");
    assertEquals(result, mockResponse);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
