import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { GroupFilterProvider } from './src/context/GroupFilterContext';
import { checkVersionIsSupported } from './src/services/versionService';
import { CURRENT_VERSION, COLORS, SIZES } from './src/constants/theme';
import { initHapticsConfig } from './src/utils/haptics';

function VersionLockView() {
  return (
    <View style={styles.center}>
      <Text style={styles.lockTitle}>Update Required</Text>
      <Text style={styles.lockMessage}>
        A new version of YAFRA is available. Please update your app to continue.
      </Text>
    </View>
  );
}

export default function App() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      const supported = await checkVersionIsSupported(CURRENT_VERSION);
      setIsSupported(supported);
    };

    // Call the explicit initialization function for haptics
    initHapticsConfig();

    checkVersion();
  }, []);

  if (isSupported === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (isSupported === false) {
    return <VersionLockView />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <GroupFilterProvider>
            {
              /* Keep your existing AuthProvider, Navigators, etc. inside here */ <View
                style={styles.container}
              >
                <MainNavigator />
                <StatusBar style="auto" />
              </View>
            }
          </GroupFilterProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding * 2,
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  lockMessage: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
