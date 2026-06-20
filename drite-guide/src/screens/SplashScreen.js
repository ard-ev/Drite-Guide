import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import colors from '../theme/colors';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: '96%',
    height: '96%',
  },
});
