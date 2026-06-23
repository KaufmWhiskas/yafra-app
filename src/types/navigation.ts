import { Restaurant } from "./index";

export type RootStackParamList = {
  MainTabs: undefined;
  ReviewScreen: {
    restaurant: Restaurant;
    editReviewId?: number | string;
    existingReviewData?: Record<string, unknown>;
  };
  Login: undefined;
  Register: undefined;
  GroupDetailScreen: { groupId: string };
  GroupFeedScreen: { groupId: string; groupName: string };
  WantToVisitScreen: undefined;
  CollectionDetailScreen: { collectionId: string; collectionName: string };
  RestaurantDetail: { restaurantId: string; restaurantName: string };
  EditProfileScreen: undefined;
  UserReviewsScreen: { userId: string };
};

export type TabParamList = {
  Map: undefined;
  Groups: undefined;
  Profile: undefined;
};
