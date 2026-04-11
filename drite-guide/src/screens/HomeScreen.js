import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo.jpeg')} 
        style={styles.logo} 
      />
      <Text style={styles.title}>Dritë Guide</Text>
      <Text style={styles.subtitle}>
        Discover Albania 🇦🇱
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16
  }
});