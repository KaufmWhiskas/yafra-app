import { assertEquals } from "@std/assert";
import { parseOSMData } from "./parser.ts";

Deno.test("parseOSMData() should transform OSM nodes into Restaurant records", () => {
  const mockOSMData = {
    elements: [
      {
        type: "node",
        id: 12345,
        lat: 47.3769,
        lon: 8.5417,
        tags: {
          name: "Test Bistro",
          cuisine: "italian",
          "addr:street": "Bahnhofstrasse",
        },
      },
    ],
  };

  const result = parseOSMData(mockOSMData);

  assertEquals(result.length, 1);
  assertEquals(result[0].name, "Test Bistro");
  assertEquals(result[0].location, "POINT(8.5417 47.3769)");
});

Deno.test("parseOSMData() should deduplicate internal duplicates", () => {
  const duplicateData = {
    elements: [
      { type: "node", id: 1, lat: 47.3, lon: 8.5, tags: { name: "Duplicate" } },
      { type: "node", id: 2, lat: 47.3, lon: 8.5, tags: { name: "Duplicate" } },
    ],
  };

  const result = parseOSMData(duplicateData);
  assertEquals(result.length, 1, "Should filter out internal duplicates");
});
