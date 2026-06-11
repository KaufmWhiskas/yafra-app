import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { fetchRestaurantDetails } from '../../services/restaurantService';
import ReviewSummary from '../../components/ui/ReviewSummary';

type RestaurantDetailRouteProp = RouteProp<
  { RestaurantDetail: { restaurantId: string; restaurantName: string } },
  'RestaurantDetail'
>;

interface RestaurantDetails {
  address?: string;
  rating?: number;
  user_ratings_total?: number;
}

export default function RestaurantDetailScreen() {
  const route = useRoute<RestaurantDetailRouteProp>();
  const { restaurantId, restaurantName } = route.params;
  const [details, setDetails] = useState<RestaurantDetails | null>(null);

  useEffect(() => {
    fetchRestaurantDetails(restaurantId).then(setDetails).catch(console.error);
  }, [restaurantId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{restaurantName}</Text>

      {details && (
        <View>
          <Text style={styles.address}>
            {details.address || 'Address not available'}
          </Text>
          <ReviewSummary
            rating={details.rating}
            reviewCount={details.user_ratings_total}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    marginBottom: 16,
  },
});
