import { filterRestaurants } from "../restaurantFilters";
import { Restaurant } from "../../types";

describe("restaurantFilters", () => {
  const mockRestaurants: Restaurant[] = [
    {
      id: "1",
      name: "A",
      cuisine: "italian_restaurant",
      rating: 4.0,
    } as Restaurant,
    {
      id: "2",
      name: "B",
      cuisine: "hamburger_restaurant",
      rating: 3.5,
    } as Restaurant,
    {
      id: "3",
      name: "C",
      cuisine: "pizza_restaurant",
      rating: 4.8,
    } as Restaurant,
    {
      id: "4",
      name: "D",
      cuisine: "sushi_restaurant",
      rating: 4.5,
      app_rating: 4.9,
    } as Restaurant,
  ];

  it("filterRestaurants filters by matching FilterGroup arrays", () => {
    const result = filterRestaurants(mockRestaurants, {
      cuisine: "Pizza & Italian",
    });

    expect(result.length).toBe(2);
    expect(result[0].id).toBe("1");
    expect(result[1].id).toBe("3");
  });

  it("filterRestaurants excludes records with a rating below the minimum threshold", () => {
    const result = filterRestaurants(mockRestaurants, { minRating: 4.5 });

    expect(result.length).toBe(2);
    expect(result[0].id).toBe("3");
    // App rating gets prioritized over native rating based on the logic implementation fallback
    expect(result[1].id).toBe("4");
  });

  it("filterRestaurants returns all records when filters are blank or default", () => {
    const result1 = filterRestaurants(mockRestaurants, {});
    const result2 = filterRestaurants(mockRestaurants, {
      cuisine: null,
      minRating: null,
    });

    expect(result1.length).toBe(4);
    expect(result2.length).toBe(4);
  });

  it("filterRestaurants matches records based on their parent FilterGroup array matching", () => {
    const mockData = [
      { id: "1", name: "Pizzeria", cuisine: "pizza_restaurant" },
      { id: "2", name: "Sushi Stop", cuisine: "sushi_restaurant" },
    ] as Restaurant[];

    // Selecting 'Pizza & Italian' should resolve the pizza_restaurant type via CATEGORY_MAP mapping
    const result = filterRestaurants(mockData, { cuisine: "Pizza & Italian" });

    expect(result.length).toBe(1);
    expect(result[0].id).toBe("1");
  });
});
