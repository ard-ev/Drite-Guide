import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import HomeStackNavigator from './HomeStackNavigator';
import ExploreStackNavigator from './ExploreStackNavigator';
import SavedStackNavigator from './SavedStackNavigator';
import AccountStackNavigator from './AccountStackNavigator';
import colors from '../theme/colors';
import { useTranslation } from '../context/TranslationContext';

const Tab = createBottomTabNavigator();
const TAB_ROOT_SCREENS = {
  Home: 'HomeMain',
  Explore: 'ExploreMain',
  Saved: 'SavedMain',
  Account: 'AccountMain',
};

export default function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 80,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 6,
          paddingBottom: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 14,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'ellipse-outline';

          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Explore') iconName = 'map-outline';
          if (route.name === 'Saved') iconName = 'bookmark-outline';
          if (route.name === 'Account') iconName = 'person-circle-outline';

          return <Ionicons name={iconName} size={size || 24} color={color} />;
        },
      })}
    >
      {[ 
        ['Home', HomeStackNavigator],
        ['Explore', ExploreStackNavigator],
        ['Saved', SavedStackNavigator],
        ['Account', AccountStackNavigator],
      ].map(([name, component]) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: t(`tabs.${name.toLowerCase()}`),
          }}
          listeners={({ navigation }) => ({
            tabPress: (event) => {
              const state = navigation.getState();
              const isFocused = state.routes[state.index]?.name === name;

              if (!isFocused) {
                return;
              }

              event.preventDefault();

              navigation.dispatch(
                CommonActions.navigate({
                  name,
                  params: {
                    screen: TAB_ROOT_SCREENS[name],
                    params: {
                      refreshKey: Date.now(),
                    },
                  },
                })
              );
            },
          })}
        />
      ))}
    </Tab.Navigator>
  );
}
