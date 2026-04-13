import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';
import { FavoritesContext } from '../context/FavoritesContext';

export default function FavouritesScreen() {
  const navigation = useNavigation();
  const { favorites, toggleFavorite } = useContext(FavoritesContext);

  const favoritesList = places.filter((place) =>
    favorites.includes(place.id)
  );

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
    navigation.navigate('PlaceDetail', { placeId });
  };

  const renderFavoriteItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.favoriteCard}
      activeOpacity={0.7}
      onPress={() => handlePlacePress(item.id)}
    >
      <Text style={styles.cardEmoji}>
        {getCategoryEmoji(item.categoryId)}
      </Text>

      <View style={styles.cardContent}>
        <Text style={styles.cardName}>{item.name}</Text>

        <View style={styles.cardMeta}>
          <Text style={styles.cardCategory}>
            {getCategoryLabel(item.categoryId)}
          </Text>
          <Text style={styles.cardCity}>
            {cities.find((c) => c.id === item.cityId)?.name}
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
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* 🔥 Account-Style Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Favourites</Text>
            <Ionicons name="heart-outline" size={24} color="#222222" />
          </View>

          {favoritesList.length > 0 ? (
            <View style={styles.list}>
              {favoritesList.map(renderFavoriteItem)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Favourites Yet</Text>
              <Text style={styles.emptySubtitle}>
                Save your favorite places by tapping the heart icon when viewing
                details
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // 🔥 IDENTISCH zu Account
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
  },

  list: {
    gap: 12,
  },

  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 20,
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