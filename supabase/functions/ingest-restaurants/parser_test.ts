import { assertEquals } from '@std/assert';
import { parseOSMData } from './parser.ts';

Deno.test(
  'parseOSMData() should transform OSM nodes into Restaurant records',
  () => {
    const mockOSMData = {
      elements: [
        {
          type: 'node',
          id: 12345,
          lat: 49.4,
          lon: 8.4,
          tags: {
            name: 'Test Restaurant',
            cuisine: 'italian',
            'addr:street': 'Main St',
            amenity: 'restaurant',
          },
        },
      ],
    } as const;

    const result = parseOSMData(mockOSMData);

    assertEquals(result.length, 1);
    assertEquals(result[0].name, 'Test Restaurant');
    assertEquals(result[0].location, 'POINT(8.4 49.4)');
  },
);

Deno.test('parseOSMData() should deduplicate internal duplicates', () => {
  const duplicateData = {
    elements: [
      {
        type: 'node',
        id: 1,
        lat: 47.3,
        lon: 8.5,
        tags: { name: 'Duplicate', amenity: 'restaurant' },
      },
      {
        type: 'node',
        id: 2,
        lat: 47.3,
        lon: 8.5,
        tags: { name: 'Duplicate', amenity: 'restaurant' },
      },
    ],
  } as const;

  const result = parseOSMData(duplicateData);
  assertEquals(result.length, 1, 'Should filter out internal duplicates');
});
