import { act, renderHook } from '@testing-library/react-native';
import { Region } from 'react-native-maps';
import { triggerIngest } from '../../services/restaurantService';
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
    jest.clearAllMocks();
    loadDataMock = jest.fn().mockResolvedValue(undefined);
  });

  it('shows scan button and skips ingest when in city-scale view (16 tiles)', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    // Initial state should be false
    expect(result.current.showScanButton).toBe(false);

    await act(async () => {
      await result.current.scanRegion(MOCK_REGION_CITY_SCALE);
    });

    // Advance timers to allow the deferred state update to run
    await act(async () => {
      jest.runAllTimers();
    });

    // The button should be visible.
    expect(result.current.showScanButton).toBe(true);

    // It should still load local data from the database.
    expect(loadDataMock).toHaveBeenCalledTimes(1);

    // Crucially, it should NOT call the backend ingest function.
    expect(triggerIngest).not.toHaveBeenCalled();
  });

  it('hides scan button and skips ingest when zoomed out too far', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    await act(async () => {
      await result.current.scanRegion(MOCK_REGION_TOO_WIDE);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // The button should be hidden because the region is too large.
    expect(result.current.showScanButton).toBe(false);
    expect(loadDataMock).toHaveBeenCalledTimes(1);
    expect(triggerIngest).not.toHaveBeenCalled();
  });

  it('should trigger ingest when forceManualSearch is true', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    await act(async () => {
      // The second argument simulates the user pressing "Search this area".
      await result.current.scanRegion(MOCK_REGION_CITY_SCALE, true);
    });

    // Advance timers to allow the deferred state update to run
    await act(async () => {
      jest.runAllTimers();
    });

    // When forceManualSearch is true, the button is hidden to prevent double-clicks.
    expect(result.current.showScanButton).toBe(false);

    // The manual override should force the ingest function to be called.
    expect(triggerIngest).toHaveBeenCalledTimes(1);

    // loadData is called once for the initial render, and a second time after ingestion completes.
    expect(loadDataMock).toHaveBeenCalledTimes(2);
  });

  it('should not trigger ingest on minor panning when zoomed in', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    // First, perform a major scan to set the anchor location.
    await act(async () => {
      await result.current.scanRegion(MOCK_REGION_ZOOMED_IN);
    });

    // Flush the timer from the initial scan
    await act(async () => {
      jest.runAllTimers();
    });

    // Reset mocks to test the next action in isolation.
    jest.clearAllMocks();

    // Now, simulate a small pan that is below the distance threshold.
    const slightlyMovedRegion: Region = {
      ...MOCK_REGION_ZOOMED_IN,
      latitude: MOCK_REGION_ZOOMED_IN.latitude + 0.0001,
    };

    await act(async () => {
      await result.current.scanRegion(slightlyMovedRegion);
    });

    // Flush the timer from the panning scan
    await act(async () => {
      jest.runAllTimers();
    });

    // No ingestion should occur for a minor pan.
    expect(triggerIngest).not.toHaveBeenCalled();
    expect(loadDataMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the manual scan button visible when zoomed in tightly if no active pan occurs', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    await act(async () => {
      // Run an initial scan to ground the current anchor position
      await result.current.scanRegion(MOCK_REGION_ZOOMED_IN);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // Reset tracking stats
    jest.clearAllMocks();

    // Fire a second call at the exact same location (simulating a deep zoom or minor wiggle)
    await act(async () => {
      await result.current.scanRegion(MOCK_REGION_ZOOMED_IN);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // Because it is stationary, auto-scan skips, leaving the manual search button visible!
    expect(result.current.showScanButton).toBe(true);
  });
});

describe('useMapScanner hybrid validation', () => {
  let loadDataMock: jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test to ensure isolation.
    jest.clearAllMocks();
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

    await act(async () => {
      await result.current.scanRegion(mediumCityRegion);
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current.showScanButton).toBe(true);
    expect(triggerIngest).not.toHaveBeenCalled();
  });
});
