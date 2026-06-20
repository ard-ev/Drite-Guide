import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider } from './src/context/AppDataContext';
import { TranslationProvider } from './src/context/TranslationContext';
import {
  preloadApplicationData,
  readCachedApplicationData,
} from './src/services/appBootstrapService';
import { logWarning } from './src/utils/logger';
import AppSplashScreen from './src/screens/SplashScreen';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_DURATION_MS = 1000;

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [bootstrapData, setBootstrapData] = useState(undefined);

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});

    const ErrorUtilsRef = global.ErrorUtils;
    const previousHandler = ErrorUtilsRef?.getGlobalHandler?.();

    if (ErrorUtilsRef?.setGlobalHandler && previousHandler) {
      ErrorUtilsRef.setGlobalHandler((error, isFatal) => {
        logWarning('Global app error:', { message: error?.message, isFatal });
        previousHandler(error, isFatal);
      });
    }

    const readyTimer = setTimeout(() => {
      setAppIsReady(true);
    }, SPLASH_DURATION_MS);

    async function prepareData() {
      try {
        const cachedData = await readCachedApplicationData();

        if (cachedData) {
          setBootstrapData(cachedData);
        }

        const preloadResult = await preloadApplicationData();

        if (preloadResult?.usedCache && preloadResult?.error) {
          logWarning('Using cached app data after preload error:', preloadResult.error?.message);
        }

        setBootstrapData(preloadResult?.data || null);
      } catch (error) {
        logWarning('Splash prepare error:', error?.message);
        setBootstrapData(null);
      }
    }

    prepareData();

    return () => clearTimeout(readyTimer);
  }, []);

  if (!appIsReady) {
    return <AppSplashScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <TranslationProvider>
          <AppDataProvider initialData={bootstrapData}>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AppDataProvider>
        </TranslationProvider>
      </AuthProvider>
    </View>
  );
}
