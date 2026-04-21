import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

import TabNavigator from './TabNavigator';
import ReviewScreen from '../screens/review/ReviewScreen';
import LoginScreen from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function MainNavigator() {
  const { session, isLoading } = useAuth();

  //Prevents flickering while Supabase checks session
  if (isLoading) {
    return null; //Loading Screen soon:tm:
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
              name="ReviewScreen"
              component={ReviewScreen}
              options={{ headerShown: true, title: 'Add Review' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
