// Must be first import — patches stores in MOCK_MODE, no-op in production
import '../alicebluetrader/src/services/mockInterceptor';

import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { httpClient } from '../alicebluetrader/src/api/httpClient';
import { ErrorBoundary } from '../alicebluetrader/src/components/common/ErrorBoundary';
import { RootNavigator } from '../alicebluetrader/src/navigation/RootNavigator';
import { priceAlertService } from '../alicebluetrader/src/services/priceAlertService';
import { useAuthStore } from '../alicebluetrader/src/store/authStore';
import { Logger } from '../alicebluetrader/src/utils/logger';
import { useTheme } from './src/hooks/useTheme';

// ============================================================
// APP BOOTSTRAP
// ============================================================

function AppBootstrap() {
  const { initialize, isInitialized, logout } = useAuthStore();

  useEffect(() => {
    // Wire up the unauthorized handler (session expiry)
    httpClient.setUnauthorizedHandler(() => {
      Logger.warn('Session expired - forcing logout');
      logout();
    });

    // Restore session / initialize app
    initialize();
  }, [initialize, logout]);

  // Start price alert monitoring when session is active
  useEffect(() => {
    const { session } = useAuthStore.getState();
    if (session) {
      priceAlertService.start();
      return () => priceAlertService.stop();
    }
  }, []);

  // Show splash / loading while restoring session
  if (!isInitialized) {
    return <View style={[styles.flex, styles.transparentbg]} />; // Replace with a proper SplashScreen
  }

  return (
    <View style={[styles.flex, styles.transparentbg]}>
      <RootNavigator />
    </View>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  const { colors, isDark } = useTheme();
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <View style={styles.flex}>
            <StatusBar
              barStyle={isDark ? 'light-content' : 'dark-content'}
              translucent
              backgroundColor="transparent"
            />
            {/* Base gradient */}
            <LinearGradient
              colors={[
                colors.backgroundGradientTop,
                colors.background,
                colors.backgroundGradientBottom,
              ]}
              locations={[0, 0.5, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Depth gradient */}
            <LinearGradient
              colors={[colors.primaryMuted, 'transparent']}
              start={{ x: 0.8, y: 0.3 }}
              end={{ x: 0.1, y: 0.8 }}
              style={StyleSheet.absoluteFill}
            />

            {/* App */}
            <NavigationContainer
              theme={{
                dark: false,
                colors: {
                  background: 'transparent',
                  card: 'transparent',
                  text: colors.text,
                  border: 'transparent',
                  notification: 'transparent',
                  primary: colors.primary,
                },
              }}
            >
              <AppBootstrap />
              <Toast position="top" topOffset={60} visibilityTime={3000} />
            </NavigationContainer>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  transparentbg: {
    backgroundColor: 'transparent',
  },
});
