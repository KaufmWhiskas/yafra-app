import { useEffect, useState } from 'react';
import { Restaurant } from '../types';

/**
 * A React hook that gradually yields items from a list over successive animation frames.
 * Enhances rendering performance by spacing out heavy component mounts (e.g., map markers).
 *
 * @param items The full list of items to render.
 * @param batchSize The number of items to reveal per staggered frame tick. Defaults to 5.
 * @returns The gradually expanding subset of items.
 */
export function useStaggeredList(
  items: Restaurant[],
  batchSize: number = 5,
): Restaurant[] {
  // Remember every ID we have successfully mounted during this session
  const [mountedIds, setMountedIds] = useState<Set<string>>(() => new Set());

  // Find which items in the current viewport haven't been mounted yet
  const unmountedItems = items.filter((i) => !mountedIds.has(i.id.toString()));

  // Create a stable primitive serialization hash from unmounted target keys.
  const unmountedIdsHash = unmountedItems.map((i) => i.id.toString()).join(',');

  useEffect(() => {
    // If the hash is empty, it means no items are left to mount.
    if (unmountedIdsHash === '') return;

    const frameId = requestAnimationFrame(() => {
      const idsToMount = unmountedIdsHash.split(',').slice(0, batchSize);
      setMountedIds((prev) => {
        const next = new Set(prev);
        idsToMount.forEach((id) => next.add(id));
        return next;
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [unmountedIdsHash, batchSize]);

  // Return the viewport items, but ONLY the ones we've authorized to mount
  return items.filter((i) => mountedIds.has(i.id.toString()));
}
