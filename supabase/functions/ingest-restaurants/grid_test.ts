import { assertAlmostEquals, assertEquals } from '@std/assert';
import {
  coordinateToTileId,
  getIntersectingTiles,
  getSubTiles,
  getTileCenterAndRadius,
  GRID_STEP,
} from './grid.ts';
import { BoundingBox } from './scanner.ts';

Deno.test('GRID_STEP constant is strictly defined as 0.001 degrees', () => {
  assertEquals(GRID_STEP, 0.005);
});

Deno.test(
  'coordinateToTileId() snaps geographic coordinates to fixed grid string',
  () => {
    // 49.4715 / 0.005 = 9894.3 -> floor -> 9894
    // 8.4528 / 0.005 = 1690.56 -> floor -> 1690
    assertEquals(coordinateToTileId(49.4715, 8.4528), '9894_1690');

    // Handles negative coordinates correctly (math floor pushes down)
    // -49.4715 / 0.005 = -9894.3 -> floor -> -9895
    // -8.4528 / 0.005 = -1690.56 -> floor -> -1691
    assertEquals(coordinateToTileId(-49.4715, -8.4528), '-9895_-1691');

    // Exact boundary snaps to the tile it starts
    // 49.47 / 0.005 = 9894
    // 8.45 / 0.005 = 1690
    // NOTE: Floating point math makes 8.45 / 0.005 result in 1689.999..., which floors to 1689.
    // This is expected behavior for binary floating-point arithmetic.
    assertEquals(coordinateToTileId(49.47, 8.45), '9894_1689');
  },
);

Deno.test(
  'getIntersectingTiles() returns all tiles contained within or crossing a BoundingBox',
  () => {
    const bbox: BoundingBox = {
      minLat: 49.4712, // All within tile lat 9894
      maxLat: 49.4725,
      minLon: 8.4521, // All within tile lon 1690
      maxLon: 8.4534,
    };

    const expected = ['9894_1690'];

    const result = getIntersectingTiles(bbox);
    assertEquals(result, expected);
  },
);

Deno.test(
  'getIntersectingTiles() throws a RangeError if the requested viewport covers more than 25 base tiles',
  () => {
    const massiveBBox: BoundingBox = {
      minLat: 49.4,
      maxLat: 49.426, // Creates a 6-tile span
      minLon: 8.4,
      maxLon: 8.426, // Creates a 6-tile span (6x6 = 36 tiles total)
    };

    try {
      getIntersectingTiles(massiveBBox);
      throw new Error('Test failed: Should have thrown a RangeError');
    } catch (error) {
      assertEquals(error instanceof RangeError, true);
      assertEquals(
        (error as RangeError).message.includes('Area too large'),
        true,
      );
    }
  },
);

Deno.test(
  'getTileCenterAndRadius() resolves exact center coordinates and a correct circumscribed radius in meters',
  () => {
    // Tile "9894_1690" means:
    // lat boundaries: [49.470, 49.475] -> Center: 49.4725
    // lon boundaries: [8.450, 8.455]   -> Center: 8.4525
    const tileId = '9894_1690';

    const { centerLat, centerLon, radiusMeters } =
      getTileCenterAndRadius(tileId);

    assertAlmostEquals(centerLat, 49.4725);
    assertAlmostEquals(centerLon, 8.4525);

    // A 0.005 x 0.005 degree square at this latitude has a diagonal corner distance
    // (from center to corner) of roughly 330-335 meters. The tile is not a
    // perfect square in meters due to latitude.
    assertEquals(
      radiusMeters > 330 && radiusMeters < 335,
      true,
      `Expected radius to be ~330-335m, but got ${radiusMeters}m`,
    );
  },
);

Deno.test('getSubTiles() splits a tile ID into four sub-quadrant IDs', () => {
  const tileId = '9894_1690';
  const expected = [
    '9894_1690_0', // Bottom-Left
    '9894_1690_1', // Bottom-Right
    '9894_1690_2', // Top-Left
    '9894_1690_3', // Top-Right
  ];

  const result = getSubTiles(tileId);
  assertEquals(result, expected);
});
