import { act, renderHook } from '@testing-library/react-native';
import { Region } from 'react-native-maps';
import { triggerIngest } from '../../services/restaurantService';
import { useMapScanner } from '../useMapScanner';

// Mock the triggerIngest service to isolate the hook's logic.
jest.mock('../../services/restaurantService', () => ({
  triggerIngest: jest.fn(),
}));

// Mock the geo utilities to have a predictable threshold for testing.
jest.mock('../../utils/geo', () => ({
  ...jest.requireActual('../../utils/geo'),
  ZOOM_OUT_THRESHOLD: 0.1,
}));

const MOCK_REGION_ZOOMED_IN: Region = {
  latitude: 49.4715,
  longitude: 8.4525,
  latitudeDelta: 0.01, // Well below the threshold
  longitudeDelta: 0.01,
};

const MOCK_REGION_ZOOMED_OUT: Region = {
  latitude: 49.4715,
  longitude: 8.4525,
  latitudeDelta: 0.2, // Greater than ZOOM_OUT_THRESHOLD
  longitudeDelta: 0.2,
};

describe('useMapScanner', () => {
  let loadDataMock: jest.Mock;

  beforeEach(() => {
    // Clear all mocks before each test to ensure isolation.
    jest.clearAllMocks();
    loadDataMock = jest.fn().mockResolvedValue(undefined);
  });

  it('should not trigger ingest and set isZoomedOut to true when map is zoomed out', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    // Initial state should be false
    expect(result.current.isZoomedOut).toBe(false);

    await act(async () => {
      await result.current.scanRegion(MOCK_REGION_ZOOMED_OUT);
    });

    // The hook should now report that the user is zoomed out.
    expect(result.current.isZoomedOut).toBe(true);

    // It should still load local data from the database.
    expect(loadDataMock).toHaveBeenCalledTimes(1);

    // Crucially, it should NOT call the expensive backend ingest function.
    expect(triggerIngest).not.toHaveBeenCalled();
  });

  it('should trigger ingest when zoomed out if forceManualSearch is true', async () => {
    const { result } = renderHook(() => useMapScanner(loadDataMock));

    await act(async () => {
      // The second argument simulates the user pressing "Search this area".
      await result.current.scanRegion(MOCK_REGION_ZOOMED_OUT, true);
    });

    // The zoom state is still updated correctly.
    expect(result.current.isZoomedOut).toBe(true);

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

    // No ingestion should occur for a minor pan.
    expect(triggerIngest).not.toHaveBeenCalled();
    expect(loadDataMock).toHaveBeenCalledTimes(1);
  });
});
