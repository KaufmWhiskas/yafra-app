import {
  calculateDistance,
  getRegionBBox,
  sortRestaurantsByDistance,
  filterWithinRadius,
} from "../geo";

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

  describe("sortRestaurantsByDistance", () => {
    it("should sort restaurants from closest to furthest based on origin", () => {
      const origin = { latitude: 47.35, longitude: 8.55 };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r1 = { id: 1, name: "Far", latitude: 48.0, longitude: 9.0 } as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r2 = {
        id: 2,
        name: "Closest",
        latitude: 47.36,
        longitude: 8.56,
      } as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r3 = { id: 3, name: "Mid", latitude: 47.5, longitude: 8.6 } as any;

      const result = sortRestaurantsByDistance([r1, r2, r3], origin);
      expect(result[0].name).toBe("Closest");
      expect(result[1].name).toBe("Mid");
      expect(result[2].name).toBe("Far");
    });
  });

  describe("filterWithinRadius", () => {
    it("should filter restaurants within the specified radius", () => {
      const center = { latitude: 0, longitude: 0 };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r1 = { id: 1, name: "5km", latitude: 0.045, longitude: 0 } as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r2 = { id: 2, name: "10km", latitude: 0.09, longitude: 0 } as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r3 = { id: 3, name: "20km", latitude: 0.18, longitude: 0 } as any;

      const result = filterWithinRadius([r1, r2, r3], center, 15);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("5km");
      expect(result[1].name).toBe("10km");
    });
  });
});
