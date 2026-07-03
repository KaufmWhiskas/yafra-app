import { assertEquals } from '@std/assert';
import { coordinateToTileId, GRID_STEP } from './grid.ts';

Deno.test('GRID_STEP constant is strictly defined as 0.001 degrees', () => {
  assertEquals(GRID_STEP, 0.001);
});

Deno.test(
  'coordinateToTileId() snaps geographic coordinates to fixed grid string',
  () => {
    // 49.4715 / 0.001 = 49471.5 -> floor -> 49471
    // 8.4528 / 0.001 = 8452.8 -> floor -> 8452
    assertEquals(coordinateToTileId(49.4715, 8.4528), '49471_8452');

    // Handles negative coordinates correctly (math floor pushes down)
    assertEquals(coordinateToTileId(-49.4715, -8.4528), '-49472_-8453');

    // Exact boundary snaps to the tile it starts
    assertEquals(coordinateToTileId(49.47, 8.45), '49470_8450');
  },
);
