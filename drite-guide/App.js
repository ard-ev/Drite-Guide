import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreenView from './src/screens/SplashScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider } from './src/context/AppDataContext';

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
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
        <AppDataProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AppDataProvider>
      </AuthProvider>
    </View>
  );
}
