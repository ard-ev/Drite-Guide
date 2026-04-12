import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';

export default function MapScreen() {
  const navigation = useNavigation();
  const [selectedCity, setSelectedCity] = useState(null);

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

  const handleCityPress = (cityId) => {
    setSelectedCity(selectedCity === cityId ? null : cityId);
  };

  const handlePlacePress = (place) => {
    navigation.navigate('PlaceDetail', {
      placeId: place.id,
    });
  };

  const placesInSelectedCity = selectedCity
    ? places.filter(p => p.cityId === selectedCity)
    : [];

  const renderCityItem = ({ item: city }) => (
    <TouchableOpacity
      style={[
        styles.cityButton,
        selectedCity === city.id && styles.cityButtonActive,
      ]}
      onPress={() => handleCityPress(city.id)}
      activeOpacity={0.7}
    >
      <Text style={styles.cityButtonEmoji}>📍</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.cityButtonText,
            selectedCity === city.id && styles.cityButtonTextActive,
          ]}
        >
          {city.name}
        </Text>
        <Text style={styles.placeCount}>
          {places.filter(p => p.cityId === city.id).length} places
        </Text>
      </View>
      <Ionicons
        name={selectedCity === city.id ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={selectedCity === city.id ? colors.primary : '#9CA3AF'}
      />
    </TouchableOpacity>
  );

  const renderPlaceItem = ({ item: place }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => handlePlacePress(place)}
      activeOpacity={0.7}
    >
      <Text style={styles.placeEmoji}>{getCategoryEmoji(place.categoryId)}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.placeName}>{place.name}</Text>
        <Text style={styles.placeCategory}>{getCategoryLabel(place.categoryId)}</Text>
      </View>
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={14} color="#FCD34D" />
        <Text style={styles.rating}>{place.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore by City</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Advertisement */}
        <View style={styles.mapAdvert}>
          <Ionicons name="map" size={48} color={colors.primary} />
          <Text style={styles.advertTitle}>Explore Albania</Text>
          <Text style={styles.advertSubtext}>
            Browse all cities and their attractions below
          </Text>
        </View>

        {/* Cities List */}
        <FlatList
          data={cities}
          renderItem={renderCityItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          style={styles.citiesList}
        />

        {/* Places in Selected City */}
        {selectedCity && (
          <View style={styles.placesSection}>
            <Text style={styles.placesSectionTitle}>
              Places in{' '}
              <Text style={styles.placesSectionCityName}>
                {cities.find(c => c.id === selectedCity)?.name}
              </Text>
            </Text>

            {placesInSelectedCity.length > 0 ? (
              <FlatList
                data={placesInSelectedCity}
                renderItem={renderPlaceItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                nestedScrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No places found</Text>
              </View>
            )}
          </View>
        )}
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
    backgroundColor: colors.primary,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 30,
  },

  mapAdvert: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
  },

  advertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 6,
  },

  advertSubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  citiesList: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#E5E7EB',
  },

  cityButtonActive: {
    backgroundColor: colors.primary + '10',
    borderLeftColor: colors.primary,
  },

  cityButtonEmoji: {
    fontSize: 20,
    marginRight: 12,
  },

  cityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
  },

  cityButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  placeCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  placesSection: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 6,
  },

  placesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 10,
  },

  placesSectionCityName: {
    color: colors.primary,
  },

  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  placeEmoji: {
    fontSize: 20,
    marginRight: 12,
  },

  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
  },

  placeCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
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

  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
