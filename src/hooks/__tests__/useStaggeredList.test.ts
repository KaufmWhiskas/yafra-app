import { act, renderHook } from '@testing-library/react-native';
import { useStaggeredList } from '../useStaggeredList';
import { Restaurant } from '../../types';

describe('useStaggeredList', () => {
  const createMockRestaurant = (overrides: Partial<Restaurant>): Restaurant => {
    return {
      id: '1',
      name: 'Mock Restaurant',
      cuisine: 'Mock Cuisine',
      latitude: 0,
      longitude: 0,
      rating: 4.0,
      google_place_id: 'mock_place_id',
      app_rating: 4.5,
      ...overrides,
    };
  };

  const createDummyRestaurants = (count: number) => {
    return Array.from({ length: count }, (_, i) =>
      createMockRestaurant({
        id: i.toString(),
        name: `Rest ${i}`,
        latitude: i * 0.01,
        longitude: i * 0.01,
      }),
    );
  };

  beforeAll(() => {
    jest.useFakeTimers();

    // Override requestAnimationFrame to use setTimeout so jest fake timers can advance it deterministically
    jest
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        return setTimeout(() => cb(Date.now()), 16) as unknown as number;
      });
    jest
      .spyOn(globalThis, 'cancelAnimationFrame')
      .mockImplementation((id: number) => {
        clearTimeout(id);
      });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('returns an empty array on the first render frame', () => {
    const items = createDummyRestaurants(10);
    const { result } = renderHook(() => useStaggeredList(items, 5));
    expect(result.current.length).toBe(0);
  });

  it('Gradually adds a batch of items (e.g., 5 at a time) every time a frame tick occurs', () => {
    const items = createDummyRestaurants(15);
    const { result } = renderHook(() => useStaggeredList(items, 5));

    expect(result.current.length).toBe(0);

    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current.length).toBe(5);

    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current.length).toBe(10);

    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current.length).toBe(15);
  });

  it('Resets the staggered queue cleanly when the incoming master list completely changes', () => {
    const items1 = createDummyRestaurants(10);
    const { result, rerender } = renderHook(
      ({ items }: { items: Restaurant[] }) => {
        return useStaggeredList(items, 5);
      },
      { initialProps: { items: items1 } },
    );

    act(() => {
      jest.advanceTimersByTime(16); // 5 items
    });
    act(() => {
      jest.advanceTimersByTime(16); // 10 items
    });
    expect(result.current.length).toBe(10);

    const items2 = createDummyRestaurants(20).map((r) => ({
      ...r,
      id: `new_${r.id}`,
    }));
    rerender({ items: items2 });

    expect(result.current.length).toBe(0);

    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current.length).toBe(5);
    expect(result.current[0].id).toBe('new_0');
  });

  it('Verify that rerendering the hook with a brand new region object reference—but keeping the exact same array items—does not reset the list size back to your starting batch size or cause layout tracking resets.', () => {
    const items = createDummyRestaurants(10);
    const { result, rerender } = renderHook(
      ({ items }: { items: Restaurant[] }) => {
        return useStaggeredList(items, 5);
      },
      { initialProps: { items } },
    );

    act(() => {
      jest.advanceTimersByTime(16);
    });
    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current.length).toBe(10);

    rerender({ items });

    expect(result.current.length).toBe(10);
  });

  it('Verify that passing an empty array [] immediately empties the output state on frame zero instead of leaving trailing elements behind.', () => {
    const items = createDummyRestaurants(10);
    const { result, rerender } = renderHook(
      ({ items }: { items: Restaurant[] }) => {
        return useStaggeredList(items, 5);
      },
      { initialProps: { items } },
    );

    act(() => {
      jest.advanceTimersByTime(16); // 5 items
    });
    act(() => {
      jest.advanceTimersByTime(16); // 10 items
    });
    expect(result.current.length).toBe(10);

    rerender({ items: [] });

    expect(result.current.length).toBe(0);
  });
});

describe('useStaggeredList Performance Safety', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not cancel scheduled frame ticks when new array instances with identical items are passed', () => {
    const mockRestaurants: Restaurant[] = [
      { id: '1', name: 'Cafe A' } as Restaurant,
      { id: '2', name: 'Bistro B' } as Restaurant,
    ];

    const { result, rerender } = renderHook(
      ({ items }: { items: Restaurant[] }) => useStaggeredList(items, 5),
      { initialProps: { items: mockRestaurants } },
    );
    rerender({ items: [...mockRestaurants] });

    act(() => {
      jest.advanceTimersByTime(16);
    });

    // Elements should mount smoothly instead of being clobbered by frame cancellations
    expect(result.current.length).toBe(2);
  });
});
