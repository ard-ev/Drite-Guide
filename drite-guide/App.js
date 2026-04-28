import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreenView from './src/screens/SplashScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider } from './src/context/AppDataContext';
import { TranslationProvider } from './src/context/TranslationContext';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const ErrorUtilsRef = global.ErrorUtils;
    const previousHandler = ErrorUtilsRef?.getGlobalHandler?.();

    if (ErrorUtilsRef?.setGlobalHandler && previousHandler) {
      ErrorUtilsRef.setGlobalHandler((error, isFatal) => {
        console.error('Global app error:', {
          message: error?.message,
          stack: error?.stack,
          isFatal,
        });
        previousHandler(error, isFatal);
      });
    }

    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.log('Splash prepare error:', error);
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
