import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logosplash.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Dritë Guide</Text>
      <Text style={styles.subtitle}>Follow your light</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 56,
  },

  logo: {
    width: 260,
    height: 260,
    marginBottom: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '500',
    color: '#FAD4D4',
    textAlign: 'center',
  },
});
