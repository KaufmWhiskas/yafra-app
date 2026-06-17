export type FilterGroup =
  | "Asian"
  | "European"
  | "Americas"
  | "Middle Eastern & African"
  | "Pizza & Italian"
  | "Breakfast & Cafe"
  | "Bars & Pubs"
  | "Snacks & Sweets"
  | "Specialty & Dietary"
  | "Fast Food"
  | "All";

export interface RestaurantCategory {
  displayName: string;
  filterGroups: FilterGroup[];
  isFallbackOnly: boolean;
}

export const CATEGORY_MAP: Record<string, RestaurantCategory> = {
  acai_shop: {
    displayName: "Acai Shop",
    filterGroups: ["Snacks & Sweets", "Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  afghani_restaurant: {
    displayName: "Afghani",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  african_restaurant: {
    displayName: "African",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  american_restaurant: {
    displayName: "American",
    filterGroups: ["Americas", "Fast Food"],
    isFallbackOnly: false,
  },
  argentinian_restaurant: {
    displayName: "Argentinian",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  asian_fusion_restaurant: {
    displayName: "Asian Fusion",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  asian_restaurant: {
    displayName: "Asian",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  australian_restaurant: {
    displayName: "Australian",
    filterGroups: ["All"],
    isFallbackOnly: false,
  },
  austrian_restaurant: {
    displayName: "Austrian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  bagel_shop: {
    displayName: "Bagel Shop",
    filterGroups: ["Breakfast & Cafe", "Fast Food"],
    isFallbackOnly: false,
  },
  bakery: {
    displayName: "Bakery",
    filterGroups: ["Breakfast & Cafe", "Snacks & Sweets"],
    isFallbackOnly: false,
  },
  bangladeshi_restaurant: {
    displayName: "Bangladeshi",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  bar: {
    displayName: "Bar",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  bar_and_grill: {
    displayName: "Bar and Grill",
    filterGroups: ["Bars & Pubs", "Americas"],
    isFallbackOnly: false,
  },
  barbecue_restaurant: {
    displayName: "Barbecue",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  basque_restaurant: {
    displayName: "Basque",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  bavarian_restaurant: {
    displayName: "Bavarian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  beer_garden: {
    displayName: "Beer Garden",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  belgian_restaurant: {
    displayName: "Belgian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  bistro: {
    displayName: "Bistro",
    filterGroups: ["European", "Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  brazilian_restaurant: {
    displayName: "Brazilian",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  breakfast_restaurant: {
    displayName: "Breakfast",
    filterGroups: ["Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  brewery: {
    displayName: "Brewery",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  brewpub: {
    displayName: "Brewpub",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  british_restaurant: {
    displayName: "British",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  brunch_restaurant: {
    displayName: "Brunch",
    filterGroups: ["Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  buffet_restaurant: {
    displayName: "Buffet",
    filterGroups: ["All"],
    isFallbackOnly: false,
  },
  burmese_restaurant: {
    displayName: "Burmese",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  burrito_restaurant: {
    displayName: "Burrito",
    filterGroups: ["Fast Food", "Americas"],
    isFallbackOnly: false,
  },
  cafe: {
    displayName: "Cafe",
    filterGroups: ["Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  cafeteria: {
    displayName: "Cafeteria",
    filterGroups: ["All"],
    isFallbackOnly: true,
  },
  cajun_restaurant: {
    displayName: "Cajun",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  cake_shop: {
    displayName: "Cake Shop",
    filterGroups: ["Snacks & Sweets", "Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  californian_restaurant: {
    displayName: "Californian",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  cambodian_restaurant: {
    displayName: "Cambodian",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  candy_store: {
    displayName: "Candy Store",
    filterGroups: ["Snacks & Sweets"],
    isFallbackOnly: false,
  },
  cantonese_restaurant: {
    displayName: "Cantonese",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  caribbean_restaurant: {
    displayName: "Caribbean",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  cat_cafe: {
    displayName: "Cat Cafe",
    filterGroups: ["Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  chicken_restaurant: {
    displayName: "Chicken",
    filterGroups: ["Fast Food"],
    isFallbackOnly: false,
  },
  chicken_wings_restaurant: {
    displayName: "Chicken Wings",
    filterGroups: ["Fast Food", "Bars & Pubs"],
    isFallbackOnly: false,
  },
  chilean_restaurant: {
    displayName: "Chilean",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  chinese_noodle_restaurant: {
    displayName: "Chinese Noodle",
    filterGroups: ["Asian", "Fast Food"],
    isFallbackOnly: false,
  },
  chinese_restaurant: {
    displayName: "Chinese",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  chocolate_factory: {
    displayName: "Chocolate Factory",
    filterGroups: ["Snacks & Sweets"],
    isFallbackOnly: false,
  },
  chocolate_shop: {
    displayName: "Chocolate Shop",
    filterGroups: ["Snacks & Sweets"],
    isFallbackOnly: false,
  },
  cocktail_bar: {
    displayName: "Cocktail Bar",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  coffee_roastery: {
    displayName: "Coffee Roastery",
    filterGroups: ["Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  coffee_shop: {
    displayName: "Coffee Shop",
    filterGroups: ["Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  coffee_stand: {
    displayName: "Coffee Stand",
    filterGroups: ["Breakfast & Cafe", "Fast Food"],
    isFallbackOnly: false,
  },
  colombian_restaurant: {
    displayName: "Colombian",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  confectionery: {
    displayName: "Confectionery",
    filterGroups: ["Snacks & Sweets"],
    isFallbackOnly: false,
  },
  croatian_restaurant: {
    displayName: "Croatian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  cuban_restaurant: {
    displayName: "Cuban",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  czech_restaurant: {
    displayName: "Czech",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  danish_restaurant: {
    displayName: "Danish",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  deli: {
    displayName: "Deli",
    filterGroups: ["Fast Food", "Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  dessert_restaurant: {
    displayName: "Dessert",
    filterGroups: ["Snacks & Sweets"],
    isFallbackOnly: false,
  },
  dessert_shop: {
    displayName: "Dessert Shop",
    filterGroups: ["Snacks & Sweets"],
    isFallbackOnly: false,
  },
  dim_sum_restaurant: {
    displayName: "Dim Sum",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  diner: {
    displayName: "Diner",
    filterGroups: ["Americas", "Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  dog_cafe: {
    displayName: "Dog Cafe",
    filterGroups: ["Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  donut_shop: {
    displayName: "Donut Shop",
    filterGroups: ["Snacks & Sweets", "Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  dumpling_restaurant: {
    displayName: "Dumpling",
    filterGroups: ["Asian", "Fast Food"],
    isFallbackOnly: false,
  },
  dutch_restaurant: {
    displayName: "Dutch",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  eastern_european_restaurant: {
    displayName: "Eastern European",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  ethiopian_restaurant: {
    displayName: "Ethiopian",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  european_restaurant: {
    displayName: "European",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  falafel_restaurant: {
    displayName: "Falafel",
    filterGroups: ["Middle Eastern & African", "Fast Food"],
    isFallbackOnly: false,
  },
  family_restaurant: {
    displayName: "Family",
    filterGroups: ["All"],
    isFallbackOnly: true,
  },
  fast_food_restaurant: {
    displayName: "Fast Food",
    filterGroups: ["Fast Food"],
    isFallbackOnly: true,
  },
  filipino_restaurant: {
    displayName: "Filipino",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  fine_dining_restaurant: {
    displayName: "Fine Dining",
    filterGroups: ["Specialty & Dietary"],
    isFallbackOnly: true,
  },
  fish_and_chips_restaurant: {
    displayName: "Fish and Chips",
    filterGroups: ["Fast Food", "European"],
    isFallbackOnly: false,
  },
  fondue_restaurant: {
    displayName: "Fondue",
    filterGroups: ["European", "Specialty & Dietary"],
    isFallbackOnly: false,
  },
  food_court: {
    displayName: "Food Court",
    filterGroups: ["Fast Food"],
    isFallbackOnly: true,
  },
  french_restaurant: {
    displayName: "French",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  fusion_restaurant: {
    displayName: "Fusion",
    filterGroups: ["All"],
    isFallbackOnly: true,
  },
  gastropub: {
    displayName: "Gastropub",
    filterGroups: ["Bars & Pubs", "European"],
    isFallbackOnly: false,
  },
  german_restaurant: {
    displayName: "German",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  greek_restaurant: {
    displayName: "Greek",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  gyro_restaurant: {
    displayName: "Gyro",
    filterGroups: ["Middle Eastern & African", "Fast Food"],
    isFallbackOnly: false,
  },
  halal_restaurant: {
    displayName: "Halal",
    filterGroups: ["Middle Eastern & African", "Specialty & Dietary"],
    isFallbackOnly: false,
  },
  hamburger_restaurant: {
    displayName: "Hamburger",
    filterGroups: ["Fast Food", "Americas"],
    isFallbackOnly: false,
  },
  hawaiian_restaurant: {
    displayName: "Hawaiian",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  hookah_bar: {
    displayName: "Hookah Bar",
    filterGroups: ["Bars & Pubs", "Middle Eastern & African"],
    isFallbackOnly: false,
  },
  hot_dog_restaurant: {
    displayName: "Hot Dog",
    filterGroups: ["Fast Food", "Americas"],
    isFallbackOnly: false,
  },
  hot_dog_stand: {
    displayName: "Hot Dog Stand",
    filterGroups: ["Fast Food"],
    isFallbackOnly: false,
  },
  hot_pot_restaurant: {
    displayName: "Hot Pot",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  hungarian_restaurant: {
    displayName: "Hungarian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  ice_cream_shop: {
    displayName: "Ice Cream Shop",
    filterGroups: ["Snacks & Sweets"],
    isFallbackOnly: false,
  },
  indian_restaurant: {
    displayName: "Indian",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  indonesian_restaurant: {
    displayName: "Indonesian",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  irish_pub: {
    displayName: "Irish Pub",
    filterGroups: ["Bars & Pubs", "European"],
    isFallbackOnly: false,
  },
  irish_restaurant: {
    displayName: "Irish",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  israeli_restaurant: {
    displayName: "Israeli",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  italian_restaurant: {
    displayName: "Italian",
    filterGroups: ["Pizza & Italian", "European"],
    isFallbackOnly: false,
  },
  japanese_curry_restaurant: {
    displayName: "Japanese Curry",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  japanese_izakaya_restaurant: {
    displayName: "Japanese Izakaya",
    filterGroups: ["Asian", "Bars & Pubs"],
    isFallbackOnly: false,
  },
  japanese_restaurant: {
    displayName: "Japanese",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  juice_shop: {
    displayName: "Juice Shop",
    filterGroups: ["Snacks & Sweets", "Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  kebab_shop: {
    displayName: "Kebab Shop",
    filterGroups: ["Middle Eastern & African", "Fast Food"],
    isFallbackOnly: false,
  },
  korean_barbecue_restaurant: {
    displayName: "Korean Barbecue",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  korean_restaurant: {
    displayName: "Korean",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  latin_american_restaurant: {
    displayName: "Latin American",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  lebanese_restaurant: {
    displayName: "Lebanese",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  lounge_bar: {
    displayName: "Lounge Bar",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  malaysian_restaurant: {
    displayName: "Malaysian",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  meal_delivery: {
    displayName: "Meal Delivery",
    filterGroups: ["All"],
    isFallbackOnly: true,
  },
  meal_takeaway: {
    displayName: "Meal Takeaway",
    filterGroups: ["Fast Food"],
    isFallbackOnly: true,
  },
  mediterranean_restaurant: {
    displayName: "Mediterranean",
    filterGroups: ["European", "Middle Eastern & African"],
    isFallbackOnly: false,
  },
  mexican_restaurant: {
    displayName: "Mexican",
    filterGroups: ["Americas", "Fast Food"],
    isFallbackOnly: false,
  },
  middle_eastern_restaurant: {
    displayName: "Middle Eastern",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  mongolian_barbecue_restaurant: {
    displayName: "Mongolian Barbecue",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  moroccan_restaurant: {
    displayName: "Moroccan",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  noodle_shop: {
    displayName: "Noodle Shop",
    filterGroups: ["Asian", "Fast Food"],
    isFallbackOnly: false,
  },
  north_indian_restaurant: {
    displayName: "North Indian",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  oyster_bar_restaurant: {
    displayName: "Oyster Bar",
    filterGroups: ["Specialty & Dietary", "Bars & Pubs"],
    isFallbackOnly: false,
  },
  pakistani_restaurant: {
    displayName: "Pakistani",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  pastry_shop: {
    displayName: "Pastry Shop",
    filterGroups: ["Snacks & Sweets", "Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  persian_restaurant: {
    displayName: "Persian",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  peruvian_restaurant: {
    displayName: "Peruvian",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  pizza_delivery: {
    displayName: "Pizza Delivery",
    filterGroups: ["Pizza & Italian", "Fast Food"],
    isFallbackOnly: false,
  },
  pizza_restaurant: {
    displayName: "Pizza",
    filterGroups: ["Pizza & Italian", "Fast Food"],
    isFallbackOnly: false,
  },
  polish_restaurant: {
    displayName: "Polish",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  portuguese_restaurant: {
    displayName: "Portuguese",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  pub: {
    displayName: "Pub",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  ramen_restaurant: {
    displayName: "Ramen",
    filterGroups: ["Asian", "Fast Food"],
    isFallbackOnly: false,
  },
  restaurant: {
    displayName: "Restaurant",
    filterGroups: ["All"],
    isFallbackOnly: true,
  },
  romanian_restaurant: {
    displayName: "Romanian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  russian_restaurant: {
    displayName: "Russian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  salad_shop: {
    displayName: "Salad Shop",
    filterGroups: ["Specialty & Dietary", "Fast Food"],
    isFallbackOnly: false,
  },
  sandwich_shop: {
    displayName: "Sandwich Shop",
    filterGroups: ["Fast Food"],
    isFallbackOnly: false,
  },
  scandinavian_restaurant: {
    displayName: "Scandinavian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  seafood_restaurant: {
    displayName: "Seafood",
    filterGroups: ["Specialty & Dietary"],
    isFallbackOnly: false,
  },
  shawarma_restaurant: {
    displayName: "Shawarma",
    filterGroups: ["Middle Eastern & African", "Fast Food"],
    isFallbackOnly: false,
  },
  snack_bar: {
    displayName: "Snack Bar",
    filterGroups: ["Snacks & Sweets", "Fast Food"],
    isFallbackOnly: false,
  },
  soul_food_restaurant: {
    displayName: "Soul Food",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  soup_restaurant: {
    displayName: "Soup",
    filterGroups: ["Specialty & Dietary"],
    isFallbackOnly: false,
  },
  south_american_restaurant: {
    displayName: "South American",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  south_indian_restaurant: {
    displayName: "South Indian",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  southwestern_us_restaurant: {
    displayName: "Southwestern US",
    filterGroups: ["Americas"],
    isFallbackOnly: false,
  },
  spanish_restaurant: {
    displayName: "Spanish",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  sports_bar: {
    displayName: "Sports Bar",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  sri_lankan_restaurant: {
    displayName: "Sri Lankan",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  steak_house: {
    displayName: "Steak House",
    filterGroups: ["Specialty & Dietary", "Americas"],
    isFallbackOnly: false,
  },
  sushi_restaurant: {
    displayName: "Sushi",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  swiss_restaurant: {
    displayName: "Swiss",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  taco_restaurant: {
    displayName: "Taco",
    filterGroups: ["Americas", "Fast Food"],
    isFallbackOnly: false,
  },
  taiwanese_restaurant: {
    displayName: "Taiwanese",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  tapas_restaurant: {
    displayName: "Tapas",
    filterGroups: ["European", "Bars & Pubs"],
    isFallbackOnly: false,
  },
  tea_house: {
    displayName: "Tea House",
    filterGroups: ["Breakfast & Cafe"],
    isFallbackOnly: false,
  },
  tex_mex_restaurant: {
    displayName: "Tex Mex",
    filterGroups: ["Americas", "Fast Food"],
    isFallbackOnly: false,
  },
  thai_restaurant: {
    displayName: "Thai",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  tibetan_restaurant: {
    displayName: "Tibetan",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  tonkatsu_restaurant: {
    displayName: "Tonkatsu",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  turkish_restaurant: {
    displayName: "Turkish",
    filterGroups: ["Middle Eastern & African"],
    isFallbackOnly: false,
  },
  ukrainian_restaurant: {
    displayName: "Ukrainian",
    filterGroups: ["European"],
    isFallbackOnly: false,
  },
  vegan_restaurant: {
    displayName: "Vegan",
    filterGroups: ["Specialty & Dietary"],
    isFallbackOnly: false,
  },
  vegetarian_restaurant: {
    displayName: "Vegetarian",
    filterGroups: ["Specialty & Dietary"],
    isFallbackOnly: false,
  },
  vietnamese_restaurant: {
    displayName: "Vietnamese",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  western_restaurant: {
    displayName: "Western",
    filterGroups: ["European", "Americas"],
    isFallbackOnly: false,
  },
  wine_bar: {
    displayName: "Wine Bar",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  winery: {
    displayName: "Winery",
    filterGroups: ["Bars & Pubs"],
    isFallbackOnly: false,
  },
  yakiniku_restaurant: {
    displayName: "Yakiniku",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
  },
  yakitori_restaurant: {
    displayName: "Yakitori",
    filterGroups: ["Asian"],
    isFallbackOnly: false,
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
  return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
