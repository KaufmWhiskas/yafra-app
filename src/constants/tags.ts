export const TAG_CATEGORIES = {
  DIETARY: ['Vegan Options', 'Vegetarian Options', 'Gluten-Free'],
  // Combined the environmental and vibe profiles cleanly
  ATMOSPHERE: [
    'Hidden Gem',
    'Date Night',
    'Family Friendly',
    'Cozy',
    'Outdoor Seating',
    'Pet Friendly',
    'Crowded',
    'Loud',
  ],
  FOOD_SERVICE: ['Fast Service', 'Slow Service', 'Comfort Food'], // Removed Spicy
};

// Flattened fallback collection to guarantee backward compatibility with existing components
export const DEFAULT_TAGS = [
  ...TAG_CATEGORIES.DIETARY,
  ...TAG_CATEGORIES.ATMOSPHERE,
  ...TAG_CATEGORIES.FOOD_SERVICE,
];
