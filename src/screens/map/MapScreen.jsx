import { getMockRestaurants } from '../../services/supabase';
import { useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getMockRestaurants();

      setRestaurants(data);
      setIsLoading(false);
    }

    loadData();
  }, []);

  if (isLoading) {
    return <Text>Loading mock data from Supabase...</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text>
            {item.name} - {item.cuisine}
          </Text>
        )}
      />
    </View>
  );
}
