import { resolveRestaurantDisplay } from "../displayState";

jest.mock("../scoreEngine", () => ({
  getScoreColor: jest.fn((score) => `mock-color-${score}`),
}));

describe("resolveRestaurantDisplay", () => {
  it("returns bookmark state and purple color when isBookmarked is true", () => {
    const result = resolveRestaurantDisplay({ app_rating: 4.5 }, true);
    expect(result.type).toBe("bookmark");
    expect(result.color).toBe("#673ab7");
    expect(result.display).toBe("4.5");
    expect(result.isHollow).toBe(false);
  });

  it("returns bookmark icon when bookmarked but completely unrated", () => {
    const result = resolveRestaurantDisplay({}, true);
    expect(result.type).toBe("bookmark");
    expect(result.display).toBe("bookmark-icon");
  });

  it("returns app state and solid gradient color for native app ratings", () => {
    const result = resolveRestaurantDisplay({ app_rating: 4.8 });
    expect(result.type).toBe("app");
    expect(result.color).toBe("mock-color-4.8");
    expect(result.display).toBe("4.8");
    expect(result.isHollow).toBe(false);
  });

  it("returns google state and hollow flag for google rating only", () => {
    const result = resolveRestaurantDisplay({ rating: 4.1 });
    expect(result.type).toBe("google");
    expect(result.color).toBe("mock-color-4.1");
    expect(result.display).toBe("4.1");
    expect(result.isHollow).toBe(true);
  });

  it("returns unrated state and gray color for no ratings", () => {
    const result = resolveRestaurantDisplay({});
    expect(result.type).toBe("unrated");
    expect(result.color).toBe("#808080");
    expect(result.display).toBe("unrated-icon");
    expect(result.isHollow).toBe(false);
  });
});
