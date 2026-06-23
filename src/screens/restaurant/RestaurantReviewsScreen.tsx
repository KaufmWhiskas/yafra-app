import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { useRestaurantReviews } from '../../hooks/useRestaurantReviews';
import FeedCard from '../../components/groups/FeedCard';
import { COLORS, SIZES } from '../../constants/theme';
import { GroupFeedReview } from '../../types';

type RestaurantReviewsScreenRouteProp = RouteProp<
  RootStackParamList,
  'RestaurantReviews'
>;

export default function RestaurantReviewsScreen() {
  const route = useRoute<RestaurantReviewsScreenRouteProp>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { restaurantId, restaurantName } = route.params;
  const insets = useSafeAreaInsets();

  const { reviews, isLoading, error, reload } =
    useRestaurantReviews(restaurantId);

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: `Reviews for ${restaurantName}` });
  }, [navigation, restaurantName]);

  if (isLoading && reviews.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          testID="activity-indicator"
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item: GroupFeedReview) => item.id.toString()}
      renderItem={({ item }) => <FeedCard review={item} />}
      onRefresh={reload}
      refreshing={isLoading}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      ListHeaderComponent={
        <Text style={styles.title}>All Reviews for {restaurantName}</Text>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No reviews found.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.padding,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: SIZES.padding,
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
