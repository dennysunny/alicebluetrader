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
            <StatusBar
              barStyle="light-content"
              backgroundColor="transparent"
              translucent
            />
            <ImageBackground
              source={require('./src/assets/images/bg.jpg')}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <AppBootstrap />
              <Toast position="top" topOffset={60} visibilityTime={3000} />
            </View>
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
