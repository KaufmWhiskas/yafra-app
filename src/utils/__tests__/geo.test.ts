import { calculateDistance, getRegionBBox } from "../geo";

describe("Geolocation Utilities", () => {
  describe("getRegionBBox", () => {
    it("should correctly calculate the bounding box from a region", () => {
      const region = {
        latitude: 47.35,
        longitude: 8.55,
        latitudeDelta: 0.1,
        longitudeDelta: 0.2,
      };
      const expectedBBox = {
        minLat: 47.3,
        maxLat: 47.4,
        minLon: 8.45,
        maxLon: 8.65,
      };

      const result = getRegionBBox(region);
      expect(result.minLat).toBeCloseTo(expectedBBox.minLat, 5);
      expect(result.maxLat).toBeCloseTo(expectedBBox.maxLat, 5);
      expect(result.minLon).toBeCloseTo(expectedBBox.minLon, 5);
      expect(result.maxLon).toBeCloseTo(expectedBBox.maxLon, 5);
    });
  });

  describe("calculateDistance", () => {
    it("should return 0 for the same coordinate", () => {
      const coord = { latitude: 47.35, longitude: 8.55 };
      expect(calculateDistance(coord, coord)).toBe(0);
    });

    it("should calculate the distance between two points correctly (approx)", () => {
      const zurich = { latitude: 47.3769, longitude: 8.5417 };
      const basel = { latitude: 47.5596, longitude: 7.5886 };
      const distance = calculateDistance(zurich, basel);
      // Expected straight-line distance is ~74.5 km
      expect(distance).toBeGreaterThan(74);
      expect(distance).toBeLessThan(75);
    });
  });
});
