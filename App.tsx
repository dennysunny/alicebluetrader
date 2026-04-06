// Must be first import — patches stores in MOCK_MODE, no-op in production
import '../alicebluetrader/src/services/mockInterceptor';

import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ImageBackground, StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { httpClient } from '../alicebluetrader/src/api/httpClient';
import { ErrorBoundary } from '../alicebluetrader/src/components/common/ErrorBoundary';
import { RootNavigator } from '../alicebluetrader/src/navigation/RootNavigator';
import { priceAlertService } from '../alicebluetrader/src/services/priceAlertService';
import { useAuthStore } from '../alicebluetrader/src/store/authStore';
import { Logger } from '../alicebluetrader/src/utils/logger';
import LinearGradient from 'react-native-linear-gradient';

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
    return <View style={{ flex: 1, backgroundColor: 'transparent' }} />; // Replace with a proper SplashScreen
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <RootNavigator />
    </View>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={{ flex: 1 }}>
            {/* Base gradient */}
            <LinearGradient
              colors={['#040812', '#0A1324', '#02060F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Depth gradient */}
            <LinearGradient
              colors={[
                'rgba(10,132,255,0.08)',
                'transparent',
                'rgba(50,212,164,0.06)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Glow effects */}
            {/* Green glow */}
            <View
              style={{
                position: 'absolute',
                top: -120,
                left: '20%',
                width: 300,
                height: 300,
                borderRadius: 150,
                backgroundColor: 'rgba(50, 212, 164, 0.12)',
              }}
            />

            {/* Blue glow */}
            <View
              style={{
                position: 'absolute',
                bottom: -100,
                right: '10%',
                width: 260,
                height: 260,
                borderRadius: 130,
                backgroundColor: 'rgba(10, 132, 255, 0.10)',
              }}
            />

            {/* App */}
            <NavigationContainer
              theme={{
                dark: false,
                colors: {
                  background: 'transparent',
                  card: 'transparent',
                  text: '#fff',
                  border: 'transparent',
                  notification: 'transparent',
                  primary: '#fff',
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
