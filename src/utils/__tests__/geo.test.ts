import {
  calculateDistance,
  filterWithinRadius,
  getRegionBBox,
  getVisibleRestaurants,
  sortRestaurantsByDistance,
} from "../geo";
import { Restaurant } from "../../types";

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
      const r1 = {
        id: "1",
        name: "Far",
        latitude: 48.0,
        longitude: 9.0,
      } as Restaurant;
      const r2 = {
        id: "2",
        name: "Closest",
        latitude: 47.36,
        longitude: 8.56,
      } as Restaurant;
      const r3 = {
        id: "3",
        name: "Mid",
        latitude: 47.5,
        longitude: 8.6,
      } as Restaurant;

      const result = sortRestaurantsByDistance([r1, r2, r3], origin);
      expect(result[0].name).toBe("Closest");
      expect(result[1].name).toBe("Mid");
      expect(result[2].name).toBe("Far");
    });
  });

  describe("filterWithinRadius", () => {
    it("should filter restaurants within the specified radius", () => {
      const center = { latitude: 0, longitude: 0 };
      const r1 = {
        id: "1",
        name: "5km",
        latitude: 0.045,
        longitude: 0,
      } as Restaurant;
      const r2 = {
        id: "2",
        name: "10km",
        latitude: 0.09,
        longitude: 0,
      } as Restaurant;
      const r3 = {
        id: "3",
        name: "20km",
        latitude: 0.18,
        longitude: 0,
      } as Restaurant;

      const result = filterWithinRadius([r1, r2, r3], center, 15);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe("5km");
      expect(result[1].name).toBe("10km");
    });
  });

  describe("getVisibleRestaurants", () => {
    const region = {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    // Exact region: lat [-0.05, 0.05], lon [-0.05, 0.05]
    // Buffered region: lat [-0.1, 0.1], lon [-0.1, 0.1]
    const exactRest = {
      id: "1",
      latitude: 0.02,
      longitude: 0.02,
      rating: 4,
    } as Restaurant;
    const bufferRest = {
      id: "2",
      latitude: 0.08,
      longitude: 0.08,
      rating: 3,
    } as Restaurant;
    const outsideRest = {
      id: "3",
      latitude: 0.15,
      longitude: 0.15,
      rating: 5,
    } as Restaurant;

    it("should return only restaurants within the exact region", () => {
      const result = getVisibleRestaurants([exactRest], region);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("1");
    });

    it("should return restaurants within the 1/2 screen buffer zone", () => {
      const result = getVisibleRestaurants([bufferRest], region);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe("2");
    });

    it("should exclude restaurants outside the buffered zone", () => {
      const result = getVisibleRestaurants([outsideRest], region);
      expect(result.length).toBe(0);
    });

    it("should enforce a maximum array length, prioritizing higher-rated restaurants", () => {
      const r1 = {
        id: "1",
        latitude: 0,
        longitude: 0,
        rating: 3.0,
      } as Restaurant;
      const r2 = {
        id: "2",
        latitude: 0,
        longitude: 0,
        rating: 5.0,
      } as Restaurant;
      const r3 = {
        id: "3",
        latitude: 0,
        longitude: 0,
        app_rating: 4.5,
      } as Restaurant;

      const result = getVisibleRestaurants([r1, r2, r3], region, 2);

      expect(result.length).toBe(2);
      // Should prioritize 5.0 and 4.5 over 3.0
      expect(result[0].id).toBe("2");
      expect(result[1].id).toBe("3");
    });

    describe("zoom-based pruning", () => {
      const regionZoomIn = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      const regionZoomOut = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
      };
      const restUnbookmarked = {
        id: "1",
        latitude: 0,
        longitude: 0,
        rating: 4,
      } as Restaurant;
      const restBookmarked = {
        id: "2",
        latitude: 0,
        longitude: 0,
        rating: 4,
      } as Restaurant;
      const bookmarkedIds = new Set(["2"]);

      it("should return all visible restaurants when the zoom level is within the threshold", () => {
        const result = getVisibleRestaurants(
          [restUnbookmarked, restBookmarked],
          regionZoomIn,
          50,
          bookmarkedIds,
        );
        expect(result.length).toBe(2);
      });

      it("should drop unbookmarked visible restaurants when the zoom level exceeds the threshold", () => {
        const result = getVisibleRestaurants(
          [restUnbookmarked],
          regionZoomOut,
          50,
          bookmarkedIds,
        );
        expect(result.length).toBe(0);
      });

      it("should retain bookmarked restaurants even when zoomed out past the threshold", () => {
        const result = getVisibleRestaurants(
          [restUnbookmarked, restBookmarked],
          regionZoomOut,
          50,
          bookmarkedIds,
        );
        expect(result.length).toBe(1);
        expect(result[0].id).toBe("2");
      });
    });
  });
});
