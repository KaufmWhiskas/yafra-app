import { Restaurant } from "../types";
import { getScoreColor } from "./scoreEngine";

export type DisplayStateType = "bookmark" | "app" | "google" | "unrated";

export interface DisplayState {
  type: DisplayStateType;
  color: string;
  display: string;
  isHollow: boolean;
}

export const BOOKMARK_PURPLE = "#673ab7";
export const UNRATED_GRAY = "#808080";

/**
 * Derives the visual display strategy (color, shape, and text) based on the restaurant's rating and bookmark status.
 */
export function resolveRestaurantDisplay(
  restaurant: Partial<Restaurant>,
  isBookmarked?: boolean,
): DisplayState {
  const appRating = restaurant.app_rating;
  const googleRating = restaurant.rating;

  let display = "";
  if (appRating != null) {
    display = appRating.toFixed(1);
  } else if (googleRating != null) {
    display = googleRating.toFixed(1);
  }

  if (isBookmarked) {
    return {
      type: "bookmark",
      color: BOOKMARK_PURPLE,
      display: display || "bookmark-icon",
      isHollow: false,
    };
  }

  if (appRating != null) {
    return {
      type: "app",
      color: getScoreColor(appRating),
      display,
      isHollow: false,
    };
  }

  if (googleRating != null) {
    return {
      type: "google",
      color: getScoreColor(googleRating),
      display,
      isHollow: true,
    };
  }

  return {
    type: "unrated",
    color: UNRATED_GRAY,
    display: "unrated-icon",
    isHollow: false,
  };
}
