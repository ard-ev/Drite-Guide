import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function PlaceCard({ place }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{place.name}</Text>
      <Text>{place.location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});