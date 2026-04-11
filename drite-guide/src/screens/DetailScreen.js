import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DetailScreen({ route }) {
  const { category } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{category.name}</Text>
      <Text>List of places coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10
  }
});