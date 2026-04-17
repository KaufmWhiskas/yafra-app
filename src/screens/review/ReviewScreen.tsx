import { View, Text } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

export default function ReviewScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'ReviewScreen'>>();
  const { restaurant } = route.params;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Review for {restaurant.name}</Text>
    </View>
  );
}
