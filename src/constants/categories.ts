// Use the dedicated Lucide package, as it's not part of the main @expo/vector-icons library.
import Lucide from '@react-native-vector-icons/lucide';
import React from 'react';

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

export interface RestaurantCategory {
  displayName: string;
  filterGroups: FilterGroup[];
  isFallbackOnly: boolean;
  // Strictly enforce Lucide icon strings at compile time
  iconName: React.ComponentProps<typeof Lucide>['name'];
}

export const CATEGORY_MAP: Record<string, RestaurantCategory> = {
  acai_shop: {
    displayName: 'Acai Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'soup',
  },
  afghani_restaurant: {
    displayName: 'Afghani',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  african_restaurant: {
    displayName: 'African',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  american_restaurant: {
    displayName: 'American',
    filterGroups: ['Americas', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'beef',
  },
  argentinian_restaurant: {
    displayName: 'Argentinian',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  asian_fusion_restaurant: {
    displayName: 'Asian Fusion',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  asian_restaurant: {
    displayName: 'Asian',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  australian_restaurant: {
    displayName: 'Australian',
    filterGroups: ['All'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  austrian_restaurant: {
    displayName: 'Austrian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  bagel_shop: {
    displayName: 'Bagel Shop',
    filterGroups: ['Breakfast & Cafe', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'croissant',
  },
  bakery: {
    displayName: 'Bakery',
    filterGroups: ['Breakfast & Cafe', 'Snacks & Sweets'],
    isFallbackOnly: false,
    iconName: 'croissant',
  },
  bangladeshi_restaurant: {
    displayName: 'Bangladeshi',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  bar: {
    displayName: 'Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'glass-water',
  },
  bar_and_grill: {
    displayName: 'Bar and Grill',
    filterGroups: ['Bars & Pubs', 'Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  barbecue_restaurant: {
    displayName: 'Barbecue',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  basque_restaurant: {
    displayName: 'Basque',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  bavarian_restaurant: {
    displayName: 'Bavarian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils-crossed',
  },
  beer_garden: {
    displayName: 'Beer Garden',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'beer',
  },
  belgian_restaurant: {
    displayName: 'Belgian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  bistro: {
    displayName: 'Bistro',
    filterGroups: ['European', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  brazilian_restaurant: {
    displayName: 'Brazilian',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  breakfast_restaurant: {
    displayName: 'Breakfast',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'coffee',
  },
  brewery: {
    displayName: 'Brewery',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'beer',
  },
  brewpub: {
    displayName: 'Brewpub',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'beer',
  },
  british_restaurant: {
    displayName: 'British',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  brunch_restaurant: {
    displayName: 'Brunch',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'coffee',
  },
  buffet_restaurant: {
    displayName: 'Buffet',
    filterGroups: ['All'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  burmese_restaurant: {
    displayName: 'Burmese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  burrito_restaurant: {
    displayName: 'Burrito',
    filterGroups: ['Fast Food', 'Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  cafe: {
    displayName: 'Cafe',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'coffee',
  },
  cafeteria: {
    displayName: 'Cafeteria',
    filterGroups: ['All'],
    isFallbackOnly: true,
    iconName: 'utensils',
  },
  cajun_restaurant: {
    displayName: 'Cajun',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  cake_shop: {
    displayName: 'Cake Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'cake',
  },
  californian_restaurant: {
    displayName: 'Californian',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  cambodian_restaurant: {
    displayName: 'Cambodian',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  candy_store: {
    displayName: 'Candy Store',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    iconName: 'candy',
  },
  cantonese_restaurant: {
    displayName: 'Cantonese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  caribbean_restaurant: {
    displayName: 'Caribbean',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  cat_cafe: {
    displayName: 'Cat Cafe',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'cat',
  },
  chicken_restaurant: {
    displayName: 'Chicken',
    filterGroups: ['Fast Food'],
    isFallbackOnly: false,
    iconName: 'drumstick',
  },
  chicken_wings_restaurant: {
    displayName: 'Chicken Wings',
    filterGroups: ['Fast Food', 'Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'drumstick',
  },
  chilean_restaurant: {
    displayName: 'Chilean',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  chinese_noodle_restaurant: {
    displayName: 'Chinese Noodle',
    filterGroups: ['Asian', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  chinese_restaurant: {
    displayName: 'Chinese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  chocolate_factory: {
    displayName: 'Chocolate Factory',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  chocolate_shop: {
    displayName: 'Chocolate Shop',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  cocktail_bar: {
    displayName: 'Cocktail Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'martini',
  },
  coffee_roastery: {
    displayName: 'Coffee Roastery',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'coffee',
  },
  coffee_shop: {
    displayName: 'Coffee Shop',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'coffee',
  },
  coffee_stand: {
    displayName: 'Coffee Stand',
    filterGroups: ['Breakfast & Cafe', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'coffee',
  },
  colombian_restaurant: {
    displayName: 'Colombian',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  confectionery: {
    displayName: 'Confectionery',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  croatian_restaurant: {
    displayName: 'Croatian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  cuban_restaurant: {
    displayName: 'Cuban',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  czech_restaurant: {
    displayName: 'Czech',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  danish_restaurant: {
    displayName: 'Danish',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  deli: {
    displayName: 'Deli',
    filterGroups: ['Fast Food', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'sandwich',
  },
  dessert_restaurant: {
    displayName: 'Dessert',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    iconName: 'ice-cream-2',
  },
  dessert_shop: {
    displayName: 'Dessert Shop',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    iconName: 'ice-cream-2',
  },
  dim_sum_restaurant: {
    displayName: 'Dim Sum',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  diner: {
    displayName: 'Diner',
    filterGroups: ['Americas', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  dog_cafe: {
    displayName: 'Dog Cafe',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'dog',
  },
  donut_shop: {
    displayName: 'Donut Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'donut',
  },
  dumpling_restaurant: {
    displayName: 'Dumpling',
    filterGroups: ['Asian', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  dutch_restaurant: {
    displayName: 'Dutch',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  eastern_european_restaurant: {
    displayName: 'Eastern European',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  ethiopian_restaurant: {
    displayName: 'Ethiopian',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  european_restaurant: {
    displayName: 'European',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  falafel_restaurant: {
    displayName: 'Falafel',
    filterGroups: ['Middle Eastern & African', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  family_restaurant: {
    displayName: 'Family',
    filterGroups: ['All'],
    isFallbackOnly: true,
    iconName: 'utensils',
  },
  fast_food_restaurant: {
    displayName: 'Fast Food',
    filterGroups: ['Fast Food'],
    isFallbackOnly: true,
    iconName: 'utensils',
  },
  filipino_restaurant: {
    displayName: 'Filipino',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  fine_dining_restaurant: {
    displayName: 'Fine Dining',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: true,
    iconName: 'utensils',
  },
  fish_and_chips_restaurant: {
    displayName: 'Fish and Chips',
    filterGroups: ['Fast Food', 'European'],
    isFallbackOnly: false,
    iconName: 'fish',
  },
  fondue_restaurant: {
    displayName: 'Fondue',
    filterGroups: ['European', 'Specialty & Dietary'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  food_court: {
    displayName: 'Food Court',
    filterGroups: ['Fast Food'],
    isFallbackOnly: true,
    iconName: 'store',
  },
  french_restaurant: {
    displayName: 'French',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  fusion_restaurant: {
    displayName: 'Fusion',
    filterGroups: ['All'],
    isFallbackOnly: true,
    iconName: 'utensils',
  },
  gastropub: {
    displayName: 'Gastropub',
    filterGroups: ['Bars & Pubs', 'European'],
    isFallbackOnly: false,
    iconName: 'beer',
  },
  german_restaurant: {
    displayName: 'German',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils-crossed',
  },
  greek_restaurant: {
    displayName: 'Greek',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  gyro_restaurant: {
    displayName: 'Gyro',
    filterGroups: ['Middle Eastern & African', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  halal_restaurant: {
    displayName: 'Halal',
    filterGroups: ['Middle Eastern & African', 'Specialty & Dietary'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  hamburger_restaurant: {
    displayName: 'Hamburger',
    filterGroups: ['Fast Food', 'Americas'],
    isFallbackOnly: false,
    iconName: 'sandwich',
  },
  hawaiian_restaurant: {
    displayName: 'Hawaiian',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  hookah_bar: {
    displayName: 'Hookah Bar',
    filterGroups: ['Bars & Pubs', 'Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  hot_dog_restaurant: {
    displayName: 'Hot Dog',
    filterGroups: ['Fast Food', 'Americas'],
    isFallbackOnly: false,
    iconName: 'utensils-crossed',
  },
  hot_dog_stand: {
    displayName: 'Hot Dog Stand',
    filterGroups: ['Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils-crossed',
  },
  hot_pot_restaurant: {
    displayName: 'Hot Pot',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'soup',
  },
  hungarian_restaurant: {
    displayName: 'Hungarian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  ice_cream_shop: {
    displayName: 'Ice Cream Shop',
    filterGroups: ['Snacks & Sweets'],
    isFallbackOnly: false,
    iconName: 'ice-cream-2',
  },
  indian_restaurant: {
    displayName: 'Indian',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  indonesian_restaurant: {
    displayName: 'Indonesian',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  irish_pub: {
    displayName: 'Irish Pub',
    filterGroups: ['Bars & Pubs', 'European'],
    isFallbackOnly: false,
    iconName: 'beer',
  },
  irish_restaurant: {
    displayName: 'Irish',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  israeli_restaurant: {
    displayName: 'Israeli',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  italian_restaurant: {
    displayName: 'Italian',
    filterGroups: ['Pizza & Italian', 'European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  japanese_curry_restaurant: {
    displayName: 'Japanese Curry',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  japanese_izakaya_restaurant: {
    displayName: 'Japanese Izakaya',
    filterGroups: ['Asian', 'Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  japanese_restaurant: {
    displayName: 'Japanese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  juice_shop: {
    displayName: 'Juice Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'citrus',
  },
  kebab_shop: {
    displayName: 'Kebab Shop',
    filterGroups: ['Middle Eastern & African', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  korean_barbecue_restaurant: {
    displayName: 'Korean Barbecue',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  korean_restaurant: {
    displayName: 'Korean',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  latin_american_restaurant: {
    displayName: 'Latin American',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  lebanese_restaurant: {
    displayName: 'Lebanese',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  lounge_bar: {
    displayName: 'Lounge Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'martini',
  },
  malaysian_restaurant: {
    displayName: 'Malaysian',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  meal_delivery: {
    displayName: 'Meal Delivery',
    filterGroups: ['All'],
    isFallbackOnly: true,
    iconName: 'bike',
  },
  meal_takeaway: {
    displayName: 'Meal Takeaway',
    filterGroups: ['Fast Food'],
    isFallbackOnly: true,
    iconName: 'shopping-bag',
  },
  mediterranean_restaurant: {
    displayName: 'Mediterranean',
    filterGroups: ['European', 'Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  mexican_restaurant: {
    displayName: 'Mexican',
    filterGroups: ['Americas', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  middle_eastern_restaurant: {
    displayName: 'Middle Eastern',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  mongolian_barbecue_restaurant: {
    displayName: 'Mongolian Barbecue',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  moroccan_restaurant: {
    displayName: 'Moroccan',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  noodle_shop: {
    displayName: 'Noodle Shop',
    filterGroups: ['Asian', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  north_indian_restaurant: {
    displayName: 'North Indian',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  oyster_bar_restaurant: {
    displayName: 'Oyster Bar',
    filterGroups: ['Specialty & Dietary', 'Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  pakistani_restaurant: {
    displayName: 'Pakistani',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  pastry_shop: {
    displayName: 'Pastry Shop',
    filterGroups: ['Snacks & Sweets', 'Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'cake',
  },
  persian_restaurant: {
    displayName: 'Persian',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  peruvian_restaurant: {
    displayName: 'Peruvian',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  pizza_delivery: {
    displayName: 'Pizza Delivery',
    filterGroups: ['Pizza & Italian', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'pizza',
  },
  pizza_restaurant: {
    displayName: 'Pizza',
    filterGroups: ['Pizza & Italian', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'pizza',
  },
  polish_restaurant: {
    displayName: 'Polish',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  portuguese_restaurant: {
    displayName: 'Portuguese',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  pub: {
    displayName: 'Pub',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'beer',
  },
  ramen_restaurant: {
    displayName: 'Ramen',
    filterGroups: ['Asian', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'soup',
  },
  restaurant: {
    displayName: 'Restaurant',
    filterGroups: ['All'],
    isFallbackOnly: true,
    iconName: 'utensils',
  },
  romanian_restaurant: {
    displayName: 'Romanian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  russian_restaurant: {
    displayName: 'Russian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  salad_shop: {
    displayName: 'Salad Shop',
    filterGroups: ['Specialty & Dietary', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'salad',
  },
  sandwich_shop: {
    displayName: 'Sandwich Shop',
    filterGroups: ['Fast Food'],
    isFallbackOnly: false,
    iconName: 'sandwich',
  },
  scandinavian_restaurant: {
    displayName: 'Scandinavian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  seafood_restaurant: {
    displayName: 'Seafood',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: false,
    iconName: 'fish',
  },
  shawarma_restaurant: {
    displayName: 'Shawarma',
    filterGroups: ['Middle Eastern & African', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  snack_bar: {
    displayName: 'Snack Bar',
    filterGroups: ['Snacks & Sweets', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'apple',
  },
  soul_food_restaurant: {
    displayName: 'Soul Food',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  soup_restaurant: {
    displayName: 'Soup',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: false,
    iconName: 'soup',
  },
  south_american_restaurant: {
    displayName: 'South American',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  south_indian_restaurant: {
    displayName: 'South Indian',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  southwestern_us_restaurant: {
    displayName: 'Southwestern US',
    filterGroups: ['Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  spanish_restaurant: {
    displayName: 'Spanish',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  sports_bar: {
    displayName: 'Sports Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'trophy',
  },
  sri_lankan_restaurant: {
    displayName: 'Sri Lankan',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  steak_house: {
    displayName: 'Steak House',
    filterGroups: ['Specialty & Dietary', 'Americas'],
    isFallbackOnly: false,
    iconName: 'beef',
  },
  sushi_restaurant: {
    displayName: 'Sushi',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  swiss_restaurant: {
    displayName: 'Swiss',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  taco_restaurant: {
    displayName: 'Taco',
    filterGroups: ['Americas', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  taiwanese_restaurant: {
    displayName: 'Taiwanese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  tapas_restaurant: {
    displayName: 'Tapas',
    filterGroups: ['European', 'Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  tea_house: {
    displayName: 'Tea House',
    filterGroups: ['Breakfast & Cafe'],
    isFallbackOnly: false,
    iconName: 'coffee',
  },
  tex_mex_restaurant: {
    displayName: 'Tex Mex',
    filterGroups: ['Americas', 'Fast Food'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  thai_restaurant: {
    displayName: 'Thai',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  tibetan_restaurant: {
    displayName: 'Tibetan',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  tonkatsu_restaurant: {
    displayName: 'Tonkatsu',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'beef',
  },
  turkish_restaurant: {
    displayName: 'Turkish',
    filterGroups: ['Middle Eastern & African'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  ukrainian_restaurant: {
    displayName: 'Ukrainian',
    filterGroups: ['European'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  vegan_restaurant: {
    displayName: 'Vegan',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: false,
    iconName: 'leaf',
  },
  vegetarian_restaurant: {
    displayName: 'Vegetarian',
    filterGroups: ['Specialty & Dietary'],
    isFallbackOnly: false,
    iconName: 'leaf',
  },
  vietnamese_restaurant: {
    displayName: 'Vietnamese',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  western_restaurant: {
    displayName: 'Western',
    filterGroups: ['European', 'Americas'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  wine_bar: {
    displayName: 'Wine Bar',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'wine',
  },
  winery: {
    displayName: 'Winery',
    filterGroups: ['Bars & Pubs'],
    isFallbackOnly: false,
    iconName: 'wine',
  },
  yakiniku_restaurant: {
    displayName: 'Yakiniku',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'utensils',
  },
  yakitori_restaurant: {
    displayName: 'Yakitori',
    filterGroups: ['Asian'],
    isFallbackOnly: false,
    iconName: 'drumstick',
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

/**
 * Returns the icon name for a given cuisine key.
 * If the key is unknown, it returns a fallback icon.
 * @param cuisineKey The raw string identifier from the database or Google API.
 */
export function getCategoryIcon(
  cuisineKey: string,
): React.ComponentProps<typeof Lucide>['name'] {
  if (!cuisineKey) {
    return 'utensils';
  }
  const category = CATEGORY_MAP[cuisineKey.toLowerCase()];
  return category ? category.iconName : 'utensils';
}
