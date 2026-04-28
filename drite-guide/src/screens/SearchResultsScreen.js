import React, { useCallback, useMemo, useState } from 'react';
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

import colors from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { getCategoryLabel } from '../utils/placeMeta';
import { useTranslation } from '../context/TranslationContext';

export default function SearchResultsScreen({ route }) {
  const navigation = useNavigation();
  const { places, cities } = useAppData();
  const { t, tc, language } = useTranslation();
  const initialQuery = route.params?.query || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showDropdown, setShowDropdown] = useState(initialQuery === '');

  const normalizeForSearch = useCallback((text) => {
    const normalized = String(text || '').toLowerCase().trim();

    if (normalized.endsWith('s')) {
      return [normalized, normalized.slice(0, -1)];
    }

    return [normalized, `${normalized}s`];
  }, []);

  const textMatchesQuery = useCallback((text, query) => {
    const textVariants = normalizeForSearch(text);
    const queryVariants = normalizeForSearch(query);

    return textVariants.some((textVar) =>
      queryVariants.some((queryVar) => textVar.startsWith(queryVar))
    );
  }, [normalizeForSearch]);

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

  const getCityName = useCallback((cityId) =>
    cities.filter(Boolean).find((city) => city.id === cityId || city.legacyId === cityId)?.name ||
    '', [cities]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    const suggestionSet = new Map();
    const categoryMatches = [];
    const nameMatches = [];
    const descriptionMatches = [];

    cities.filter(Boolean).forEach((city) => {
      if (
        city.name.toLowerCase().startsWith(query) ||
        String(city.id).toLowerCase().startsWith(query)
      ) {
        suggestionSet.set(`city-${city.id}`, {
          type: 'city',
          id: city.id,
          name: city.name,
        });
      }
    });

    places.filter(Boolean).forEach((place) => {
      const categoryLabel = getCategoryLabel(
        place.categoryId,
        place.categoryName,
        language
      ).toLowerCase();
      const cityName = getCityName(place.cityId).toLowerCase();

      if (textMatchesQuery(categoryLabel, query)) {
        categoryMatches.push(place);
      } else if (place.name.toLowerCase().startsWith(query)) {
        nameMatches.push(place);
      } else if (
        place.name.toLowerCase().includes(query) ||
        cityName.includes(query)
      ) {
        descriptionMatches.push(place);
      }
    });

    [categoryMatches, nameMatches, descriptionMatches].forEach((group) => {
      group
        .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        .forEach((place) => {
          suggestionSet.set(`place-${place.id}`, {
            type: 'place',
            id: place.id,
            name: place.name,
            categoryId: place.categoryId,
            categoryName: place.categoryName,
            rating: place.rating,
            cityId: place.cityId,
            description: place.description,
          });
        });
    });

    return Array.from(suggestionSet.values()).slice(0, 15);
  }, [cities, getCityName, language, places, searchQuery, textMatchesQuery]);

  const allResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();

    return places
      .filter(Boolean)
      .filter((place) => {
        const categoryLabel = getCategoryLabel(
          place.categoryId,
          place.categoryName,
          language
        ).toLowerCase();
        const cityName = getCityName(place.cityId).toLowerCase();

        return (
          textMatchesQuery(categoryLabel, query) ||
          place.name.toLowerCase().includes(query) ||
          String(place.description || '').toLowerCase().includes(query) ||
          cityName.includes(query)
        );
      })
      .sort((a, b) => {
        const categoryLabelA = getCategoryLabel(
          a.categoryId,
          a.categoryName,
          language
        ).toLowerCase();
        const categoryLabelB = getCategoryLabel(
          b.categoryId,
          b.categoryName,
          language
        ).toLowerCase();

        if (
          textMatchesQuery(categoryLabelA, query) &&
          !textMatchesQuery(categoryLabelB, query)
        ) {
          return -1;
        }

        if (
          !textMatchesQuery(categoryLabelA, query) &&
          textMatchesQuery(categoryLabelB, query)
        ) {
          return 1;
        }

        return Number(b.rating || 0) - Number(a.rating || 0);
      });
  }, [getCityName, language, places, searchQuery, textMatchesQuery]);

  const handlePlacePress = (place) => {
    if (!place?.id) {
      return;
    }

    Keyboard.dismiss();
    navigation.navigate('PlaceDetails', {
      placeId: place.id,
      place,
    });
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
        onPress={() => handlePlacePress(item)}
      >
        <Text style={styles.suggestionEmoji}>
          {getCategoryEmoji(item.categoryId)}
        </Text>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionText}>{item.name}</Text>
          <View style={styles.suggestionMeta}>
            <View style={styles.ratingSmall}>
              <Ionicons name="star" size={12} color="#FCD34D" />
              <Text style={styles.ratingSmallText}>{item.rating}</Text>
            </View>
            <Text style={styles.suggestionSubtext}>
              {getCategoryLabel(item.categoryId, item.categoryName, language)}
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
        <Text style={styles.resultCategory}>
          {getCategoryLabel(item.categoryId, item.categoryName, language)}
        </Text>
        <Text style={styles.resultCity}>{getCityName(item.cityId)}</Text>
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

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('searchScreen.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#8E8E93"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchScreen.placeholder')}
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

      {showDropdown && !searchQuery.trim() && suggestions.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestionItem}
            keyExtractor={(item) => `${item?.type}-${item?.id || item?.name}`}
            scrollEnabled={false}
            nestedScrollEnabled={false}
          />
        </View>
      )}

      {searchQuery.trim() ? (
        <>
          {allResults.length > 0 && (
            <Text style={styles.resultsHeader}>
              {tc('common.countResults', allResults.length)}
            </Text>
          )}

          {allResults.length > 0 ? (
            <FlatList
              data={allResults}
              renderItem={renderResultItem}
              keyExtractor={(item) => item?.id || item?.legacyId || item?.name}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator
              scrollIndicatorInsets={{ right: 1 }}
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={Keyboard.dismiss}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>{t('common.noResults')}</Text>
              <Text style={styles.emptySubtitle}>
                {t('searchScreen.differentKeywords')}
              </Text>
            </View>
          )}
        </>
      ) : (
        <ScrollView
          style={styles.defaultSuggestionsContainer}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          <Text style={styles.sectionTitle}>{t('searchScreen.popularCities')}</Text>
          <View style={styles.citiesGrid}>
            {cities.filter(Boolean).map((city) => (
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

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('common.categories')}</Text>
          <View style={styles.categoriesGrid}>
            {[
              { id: 'beaches', label: t('categories.labels.beaches'), emoji: '🏖️' },
              { id: 'restaurants', label: t('categories.labels.restaurants'), emoji: '🍽️' },
              { id: 'cafes', label: t('categories.labels.cafes'), emoji: '☕' },
              { id: 'bars', label: t('categories.labels.bars'), emoji: '🍸' },
              { id: 'hotels', label: t('categories.labels.hotels'), emoji: '🏨' },
              { id: 'historical', label: t('searchScreen.historical'), emoji: '📚' },
            ].map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => {
                  setSearchQuery(category.label);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.categoryCardEmoji}>{category.emoji}</Text>
                <Text style={styles.categoryCardText}>{category.label}</Text>
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
