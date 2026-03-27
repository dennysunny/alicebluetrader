// Must be first import — patches stores in MOCK_MODE, no-op in production
import '../alicebluetrader/src/services/mockInterceptor';

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'react-native';
import { RootNavigator } from '../alicebluetrader/src/navigation/RootNavigator';
import { ErrorBoundary } from '../alicebluetrader/src/components/common/ErrorBoundary';
import { useAuthStore } from '../alicebluetrader/src/store/authStore';
import { httpClient } from '../alicebluetrader/src/api/httpClient';
import { priceAlertService } from '../alicebluetrader/src/services/priceAlertService';
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
    return null; // Replace with a proper SplashScreen
  }

  return <RootNavigator />;
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#0A0E14" />
            <AppBootstrap />
            <Toast />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
