import { renderHook, waitFor } from "@testing-library/react-native";
import * as Location from "expo-location";
import { FALLBACK_COORDINATE, useLocation } from "./useLocation";

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

describe("useLocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("Returns high-accuracy coordinates when GPS permissions are granted", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "granted" },
    );
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 48.0, longitude: 8.0 },
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.userLocation).toEqual({
        latitude: 48.0,
        longitude: 8.0,
      });
    });
    expect(result.current.hasLocationPermission).toBe(true);
  });

  it("Returns last known cached coordinates if high-accuracy positioning fails", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "granted" },
    );
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
      new Error("Failed"),
    );
    (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 47.0, longitude: 7.0 },
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.userLocation).toEqual({
        latitude: 47.0,
        longitude: 7.0,
      });
    });
  });

  it("Successfully invokes the IP lookup fallback endpoint when GPS permissions are explicitly denied", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "denied" },
    );
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ latitude: 46.0, longitude: 6.0 }),
    });

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.userLocation).toEqual({
        latitude: 46.0,
        longitude: 6.0,
      });
    });
    expect(globalThis.fetch).toHaveBeenCalledWith("https://ipapi.co/json/");
    expect(result.current.hasLocationPermission).toBe(false);
  });

  it("Returns a sensible global fallback coordinate if both GPS and network lookups fail entirely", async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(
      { status: "denied" },
    );
    (globalThis.fetch as jest.Mock).mockRejectedValue(
      new Error("Network Error"),
    );

    const { result } = renderHook(() => useLocation());

    await waitFor(() => {
      expect(result.current.userLocation).toEqual(FALLBACK_COORDINATE);
    });
  });
});
