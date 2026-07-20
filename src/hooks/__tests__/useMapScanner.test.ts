import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Region } from 'react-native-maps';
import { useMapScanner } from '../useMapScanner';

// Mock the triggerIngest service to isolate the hook's logic.
jest.mock('../../services/restaurantService', () => ({
  triggerIngest: jest.fn(),
}));

const MOCK_REGION_ZOOMED_IN: Region = {
  latitude: 49.4715,
  longitude: 8.4525,
  latitudeDelta: 0.004, // Below the threshold
  longitudeDelta: 0.004,
};

// A region that is past the auto-scan threshold (9 tiles), but within the manual scan button threshold (49 tiles)
const MOCK_REGION_CITY_SCALE: Region = {
  latitude: 49.4715,
  longitude: 8.4525,
  latitudeDelta: 0.02, // Creates a 4x4 grid (16 tiles)
  longitudeDelta: 0.02,
};

// A region that is too wide for even the manual scan button
const MOCK_REGION_TOO_WIDE: Region = {
  latitude: 49.4715,
  longitude: 8.4525,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('useMapScanner', () => {
  let loadDataMock: jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test to ensure isolation.
    loadDataMock = jest.fn().mockResolvedValue(undefined);
  });

  it('shows scan button and skips ingest when in city-scale view (16 tiles)', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    // Initial state should be false
    expect(result.current.showScanButton).toBe(false);

    act(() => result.current.scanRegion(MOCK_REGION_CITY_SCALE));

    // Advance timers to allow the deferred state update to run
    await act(async () => {
      jest.runAllTimers();
    });

    // The button should be visible.
    expect(result.current.showScanButton).toBe(true);

    // It should still load local data from the database.
    expect(loadDataMock).toHaveBeenCalledTimes(1);
  });

  it('hides scan button and skips ingest when zoomed out too far', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    act(() => result.current.scanRegion(MOCK_REGION_TOO_WIDE));

    await act(async () => {
      jest.runAllTimers();
    });

    // The button should be hidden because the region is too large.
    expect(result.current.showScanButton).toBe(false);
    expect(loadDataMock).toHaveBeenCalledTimes(1);
  });

  it('should trigger ingest when forceManualSearch is true', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    act(() => {
      result.current.scanRegion(MOCK_REGION_CITY_SCALE, true);
    });

    await waitFor(() => {
      expect(loadDataMock).toHaveBeenCalledWith(expect.any(Object), true);
      expect(loadDataMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should ignore micro-panning entirely to prevent DB flooding', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    // 1. Initial scan anchors both DB and API coordinates
    act(() => result.current.scanRegion(MOCK_REGION_ZOOMED_IN));

    await act(async () => {
      jest.runAllTimers();
    });

    jest.clearAllMocks();

    // 2. Micro pan: Move slightly (under 100 meters)
    const microPanRegion: Region = {
      ...MOCK_REGION_ZOOMED_IN,
      latitude: MOCK_REGION_ZOOMED_IN.latitude + 0.0005, // Very tiny shift
    };

    act(() => result.current.scanRegion(microPanRegion));

    // NEITHER the DB nor the external API should be hit!
    expect(loadDataMock).not.toHaveBeenCalled(); // The micro-pan guard worked!
  });

  it('keeps the manual scan button visible when zoomed in tightly if no active pan occurs', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    await act(async () => {
      result.current.scanRegion(MOCK_REGION_ZOOMED_IN);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // Reset tracking stats
    jest.clearAllMocks();

    // Fire a second call at the exact same location (simulating a deep zoom or minor wiggle)
    act(() => result.current.scanRegion(MOCK_REGION_ZOOMED_IN));

    await act(async () => {
      jest.runAllTimers();
    });

    // Because it is stationary, auto-scan skips, leaving the manual search button visible!
    expect(result.current.showScanButton).toBe(true);
  });
});

describe('useMapScanner optimistic loading', () => {
  let loadDataMock: jest.Mock;

  beforeEach(() => {
    loadDataMock = jest.fn().mockResolvedValue(undefined);
  });

  it('should render cached database pins instantly without blocking on background ingestion', async () => {
    let loadDataPromiseResolve: (value: unknown) => void;
    const loadDataPromise = new Promise((resolve) => {
      loadDataPromiseResolve = resolve;
    });
    loadDataMock.mockReturnValue(loadDataPromise);

    const { result } = renderHook(() => useMapScanner(loadDataMock));

    act(() => {
      // Use force=true to trigger the isScanning state
      result.current.scanRegion(MOCK_REGION_CITY_SCALE, true);
    });

    await waitFor(() => expect(result.current.isScanning).toBe(true));

    act(() => {
      loadDataPromiseResolve({});
    });

    await waitFor(() => expect(result.current.isScanning).toBe(false));
  });
});

describe('useMapScanner hybrid validation', () => {
  let loadDataMock: jest.Mock;

  beforeEach(() => {
    loadDataMock = jest.fn().mockResolvedValue(undefined);
  });

  it('should return showScanButton as true if screen view covers a medium city size (e.g. 5x5 tiles)', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    const mediumCityRegion: Region = {
      latitude: 49.4715,
      longitude: 8.4525,
      latitudeDelta: 0.025, // ceil(0.025 / 0.005) = 5
      longitudeDelta: 0.025, // ceil(0.025 / 0.005) = 5
    }; // tileCount = 25

    act(() => result.current.scanRegion(mediumCityRegion));

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current.showScanButton).toBe(true);
  });
});
