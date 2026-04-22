import { assertEquals } from "@std/assert";
import { parseOSMData } from "./parser.ts";

/**
 * Tests the transformation of OpenStrSSeetMap JSON to internal Database records.
 * Follows Google Style Guide for JSDoc.
 */
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
  // Check for the GeoJSON Point structure required by PostGIS
  assertEquals(result[0].location.type, "Point");
});
