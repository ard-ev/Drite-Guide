import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';

export default function SearchResultsScreen({ route }) {
  const navigation = useNavigation();
  const initialQuery = route.params?.query || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showDropdown, setShowDropdown] = useState(initialQuery === '');

  // Helper function to normalize text for matching (handles singular/plural)
  const normalizeForSearch = (text) => {
    const normalized = text.toLowerCase().trim();
    // Remove trailing 's' for plural matching
    if (normalized.endsWith('s')) {
      return [normalized, normalized.slice(0, -1)];
    }
    // Add 's' for singular matching
    return [normalized, normalized + 's'];
  };

  const textMatchesQuery = (text, query) => {
    const textVariants = normalizeForSearch(text);
    const queryVariants = normalizeForSearch(query);
    
    // Check if any variant of text matches any variant of query at the start
    return textVariants.some(textVar =>
      queryVariants.some(queryVar => textVar.startsWith(queryVar))
    );
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

  // Get suggestions for dropdown
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    const suggestionSet = new Map();

    // Add matching cities
    cities.forEach(city => {
      if (city.name.toLowerCase().startsWith(query) || city.id.toLowerCase().startsWith(query)) {
        suggestionSet.set(`city-${city.id}`, {
          type: 'city',
          id: city.id,
          name: city.name,
          label: city.name,
          searchValue: city.name,
        });
      }
    });

    // Add matching places - prioritize exact category and name matches
    const categoryMatches = [];
    const nameMatches = [];
    const descriptionMatches = [];

    places.forEach(place => {
      const categoryLabel = getCategoryLabel(place.categoryId).toLowerCase();
      const cityName = cities.find(c => c.id === place.cityId)?.name.toLowerCase() || '';

      // Check if it's a category search using normalized matching
      if (textMatchesQuery(categoryLabel, query)) {
        categoryMatches.push(place);
      } else if (place.name.toLowerCase().startsWith(query)) {
        nameMatches.push(place);
      } else if (place.name.toLowerCase().includes(query) || cityName.includes(query)) {
        descriptionMatches.push(place);
      }
    });

    // Sort categories by rating, then add to suggestions
    categoryMatches.sort((a, b) => b.rating - a.rating);
    categoryMatches.forEach(place => {
      suggestionSet.set(`place-${place.id}`, {
        type: 'place',
        id: place.id,
        name: place.name,
        categoryId: place.categoryId,
        rating: place.rating,
        cityId: place.cityId,
        description: place.description,
      });
    });

    nameMatches.sort((a, b) => b.rating - a.rating);
    nameMatches.forEach(place => {
      suggestionSet.set(`place-${place.id}`, {
        type: 'place',
        id: place.id,
        name: place.name,
        categoryId: place.categoryId,
        rating: place.rating,
        cityId: place.cityId,
        description: place.description,
      });
    });

    descriptionMatches.sort((a, b) => b.rating - a.rating);
    descriptionMatches.forEach(place => {
      suggestionSet.set(`place-${place.id}`, {
        type: 'place',
        id: place.id,
        name: place.name,
        categoryId: place.categoryId,
        rating: place.rating,
        cityId: place.cityId,
        description: place.description,
      });
    });

    return Array.from(suggestionSet.values()).slice(0, 15);
  }, [searchQuery]);

  // Get all results for scrollable display
  const allResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    
    return places.filter(place => {
      const categoryLabel = getCategoryLabel(place.categoryId).toLowerCase();
      const cityName = cities.find(c => c.id === place.cityId)?.name.toLowerCase() || '';
      
      return (
        textMatchesQuery(categoryLabel, query) ||
        place.name.toLowerCase().includes(query) ||
        place.description.toLowerCase().includes(query) ||
        cityName.includes(query)
      );
    }).sort((a, b) => {
      const categoryLabel = getCategoryLabel(a.categoryId).toLowerCase();
      const queryVariants = normalizeForSearch(query);
      
      // Prioritize category matches
      if (textMatchesQuery(categoryLabel, query) && !textMatchesQuery(getCategoryLabel(b.categoryId).toLowerCase(), query)) {
        return -1;
      }
      if (!textMatchesQuery(categoryLabel, query) && textMatchesQuery(getCategoryLabel(b.categoryId).toLowerCase(), query)) {
        return 1;
      }
      
      // Then by rating
      return b.rating - a.rating;
    });
  }, [searchQuery]);

  const handlePlacePress = (place) => {
    Keyboard.dismiss();
    navigation.navigate('PlaceDetail', {
      placeId: place.id,
    });
  };

  const handleCityPress = (city) => {
    Keyboard.dismiss();
    // Show all places in this city
    setSearchQuery(city.name);
  };

  const renderSuggestionItem = ({ item }) => {
    if (item.type === 'city') {
      return (
        <TouchableOpacity
          style={styles.suggestionItem}
          activeOpacity={0.6}
          onPress={() => {
            setSearchQuery(item.name);
            setShowDropdown(false);
          }}
        >
          <Ionicons name="location" size={18} color={colors.primary} />
          <View style={styles.suggestionContent}>
            <Text style={styles.suggestionText}>{item.name}</Text>
            <Text style={styles.suggestionSubtext}>City</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        activeOpacity={0.6}
        onPress={() => {
          handlePlacePress(item);
        }}
      >
        <Text style={styles.suggestionEmoji}>{getCategoryEmoji(item.categoryId)}</Text>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionText}>{item.name}</Text>
          <View style={styles.suggestionMeta}>
            <View style={styles.ratingSmall}>
              <Ionicons name="star" size={12} color="#FCD34D" />
              <Text style={styles.ratingSmallText}>{item.rating}</Text>
            </View>
            <Text style={styles.suggestionSubtext}>
              {getCategoryLabel(item.categoryId)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      activeOpacity={0.7}
      onPress={() => handlePlacePress(item)}
    >
      <Text style={styles.resultEmoji}>{getCategoryEmoji(item.categoryId)}</Text>
      <View style={styles.resultContent}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultCategory}>{getCategoryLabel(item.categoryId)}</Text>
        <Text style={styles.resultCity}>
          {cities.find(c => c.id === item.cityId)?.name}
        </Text>
      </View>
      <View style={styles.resultRating}>
        <Ionicons name="star" size={16} color="#FCD34D" />
        <Text style={styles.resultRatingText}>{item.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search places, cities..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setShowDropdown(true)}
          autoFocus
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Dropdown Suggestions - Only show when focused but no search query yet */}
      {showDropdown && !searchQuery.trim() && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        </View>
      )}

      {/* Search Results Section */}
      {searchQuery.trim() ? (
        <>
          {/* Result Count */}
          {allResults.length > 0 && (
            <Text style={styles.resultsHeader}>
              {allResults.length} {allResults.length === 1 ? 'result' : 'results'}
            </Text>
          )}

          {/* Scrollable Results List */}
          {allResults.length > 0 ? (
            <FlatList
              data={allResults}
              renderItem={renderResultItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={true}
              scrollIndicatorInsets={{ right: 1 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>
                Try searching with different keywords
              </Text>
            </View>
          )}
        </>
      ) : (
        /* Default Suggestions (when search is empty) */
        <ScrollView
          style={styles.defaultSuggestionsContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Popular Cities</Text>
          <View style={styles.citiesGrid}>
            {cities.map(city => (
              <TouchableOpacity
                key={city.id}
                style={styles.cityCard}
                onPress={() => {
                  setSearchQuery(city.name);
                  setShowDropdown(false);
                }}
              >
                <Ionicons name="pin" size={24} color={colors.primary} />
                <Text style={styles.cityCardText}>{city.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Categories</Text>
          <View style={styles.categoriesGrid}>
            {[
              { id: 'beaches', label: 'Beaches', emoji: '🏖️' },
              { id: 'restaurants', label: 'Restaurants', emoji: '🍽️' },
              { id: 'cafes', label: 'Cafés', emoji: '☕' },
              { id: 'bars', label: 'Bars', emoji: '🍸' },
              { id: 'hotels', label: 'Hotels', emoji: '🏨' },
              { id: 'historical', label: 'Historical', emoji: '📚' },
            ].map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => {
                  setSearchQuery(cat.label);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.categoryCardEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryCardText}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 46,
    zIndex: 10,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222222',
  },

  dropdown: {
    position: 'absolute',
    top: 110,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 400,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  suggestionContent: {
    flex: 1,
    marginLeft: 12,
  },

  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  suggestionSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },

  suggestionEmoji: {
    fontSize: 22,
  },

  ratingSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  ratingSmallText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },

  noResultsContainer: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  noResultsText: {
    fontSize: 15,
    color: '#D1D5DB',
  },

  defaultSuggestionsContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  citiesGrid: {
    marginBottom: 20,
  },

  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },

  cityCardText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 10,
  },

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  categoryCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  categoryCardEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },

  categoryCardText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },

  resultsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },

  resultsContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },

  resultEmoji: {
    fontSize: 22,
    marginRight: 12,
  },

  resultContent: {
    flex: 1,
  },

  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 2,
  },

  resultCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },

  resultCity: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  resultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },

  resultRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
