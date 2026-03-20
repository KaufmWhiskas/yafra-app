import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import MainNavigator from './src/navigation/MainNavigator';

export default function App() {
  return (
    <View style={styles.container}>
      <MainNavigator />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
