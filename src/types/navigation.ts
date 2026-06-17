import { Restaurant } from "./index";

export type RootStackParamList = {
  MainTabs: undefined;
  ReviewScreen: { restaurant: Restaurant };
  Login: undefined;
  Register: undefined;
  GroupDetailScreen: { groupId: string };
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
