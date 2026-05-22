import React from 'react';
import { View, FlatList } from 'react-native';
import CategoryCard from '../components/CategoryCard';
import { useAppData } from '../context/AppDataContext';

export default function CategoryScreen({ navigation }) {
  const { categories } = useAppData();

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
