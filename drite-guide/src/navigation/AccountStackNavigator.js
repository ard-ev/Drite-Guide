import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AccountScreen from '../screens/AccountScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import LanguageSettingScreen from '../screens/LanguageSettingScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import CookiePolicyScreen from '../screens/CookiePolicyScreen';
import LegalNoticeScreen from '../screens/LegalNoticeScreen';

const Stack = createNativeStackNavigator();

export default function AccountStackNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
            }}
        >
            <Stack.Screen name="AccountMain" component={AccountScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen
                name="LanguageSettings"
                component={LanguageSettingScreen}
            />
            <Stack.Screen
                name="NotificationsSettings"
                component={NotificationSettingsScreen}
            />
            <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
            />
            <Stack.Screen
                name="TermsConditions"
                component={TermsConditionsScreen}
            />
            <Stack.Screen
                name="CookiePolicy"
                component={CookiePolicyScreen}
            />
            <Stack.Screen
                name="LegalNotice"
                component={LegalNoticeScreen}
            />
        </Stack.Navigator>
    );
}