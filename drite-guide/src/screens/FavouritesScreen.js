import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';
import { FavoritesContext } from '../context/FavoritesContext';

export default function FavouritesScreen() {
  const navigation = useNavigation();
  const { favorites, isFavorited, toggleFavorite } = useContext(FavoritesContext);

  const favoritesList = places.filter(place => favorites.includes(place.id));

  const getCategoryEmoji = (categoryId) => {
    const emojiMap = {
      restaurants: '🍽️',
      cafes: '☕',
      bars: '🍸',
      hotels: '🏨',
      beaches: '🏖️',
      historical: '📚',
      hidden_gems: '💎',
      mosques: '🕌',
      churches: '⛪',
    };
    return emojiMap[categoryId] || '📍';
  };

  const getCategoryLabel = (categoryId) => {
    const categoryLabels = {
      restaurants: 'Restaurant',
      cafes: 'Café',
      bars: 'Bar',
      hotels: 'Hotel',
      beaches: 'Beach',
      historical: 'Historical Site',
      hidden_gems: 'Hidden Gem',
      mosques: 'Mosque',
      churches: 'Church',
    };
    return categoryLabels[categoryId] || categoryId;
  };

  const handlePlacePress = (placeId) => {
    navigation.navigate('PlaceDetail', {
      placeId: placeId,
    });
  };

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      activeOpacity={0.7}
      onPress={() => handlePlacePress(item.id)}
    >
      <Text style={styles.cardEmoji}>{getCategoryEmoji(item.categoryId)}</Text>
      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardCategory}>{getCategoryLabel(item.categoryId)}</Text>
          <Text style={styles.cardCity}>
            {cities.find(c => c.id === item.cityId)?.name}
          </Text>
        </View>
        <Text style={styles.cardDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FCD34D" />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => toggleFavorite(item.id)}
        >
          <Ionicons name="heart" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favourites</Text>
      </View>

      {/* Content */}
      {favoritesList.length > 0 ? (
        <FlatList
          data={favoritesList}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Favourites Yet</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite places by tapping the heart icon when viewing details
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.primary,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  cardEmoji: {
    fontSize: 28,
    marginRight: 12,
  },

  cardContent: {
    flex: 1,
  },

  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },

  cardMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },

  cardCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  cardCity: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  cardRight: {
    alignItems: 'center',
    gap: 8,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },

  rating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  removeButton: {
    padding: 4,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginTop: 16,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});