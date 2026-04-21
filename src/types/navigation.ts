import { Restaurant } from './index';

export type RootStackParamList = {
  MainTabs: undefined;
  ReviewScreen: { restaurant: Restaurant };
  Login: undefined;
};

export type TabParamList = {
  Map: undefined;
  Groups: undefined;
  Profile: undefined;
};
