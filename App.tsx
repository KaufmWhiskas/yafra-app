import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MainNavigator from './src/navigation/MainNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { GroupFilterProvider } from './src/context/GroupFilterContext';
import { getAppVersionConfig } from './src/services/versionService';
import { FriendsProvider } from './src/context/FriendsContext';
import { COLORS, SIZES } from './src/constants/theme';
import { initHapticsConfig } from './src/utils/haptics';

function VersionLockView({ downloadUrl }: { downloadUrl: string | null }) {
  const handleDownload = async () => {
    if (downloadUrl) {
      try {
        const supported = await Linking.canOpenURL(downloadUrl);
        if (supported) {
          await Linking.openURL(downloadUrl);
        } else {
          console.error("Don't know how to open URL: ", downloadUrl);
        }
      } catch (error) {
        console.error('Failed to open download URL:', error);
      }
    }
  };

  return (
    <View style={styles.center}>
      <Text style={styles.lockTitle}>Update Required</Text>
      <Text style={styles.lockMessage}>
        A new version of the app is available. Please update to continue.
      </Text>
      {downloadUrl && (
        <TouchableOpacity style={styles.button} onPress={handleDownload}>
          <Text style={styles.buttonText}>Download Update</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function App() {
  const [versionConfig, setVersionConfig] = useState<{
    isSupported: boolean;
    downloadUrl: string | null;
  } | null>(null);

  useEffect(() => {
    const checkVersion = async () => {
      const config = await getAppVersionConfig();
      setVersionConfig(config);
    };

    // Call the explicit initialization function for haptics
    initHapticsConfig();

    checkVersion();
  }, []);

  if (versionConfig === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (versionConfig.isSupported === false) {
    return <VersionLockView downloadUrl={versionConfig.downloadUrl} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <GroupFilterProvider>
            <FriendsProvider>
              <View style={styles.container}>
                <MainNavigator />
                <StatusBar style="auto" />
              </View>
            </FriendsProvider>
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
  button: {
    marginTop: SIZES.padding * 2,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
