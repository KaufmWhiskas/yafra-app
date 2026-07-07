import { serve } from './index.ts';
import { assertEquals, assert, assertExists } from '@std/assert';

const originalFetch = globalThis.fetch;
const originalEnvGet = Deno.env.get;

let fetchCallArgs: { url: string; options: RequestInit } | null = null;

const mockRequireUser = () => {
  return Promise.resolve({ error: null });
};

function setupMocks() {
  globalThis.fetch = ((
    input: RequestInfo | URL,
    options?: RequestInit,
  ): Promise<Response> => {
    fetchCallArgs = { url: String(input), options: options! };
    return Promise.resolve(new Response(JSON.stringify({ places: [] })));
  }) as typeof fetch;
  Deno.env.get = (key: string) => {
    if (key === 'GOOGLE_PLACES_API_KEY') return 'test-api-key';
    return originalEnvGet(key);
  };
  fetchCallArgs = null;
}

function teardownMocks() {
  globalThis.fetch = originalFetch;
  Deno.env.get = originalEnvGet;
}

Deno.test('Edge Function: search-places', async (t) => {
  await t.step(
    'correctly parses coordinates and builds locationBias',
    async () => {
      setupMocks();

      const reqBody = {
        input: 'coffee',
        sessionToken: 'test-token',
        location: { latitude: 47.3769, longitude: 8.5417 },
      };

      const request = new Request('http://localhost:8000/', {
        method: 'POST',
        body: JSON.stringify(reqBody),
      });

      await serve(request, {
        requireUserFn: mockRequireUser,
      });

      assertExists(fetchCallArgs);
      assertEquals(
        fetchCallArgs.url,
        'https://places.googleapis.com/v1/places:autocomplete',
      );
      assertEquals(fetchCallArgs.options.method, 'POST');

      const body = JSON.parse(fetchCallArgs.options.body as string);
      assertEquals(body.input, 'coffee');
      assertExists(body.locationBias);
      assertEquals(body.locationBias.circle.center.latitude, 47.3769);
      assertEquals(body.locationBias.circle.center.longitude, 8.5417);
      assertEquals(body.locationBias.circle.radius, 10000);
      assertExists(body.origin);
      assertEquals(body.origin.latitude, 47.3769);
      assertEquals(body.origin.longitude, 8.5417);

      teardownMocks();
    },
  );

  await t.step(
    'succeeds without locationBias if no coordinates are provided',
    async () => {
      setupMocks();

      const reqBody = {
        input: 'coffee',
        sessionToken: 'test-token',
      };

      const request = new Request('http://localhost:8000/', {
        method: 'POST',
        body: JSON.stringify(reqBody),
      });

      await serve(request, {
        requireUserFn: mockRequireUser,
      });

      assertExists(fetchCallArgs);
      const body = JSON.parse(fetchCallArgs.options.body as string);

      assertEquals(body.input, 'coffee');
      assert(!body.locationBias, 'locationBias should not be present');

      teardownMocks();
    },
  );
});
