import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { places } from '../data/places';
import { cities } from '../data/cities';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const categories = [
    { id: 'restaurants', label: 'Restaurants', emoji: '🍽️', subtitle: 'Top-rated places' },
    { id: 'cafes', label: 'Cafés', emoji: '☕', subtitle: 'Relaxed spots' },
    { id: 'bars', label: 'Bars', emoji: '🍸', subtitle: 'Drinks & nightlife' },
    { id: 'hotels', label: 'Hotels', emoji: '🏨', subtitle: 'Stay in comfort' },
    { id: 'beaches', label: 'Beaches', emoji: '🏖️', subtitle: 'Scenic views' },
    { id: 'mosques', label: 'Mosques', emoji: '🕌', subtitle: 'Religious sites' },
    { id: 'churches', label: 'Churches', emoji: '⛪', subtitle: 'Historical' },
    { id: 'historical', label: 'Historical Sites', emoji: '📚', subtitle: 'Ancient places' },
    { id: 'hiddengems', label: 'Hidden Gems', emoji: '💎', subtitle: 'Exclusive' },
    { id: 'museums', label: 'Museums', emoji: '🏛️', subtitle: 'History & Culture' },
    { id: 'bunkers', label: 'Bunkers', emoji: '🪖', subtitle: 'Find all Bunkers' },
    { id: 'adventures', label: 'Adventures', emoji: '🚤🗻', subtitle: 'Out and About having Fun' },
    { id: 'governmentservices', label: 'Government Services', emoji: '🏦', subtitle: 'Offices, Police, Embassies & more' },
    
  ];

  const getCityName = (cityId) => {
    return cities.find((city) => city.id === cityId)?.name || 'Unknown City';
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

  const handleSearch = () => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return;
    }

    const filteredPlaces = places
      .filter((place) => {
        const cityName = getCityName(place.cityId).toLowerCase();
        const placeName = place.name?.toLowerCase() || '';
        const categoryId = place.categoryId?.toLowerCase() || '';
        const categoryLabel = getCategoryLabel(place.categoryId).toLowerCase();

        return (
          placeName.includes(query) ||
          cityName.includes(query) ||
          categoryId.includes(query) ||
          categoryLabel.includes(query)
        );
      })
      .sort((a, b) => Number(b.rating) - Number(a.rating));

    setSearchResults(filteredPlaces);
    setHasSearched(true);
    setSearchQuery('');
  };

  const handleCategoryPress = (categoryId) => {
    const filteredPlaces = places
      .filter((place) => place.categoryId === categoryId)
      .sort((a, b) => Number(b.rating) - Number(a.rating));

    setSearchResults(filteredPlaces);
    setHasSearched(true);
    setSearchQuery('');
  };

  const clearSearchResults = () => {
    setSearchResults([]);
    setHasSearched(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Dritë Guide</Text>
              <Text style={styles.subtitle}>Discover Albania with ease</Text>
            </View>

            <Image
              source={require('../../assets/logo.jpeg')}
              style={styles.headerLogo}
              resizeMode="cover"
            />
          </View>

          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities, restaurants, cafés, bars..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchButton}
              activeOpacity={0.85}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          {hasSearched ? (
            <View style={styles.section}>
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.sectionTitle}>Search results</Text>

                <TouchableOpacity onPress={clearSearchResults} activeOpacity={0.8}>
                  <Text style={styles.clearResultsText}>Clear</Text>
                </TouchableOpacity>
              </View>

              {searchResults.length > 0 ? (
                <View>
                  {searchResults.map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.resultCard}
                      activeOpacity={0.85}
                      onPress={() =>
                        navigation.navigate('PlaceDetail', {
                          placeId: place.id,
                        })
                      }
                    >
                      <View style={styles.resultTopRow}>
                        <View style={styles.resultTextWrap}>
                          <Text style={styles.resultTitle}>{place.name}</Text>
                          <Text style={styles.resultSubtitle}>
                            {getCategoryLabel(place.categoryId)} • {getCityName(place.cityId)}
                          </Text>
                        </View>

                        <View style={styles.ratingBadge}>
                          <Text style={styles.ratingText}>★ {place.rating}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noResultsCard}>
                  <Text style={styles.noResultsText}>No results found</Text>
                </View>
              )}
            </View>
          ) : (
            <>
              <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Find the best places in Albania</Text>
                <Text style={styles.heroText}>
                  Explore Cities, Villages, Restaurants, Cafés, Bars, Clubs and Hidden
                  Gems in one clean experience.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular categories</Text>

                <View style={styles.categoryGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryCard}
                      activeOpacity={0.85}
                      onPress={() => handleCategoryPress(category.id)}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={styles.categoryTitle}>{category.label}</Text>
                      <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.gray,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.gray,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 20,
  },

  headerTextWrap: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.black,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },

  headerLogo: {
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: colors.white,
  },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  searchInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222222',
  },

  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 14,
  },

  searchButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },

  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    marginTop: 22,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
    lineHeight: 34,
  },

  heroText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#6B7280',
  },

  section: {
    marginTop: 28,
  },

  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 14,
  },

  clearResultsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },

  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  resultTextWrap: {
    flex: 1,
    marginRight: 12,
  },

  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },

  resultSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },

  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },

  noResultsCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  categoryCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  categoryEmoji: {
    fontSize: 24,
    marginBottom: 10,
  },

  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 4,
  },

  categorySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
});