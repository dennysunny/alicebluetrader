import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useIsAuthenticated } from '../store/authStore';
import { useUnreadCount } from '../store/notificationStore';

import { LoginScreen } from '../screens/Auth/LoginScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { MarketWatchScreen } from '../screens/MarketWatch/MarketWatchScreen';
import { OrdersScreen } from '../screens/Orders/OrdersScreen';
import { PortfolioScreen } from '../screens/Portfolio/PortfolioScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { OrderEntryScreen } from '../screens/Trading/OrderEntryScreen';
import { OrderConfirmScreen } from '../screens/Trading/OrderConfirmScreen';
import { OrderSuccessScreen } from '../screens/Trading/OrderSuccessScreen';
import { InstrumentDetailScreen } from '../screens/Charts/InstrumentDetailScreen';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

const TAB_CONFIG = [
  { name: 'Dashboard', icon: '⚖️', label: 'Summary' },
  { name: 'MarketWatch', icon: '📑', label: 'Watchlist' },
  { name: 'Orders', icon: '🛒', label: 'Orders' },
  { name: 'Portfolio', icon: '💼', label: 'Portfolio' },
  { name: 'Settings', icon: '☰', label: 'More' },
];

function CustomTabBar({ state, navigation }: { state: { routes: { key: string; name: string }[]; index: number }; navigation: { emit: Function; navigate: Function } }) {
  const { colors, typography } = useTheme();
  const unreadCount = useUnreadCount();

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.tabBar, borderTopColor: colors.border }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG.find((t) => t.name === route.name);
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <TouchableOpacity key={route.key} onPress={onPress} style={styles.tabItem}>
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 20, color: isFocused ? colors.primary : colors.textMuted }}>{config?.icon}</Text>
              {route.name === 'Settings' && unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.loss }]}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: isFocused ? colors.primary : colors.textMuted, fontSize: typography.xs, marginTop: 2, fontWeight: isFocused ? '600' : '400' }}>
              {config?.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator tabBar={(props) => <CustomTabBar {...(props as Parameters<typeof CustomTabBar>[0])} />} screenOptions={{ headerShown: false }}>
      <MainTab.Screen name="Dashboard" component={DashboardScreen} />
      <MainTab.Screen name="MarketWatch" component={MarketWatchScreen} />
      <MainTab.Screen name="Orders" component={OrdersScreen} />
      <MainTab.Screen name="Portfolio" component={PortfolioScreen} />
      <MainTab.Screen name="Settings" component={SettingsScreen} />
    </MainTab.Navigator>
  );
}

export function RootNavigator() {
  const isAuthenticated = useIsAuthenticated();
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <RootStack.Screen name="Main" component={MainNavigator} />
          <RootStack.Screen name="OrderEntry" component={OrderEntryScreen} options={{ presentation: 'modal' }} />
          <RootStack.Screen name="OrderConfirm" component={OrderConfirmScreen} options={{ presentation: 'modal' }} />
          <RootStack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ presentation: 'modal' }} />
          <RootStack.Screen name="InstrumentDetail" component={InstrumentDetailScreen} />
          <RootStack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 22, paddingTop: 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -6, minWidth: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
});
