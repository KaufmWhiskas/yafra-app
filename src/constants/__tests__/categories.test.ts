import { getCategoryIconConfig } from '../categories';

describe('Cuisine Multi-Icon Provider Mapping', () => {
  it('returns explicit discriminated structures', () => {
    expect(getCategoryIconConfig('hamburger_restaurant')).toEqual({
      provider: 'MaterialCommunityIcons',
      name: 'hamburger',
    });
    expect(getCategoryIconConfig('french_restaurant')).toEqual({
      provider: 'Lucide',
      name: 'snail',
    });
  });
});
