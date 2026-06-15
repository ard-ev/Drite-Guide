import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreenView from './src/screens/SplashScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider } from './src/context/AppDataContext';
import { TranslationProvider } from './src/context/TranslationContext';
import { preloadApplicationData } from './src/services/appBootstrapService';
import { logWarning } from './src/utils/logger';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const MINIMUM_SPLASH_DURATION_MS = 3500;

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [bootstrapData, setBootstrapData] = useState(null);

  useEffect(() => {
    const ErrorUtilsRef = global.ErrorUtils;
    const previousHandler = ErrorUtilsRef?.getGlobalHandler?.();

    if (ErrorUtilsRef?.setGlobalHandler && previousHandler) {
      ErrorUtilsRef.setGlobalHandler((error, isFatal) => {
        logWarning('Global app error:', { message: error?.message, isFatal });
        previousHandler(error, isFatal);
      });
    }

    async function prepare() {
      try {
        const minimumSplashDelay = new Promise((resolve) =>
          setTimeout(resolve, MINIMUM_SPLASH_DURATION_MS)
        );
        const [preloadResult] = await Promise.all([
          preloadApplicationData(),
          minimumSplashDelay,
        ]);

        if (preloadResult?.usedCache && preloadResult?.error) {
          logWarning('Using cached app data after preload error:', preloadResult.error?.message);
        }

        setBootstrapData(preloadResult?.data || null);
      } catch (error) {
        logWarning('Splash prepare error:', error?.message);
      } finally {
        setAppIsReady(true);
        ExpoSplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return <SplashScreenView />;
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
