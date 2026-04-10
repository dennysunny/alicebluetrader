import { BlurView } from '@react-native-community/blur';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '../hooks/useTheme';
import { useIsAuthenticated } from '../store/authStore';
import { useUnreadCount } from '../store/notificationStore';
import { getColorIntensity } from '../constants/theme';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { InstrumentDetailScreen } from '../screens/Charts/InstrumentDetailScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { MarketWatchScreen } from '../screens/MarketWatch/MarketWatchScreen';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';
import { OrdersScreen } from '../screens/Orders/OrdersScreen';
import { PortfolioScreen } from '../screens/Portfolio/PortfolioScreen';
import { SettingsScreen } from '../screens/Settings/SettingsScreen';
import { OrderConfirmScreen } from '../screens/Trading/OrderConfirmScreen';
import { OrderEntryScreen } from '../screens/Trading/OrderEntryScreen';
import { OrderSuccessScreen } from '../screens/Trading/OrderSuccessScreen';
import { BlurIntensity, RootStackParamList } from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
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
  { name: 'Dashboard',   icon: '⊞',  label: 'Summary'   },
  { name: 'MarketWatch', icon: '☆',  label: 'Watchlist' },
  { name: 'Orders',      icon: '⦿',  label: 'Orders'    },
  { name: 'Portfolio',   icon: '▤',  label: 'Portfolio' },
  { name: 'Settings',    icon: '☰',  label: 'More'      },
];

function CustomTabBar({
  state,
  navigation,
}: {
  state: { routes: { key: string; name: string }[]; index: number };
  navigation: { emit: Function; navigate: Function };
}) {
  const { colors, typography, isDark, shadow, margin, letterSpacing } = useTheme();
  const unreadCount = useUnreadCount();
  // Tint opacity varies by intensity

  return (
    <View style={styles.parentView}>
      {/* Pill container — overflow:hidden clips BlurView to border radius */}
      <View
        style={{
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          ...styles.pillContainer,
          ...shadow.md
        }}
      >
        {/* Layer 1 — real blur */}
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={Platform.OS === 'ios' ? 20 : 4} // iOS supports stronger blur, Android uses a more subtle effect
          reducedTransparencyFallbackColor={colors.fallback}
        />

        {/* Layer 2 — colour tint over blur */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: getColorIntensity(BlurIntensity.Low, isDark),
            },
          ]}
        />

        {/* Layer 3 — tab items above all layers */}
        <View style={styles.tabItemAboveAll}>
          {state.routes.map((route, index) => {
            const config = TAB_CONFIG.find(t => t.name === route.name);
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.75}
                style={styles.tabItem}
              >
                {/* Active capsule highlight */}
                {isFocused && (
                  <View
                    style={{
                      ...styles.activeTabItem,
                      backgroundColor: `${colors.primary}1F`,
                    }}
                  />
                )}

                {/* Icon + badge */}
                <View style={styles.relative}>
                  {/* <Ionicons
                    name={
                      isFocused
                        ? (config?.icon.replace('-outline', '') as any)
                        : (config?.icon as any)
                    }
                    size={22}
                    color={isFocused ? colors.primary : colors.textMuted}
                  /> */}
                  <Text style={{ fontSize: typography.xl, color: isFocused ? colors.primary : colors.textMuted }}>{config?.icon}</Text>

                  {route.name === 'Settings' && unreadCount > 0 && (
                    <View
                      style={[
                        styles.settings,
                        { backgroundColor: colors.loss },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: typography.xxs,
                          fontWeight: typography['700'],
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Label */}
                <Text
                  style={{
                    color: isFocused ? colors.primary : colors.textSecondary,
                    fontSize: typography.xs,
                    marginTop: margin.xs,
                    fontWeight: isFocused
                      ? typography['600']
                      : typography['500'],
                    letterSpacing: letterSpacing.normalWide,
                  }}
                >
                  {config?.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      tabBar={props => (
        <CustomTabBar {...(props as Parameters<typeof CustomTabBar>[0])} />
      )}
      screenOptions={{ headerShown: false }}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
    >
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
          <RootStack.Screen
            name="OrderEntry"
            component={OrderEntryScreen}
            options={{ presentation: 'modal' }}
          />
          <RootStack.Screen
            name="OrderConfirm"
            component={OrderConfirmScreen}
            options={{ presentation: 'modal' }}
          />
          <RootStack.Screen
            name="OrderSuccess"
            component={OrderSuccessScreen}
            options={{ presentation: 'modal' }}
          />
          <RootStack.Screen
            name="InstrumentDetail"
            component={InstrumentDetailScreen}
          />
          <RootStack.Screen
            name="Notifications"
            component={NotificationsScreen}
          />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  parentView: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 18,
  },
    transparentbg: {
    backgroundColor: 'transparent',
  },
  pillContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 50,
  },
  tabItemAboveAll: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  activeTabItem: {
    position: 'absolute',
    width: 80,
    height: 60,
    borderRadius: 50,
  },
  relative: {
    position: 'relative',
  },
  settings: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
});
