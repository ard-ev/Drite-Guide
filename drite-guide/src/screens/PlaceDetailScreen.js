import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';
import { FavoritesContext } from '../context/FavoritesContext';

export default function PlaceDetailScreen({ route }) {
  const navigation = useNavigation();
  const { placeId } = route.params;
  const place = places.find(p => p.id === placeId);
  const { isFavorited, toggleFavorite } = useContext(FavoritesContext);

  if (!place) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.notFound}>
          <Text>Place not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const city = cities.find(c => c.id === place.cityId);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(placeId)}
        >
          <Ionicons 
            name={isFavorited(placeId) ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isFavorited(placeId) ? '#EF4444' : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Badge & Rating */}
        <View style={styles.topSection}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryEmoji}>{getCategoryEmoji(place.categoryId)}</Text>
            <Text style={styles.categoryLabel}>{getCategoryLabel(place.categoryId)}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={18} color="#FCD34D" />
            <Text style={styles.ratingText}>{place.rating}</Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.placeName}>{place.name}</Text>

        {/* City */}
        <View style={styles.citySection}>
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.cityText}>{city?.name || 'Unknown City'}</Text>
        </View>

        {/* Description Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.description}>{place.description}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoCard, { marginRight: 8 }]}>
            <Ionicons name="star" size={24} color={colors.primary} />
            <Text style={styles.infoLabel}>Rating</Text>
            <Text style={styles.infoValue}>{place.rating}</Text>
          </View>
          <View style={[styles.infoCard, { marginLeft: 8 }]}>
            <Ionicons name="pin" size={24} color={colors.primary} />
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{getCategoryLabel(place.categoryId)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.button, styles.primaryButton]}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
            <Ionicons name="navigate" size={20} color={colors.primary} />
            <Text style={styles.secondaryButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  categoryEmoji: {
    fontSize: 20,
    marginRight: 6,
  },

  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 6,
  },

  placeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 8,
  },

  citySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  cityText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },

  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginTop: 4,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },

  primaryButton: {
    backgroundColor: colors.primary,
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },



  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
