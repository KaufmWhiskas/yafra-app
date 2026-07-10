// Use the dedicated Lucide package, as it's not part of the main @expo/vector-icons library.
import React from 'react';
import Lucide from '@react-native-vector-icons/lucide';
import {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5,
  FontAwesome6,
} from '@expo/vector-icons';

export type FilterGroup =
  | 'Asian'
  | 'European'
  | 'Americas'
  | 'Middle Eastern & African'
  | 'Pizza & Italian'
  | 'Breakfast & Cafe'
  | 'Bars & Pubs'
  | 'Snacks & Sweets'
  | 'Specialty & Dietary'
  | 'Fast Food'
  | 'All';

// Discriminated union for strict cross-library compiler checking
export type CategoryIconConfig =
  | { provider: 'Lucide'; name: React.ComponentProps<typeof Lucide>['name'] }
  | {
      provider: 'MaterialCommunityIcons';
      name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    }
  | {
      provider: 'MaterialIcons';
      name: React.ComponentProps<typeof MaterialIcons>['name'];
    }
  | {
      provider: 'FontAwesome5';
      name: React.ComponentProps<typeof FontAwesome5>['name'];
    }
  | {
      provider: 'FontAwesome6';
      name: React.ComponentProps<typeof FontAwesome6>['name'];
    };

export interface RestaurantCategory {
  displayName: string;
  filterGroups: FilterGroup[];
  isFallbackOnly: boolean;
  icon: CategoryIconConfig;
}

export const CATEGORY_MAP: Record<string, RestaurantCategory> = {
  acai_shop: {
    displayName: 'Acai Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'bowl-mix' },
  },
  afghani_restaurant: {
    displayName: 'Afghani',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'kebab-dining' },
  },
  african_restaurant: {
    displayName: 'African',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'food-variant' },
  },
  american_restaurant: {
    displayName: 'American',
    filterGroups: ['Americas', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'hamburger' },
  },
  argentinian_restaurant: {
    displayName: 'Argentinian',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'grill' },
  },
  asian_fusion_restaurant: {
    displayName: 'Asian Fusion',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'rice-bowl' },
  },
  asian_restaurant: {
    displayName: 'Asian',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'rice-bowl' },
  },
  bagel_shop: {
    displayName: 'Bagel Shop',
    filterGroups: ['Breakfast & Cafe', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'sandwich' },
  },
  bakery: {
    displayName: 'Bakery',
    filterGroups: ['Breakfast & Cafe', 'Snacks & Sweets'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'croissant' },
  },
  bar: {
    displayName: 'Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'glass-cocktail' },
  },
  bar_and_grill: {
    displayName: 'Bar and Grill',
    filterGroups: ['Bars & Pubs', 'Americas'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'outdoor-grill' },
  },
  barbecue_restaurant: {
    displayName: 'Barbecue',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'outdoor-grill' },
  },
  bistro: {
    displayName: 'Bistro',
    filterGroups: ['European', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'glass-wine' },
  },
  breakfast_restaurant: {
    displayName: 'Breakfast',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'coffee' },
  },
  brewery: {
    displayName: 'Brewery',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'beer' },
  },
  brewpub: {
    displayName: 'Brewpub',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'beer' },
  },
  cake_shop: {
    displayName: 'Cake Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'cake-slice' },
  },
  cantonese_restaurant: {
    displayName: 'Cantonese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'rice-bowl' },
  },
  cat_cafe: {
    displayName: 'Cat Cafe',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'cat' },
  },
  chicken_restaurant: {
    displayName: 'Chicken',
    filterGroups: ['Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'food-drumstick' },
  },
  chicken_wings_restaurant: {
    displayName: 'Chicken Wings',
    filterGroups: ['Fast Food', 'Bars & Pubs'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'food-drumstick' },
  },
  chinese_noodle_restaurant: {
    displayName: 'Chinese Noodle',
    filterGroups: ['Asian', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'ramen-dining' },
  },
  chinese_restaurant: {
    displayName: 'Chinese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'rice-bowl' },
  },
  coffee_shop: {
    displayName: 'Coffee Shop',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'coffee' },
  },
  deli: {
    displayName: 'Deli',
    filterGroups: ['Fast Food', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'sandwich' },
  },
  dessert_restaurant: {
    displayName: 'Dessert',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'dessert' },
  },
  dessert_shop: {
    displayName: 'Dessert Shop',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'dessert' },
  },
  donut_shop: {
    displayName: 'Donut Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'donut' },
  },
  dutch_restaurant: {
    displayName: 'Dutch',
    filterGroups: ['European'],
    isFallbackOnly: false,
    icon: { provider: 'FontAwesome6', name: 'stroopwafel' },
  },
  fast_food_restaurant: {
    displayName: 'Fast Food',
    filterGroups: ['Fast Food'],
    isFallbackOnly: true,
    icon: { provider: 'MaterialCommunityIcons', name: 'food' },
  },
  fine_dining_restaurant: {
    displayName: 'Fine Dining',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: true,
    icon: { provider: 'Lucide', name: 'star' },
  },
  fish_and_chips_restaurant: {
    displayName: 'Fish and Chips',
    filterGroups: ['Fast Food', 'European'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'fish' },
  },
  food_court: {
    displayName: 'Food Court',
    filterGroups: ['Fast Food'],
    isFallbackOnly: true,
    icon: { provider: 'Lucide', name: 'store' },
  },
  french_restaurant: {
    displayName: 'French',
    filterGroups: ['European'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'snail' },
  },
  gastropub: {
    displayName: 'Gastropub',
    filterGroups: ['Bars & Pubs', 'European'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'beer' },
  },
  german_restaurant: {
    displayName: 'German',
    filterGroups: ['European'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'sausage' },
  },
  greek_restaurant: {
    displayName: 'Greek',
    filterGroups: ['European'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'kebab-dining' },
  },
  gyro_restaurant: {
    displayName: 'Gyro',
    filterGroups: ['Middle Eastern & African', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'kebab-dining' },
  },
  hamburger_restaurant: {
    displayName: 'Hamburger',
    filterGroups: ['Fast Food', 'Americas'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'hamburger' },
  },
  hookah_bar: {
    displayName: 'Hookah Bar',
    filterGroups: ['Bars & Pubs', 'Middle Eastern & African'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'smoking-pipe' },
  },
  hot_dog_restaurant: {
    displayName: 'Hot Dog',
    filterGroups: ['Fast Food', 'Americas'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'food-hot-dog' },
  },
  hot_dog_stand: {
    displayName: 'Hot Dog Stand',
    filterGroups: ['Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'food-hot-dog' },
  },
  hot_pot_restaurant: {
    displayName: 'Hot Pot',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'soup' },
  },
  ice_cream_shop: {
    displayName: 'Ice Cream Shop',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'ice-cream' },
  },
  italian_restaurant: {
    displayName: 'Italian',
    filterGroups: ['Pizza & Italian', 'European'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'pasta' },
  },
  japanese_restaurant: {
    displayName: 'Japanese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'food-variant' },
  },
  juice_shop: {
    displayName: 'Juice Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'citrus' },
  },
  kebab_shop: {
    displayName: 'Kebab Shop',
    filterGroups: ['Middle Eastern & African', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'kebab-dining' },
  },
  korean_barbecue_restaurant: {
    displayName: 'Korean Barbecue',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'outdoor-grill' },
  },
  korean_restaurant: {
    displayName: 'Korean',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'rice-bowl' },
  },
  lounge_bar: {
    displayName: 'Lounge Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'glass-cocktail' },
  },
  mediterranean_restaurant: {
    displayName: 'Mediterranean',
    filterGroups: ['European', 'Middle Eastern & African'],
    isFallbackOnly: false,
    icon: { provider: 'FontAwesome6', name: 'shrimp' },
  },
  mexican_restaurant: {
    displayName: 'Mexican',
    filterGroups: ['Americas', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'taco' },
  },
  pizza_restaurant: {
    displayName: 'Pizza',
    filterGroups: ['Pizza & Italian', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'pizza' },
  },
  pub: {
    displayName: 'Pub',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'beer' },
  },
  ramen_restaurant: {
    displayName: 'Ramen',
    filterGroups: ['Asian', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'ramen-dining' },
  },
  restaurant: {
    displayName: 'Restaurant',
    filterGroups: ['All'],
    isFallbackOnly: true,
    icon: { provider: 'MaterialIcons', name: 'restaurant' },
  },
  salad_shop: {
    displayName: 'Salad Shop',
    filterGroups: ['Specialty & Dietary', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'bowl-mix' },
  },
  sandwich_shop: {
    displayName: 'Sandwich Shop',
    filterGroups: ['Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'sandwich' },
  },
  seafood_restaurant: {
    displayName: 'Seafood',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'fish' },
  },
  soul_food_restaurant: {
    displayName: 'Soul Food',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'food-drumstick' },
  },
  soup_restaurant: {
    displayName: 'Soup',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'soup' },
  },
  sports_bar: {
    displayName: 'Sports Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'trophy' },
  },
  steak_house: {
    displayName: 'Steak House',
    filterGroups: ['Specialty & Dietary', 'Americas'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'food-steak' },
  },
  sushi_restaurant: {
    displayName: 'Sushi',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    icon: { provider: 'Lucide', name: 'fish' },
  },
  taco_restaurant: {
    displayName: 'Taco',
    filterGroups: ['Americas', 'Fast Food'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'taco' },
  },
  tea_house: {
    displayName: 'Tea House',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'tea' },
  },
  turkish_restaurant: {
    displayName: 'Turkish',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialIcons', name: 'kebab-dining' },
  },
  vegan_restaurant: {
    displayName: 'Vegan',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'leaf' },
  },
  vegetarian_restaurant: {
    displayName: 'Vegetarian',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'leaf' },
  },
  wine_bar: {
    displayName: 'Wine Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    icon: { provider: 'MaterialCommunityIcons', name: 'glass-wine' },
  },
};

/**
 * Returns the human-readable display name for a given cuisine key.
 * If the key doesn't exist in the CATEGORY_MAP, it attempts to format the raw key.
 * @param cuisineKey The raw string identifier from the database or Google API.
 */
export function getCategoryDisplayName(cuisineKey: string): string {
  if (!cuisineKey) return '';
  const key = cuisineKey.toLowerCase();
  const category = CATEGORY_MAP[key];
  if (category) {
    return category.displayName;
  }
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Fallback constant configuration
const FALLBACK_ICON: CategoryIconConfig = {
  provider: 'MaterialIcons',
  name: 'restaurant',
};

export function getCategoryIconConfig(cuisineKey: string): CategoryIconConfig {
  if (!cuisineKey) return FALLBACK_ICON;
  const category = CATEGORY_MAP[cuisineKey.toLowerCase()];
  return category ? category.icon : FALLBACK_ICON;
}
