import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreenView from './src/screens/SplashScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider } from './src/context/AppDataContext';
import { TranslationProvider } from './src/context/TranslationContext';
import { logWarning } from './src/utils/logger';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

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
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        logWarning('Splash prepare error:', error?.message);
      } finally {
        setAppIsReady(true);
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
          <AppDataProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </AppDataProvider>
        </TranslationProvider>
      </AuthProvider>
    </View>
  );
}
