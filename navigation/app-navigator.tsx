import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { LoginScreen } from '@/screens/login-screen';
import { RegisterScreen } from '@/screens/register-screen';
import { HomeScreen } from '@/screens/home-screen';
import { ChildDetailScreen } from '@/screens/child-detail-screen';
import { RewardsSettingScreen } from '@/screens/rewards-setting-screen';
import { borderRadius } from '@/constants/theme';

const Tab = createBottomTabNavigator();

const AuthStack: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return <LoginScreen onNavigateToRegister={() => setIsLogin(false)} />;
  }

  return <RegisterScreen onNavigateToLogin={() => setIsLogin(true)} />;
};

const MainTabs: React.FC<{ onNavigateToChild: (childId: string) => void }> = ({
  onNavigateToChild,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          height: 85,
          paddingBottom: 20,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={[
              StyleSheet.absoluteFill,
              {
                borderTopLeftRadius: borderRadius.xl,
                borderTopRightRadius: borderRadius.xl,
                overflow: 'hidden',
                backgroundColor: colors.tabBar,
              },
            ]}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.tabIcon,
                focused && { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      >
        {() => <HomeScreen onNavigateToChild={onNavigateToChild} />}
      </Tab.Screen>
      <Tab.Screen
        name="RewardsSetting"
        component={RewardsSettingScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.tabIcon,
                focused && { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (selectedChildId) {
    return (
      <ChildDetailScreen
        childId={selectedChildId}
        onGoBack={() => setSelectedChildId(null)}
      />
    );
  }

  return <MainTabs onNavigateToChild={(id) => setSelectedChildId(id)} />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
