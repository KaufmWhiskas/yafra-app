import { getCategoryDisplayName, getCategoryIcon } from '../categories';

describe('Categories Utilities', () => {
  describe('getCategoryDisplayName', () => {
    it('returns the mapped display name for a known key', () => {
      expect(getCategoryDisplayName('pizza_restaurant')).toBe('Pizza');
    });

    it('formats unknown keys into title case strings', () => {
      expect(getCategoryDisplayName('space_alien_cafe')).toBe(
        'Space Alien Cafe',
      );
    });

    it('handles empty strings gracefully', () => {
      expect(getCategoryDisplayName('')).toBe('');
    });
  });

  describe('getCategoryIcon', () => {
    it('returns the specific icon for a mapped category', () => {
      expect(getCategoryIcon('coffee_shop')).toBe('coffee');
    });

    it('returns a fallback food icon for completely unknown categories', () => {
      expect(getCategoryIcon('unknown_weird_food_place')).toBe('utensils');
    });

    it('returns a fallback food icon for empty strings', () => {
      expect(getCategoryIcon('')).toBe('utensils');
    });
  });
});
