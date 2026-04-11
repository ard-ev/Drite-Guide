import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function CategoryCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.text}>{item.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    padding: 20,
    margin: 10,
    borderRadius: 12
  },
  text: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold'
  }
});