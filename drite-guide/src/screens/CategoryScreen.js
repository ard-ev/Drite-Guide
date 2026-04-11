import React from 'react';
import { View, FlatList } from 'react-native';
import { categories } from '../data/categories';
import CategoryCard from '../components/CategoryCard';

export default function CategoryScreen({ navigation }) {
  return (
    <View>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CategoryCard
            item={item}
            onPress={() =>
              navigation.navigate('Details', { category: item })
            }
          />
        )}
      />
    </View>
  );
}