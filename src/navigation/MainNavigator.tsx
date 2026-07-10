import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

import TabNavigator from './TabNavigator';
import ReviewScreen from '../screens/review/ReviewScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import GroupFeedScreen from '../screens/groups/GroupFeedScreen';
import GroupRestaurantsScreen from '../screens/groups/GroupRestaurantsScreen';
import WantToVisitScreen from '../screens/profile/WantToVisitScreen';
import CollectionDetailScreen from '../screens/profile/CollectionDetailScreen';
import RestaurantDetailScreen from '../screens/map/RestaurantDetailScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import UserReviewsScreen from '../screens/profile/UserReviewsScreen';
import RestaurantReviewsScreen from '../screens/restaurant/RestaurantReviewsScreen';
import UpdatePasswordScreen from '../screens/profile/UpdatePasswordScreen';
import ProfileOtpScreen from '../screens/profile/ProfileOtpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import AccessibilitySettingsScreen from '../screens/profile/AccessibilitySettingsScreen';
import FriendsHubScreen from '../screens/profile/FriendsHubScreen';

const linkingConfiguration = {
  prefixes: [Linking.createURL('/'), 'yafra://'],
  config: {
    screens: {
      // Maps path indicators cleanly to prevent console warnings on redirects
      Login: 'login',
      Register: 'register',
      UpdatePasswordScreen: 'auth/callback',
      FriendsHubScreen: 'friend/invite',
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function MainNavigator() {
  const { session, isLoading, requiresPasswordReset } = useAuth();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linkingConfiguration}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          requiresPasswordReset ? (
            <Stack.Screen
              name="UpdatePasswordScreen"
              component={UpdatePasswordScreen}
              options={{ headerShown: true, title: 'Update Your Password' }}
            />
          ) : (
            <Stack.Group>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen
                name="ReviewScreen"
                component={ReviewScreen}
                options={{ headerShown: true, title: 'Add Review' }}
              />
              <Stack.Screen
                name="GroupDetailScreen"
                component={GroupDetailScreen}
                options={{ title: 'Group Details' }}
              />
              <Stack.Screen
                name="GroupFeedScreen"
                component={GroupFeedScreen}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="GroupRestaurantsScreen"
                component={GroupRestaurantsScreen}
                options={({ route }) => ({
                  headerShown: true,
                  title: route.params.groupName,
                })}
              />
              <Stack.Screen
                name="WantToVisitScreen"
                component={WantToVisitScreen}
                options={{ title: 'Want to Visit' }}
              />
              <Stack.Screen
                name="CollectionDetailScreen"
                component={CollectionDetailScreen}
                options={({ route }) => ({
                  title: route.params.collectionName,
                })}
              />
              <Stack.Screen
                name="RestaurantDetail"
                component={RestaurantDetailScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="EditProfileScreen"
                component={EditProfileScreen}
                options={{ title: 'Edit Profile' }}
              />
              <Stack.Screen
                name="UserReviewsScreen"
                component={UserReviewsScreen}
                options={{ title: 'My Reviews' }}
              />
              <Stack.Screen
                name="RestaurantReviews"
                component={RestaurantReviewsScreen}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="AccessibilitySettingsScreen"
                component={AccessibilitySettingsScreen}
                options={{ headerShown: true, title: 'Settings' }}
              />
              <Stack.Screen
                name="UpdatePasswordScreen"
                component={UpdatePasswordScreen}
                options={{ headerShown: true, title: 'Update Your Password' }}
              />
              <Stack.Screen
                name="ProfileOtpScreen"
                component={ProfileOtpScreen}
                options={{ headerShown: true, title: 'Verify Code' }}
              />
              <Stack.Screen
                name="FriendsHubScreen"
                component={FriendsHubScreen}
                options={{ headerShown: true, title: 'Social Hub' }}
              />
            </Stack.Group>
          )
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: true, title: 'Reset Password' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
