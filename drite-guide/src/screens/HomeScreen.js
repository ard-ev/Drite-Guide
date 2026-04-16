import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import colors from '../theme/colors';
import { places } from '../data/places';
import { cities } from '../data/cities';

const { width: screenWidth } = Dimensions.get('window');
const HERO_WIDTH = screenWidth - 40;
const HERO_COUNT = 2;
const VIDEO_HERO_INDEX = 1;

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const heroScrollRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const heroVideoPlayer = useVideoPlayer(
    require('../../assets/videos/albania-hero.mp4'),
    (player) => {
      player.loop = true;
      player.muted = true;
      player.currentTime = 0;
    }
  );

  useEffect(() => {
    if (!heroVideoPlayer) return;

    if (isFocused && activeHeroIndex === VIDEO_HERO_INDEX) {
      heroVideoPlayer.play();
    } else {
      heroVideoPlayer.pause();
    }
  }, [heroVideoPlayer, isFocused, activeHeroIndex]);

  useEffect(() => {
    if (hasSearched) return;

    const interval = setInterval(() => {
      setActiveHeroIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % HERO_COUNT;

        heroScrollRef.current?.scrollTo({
          x: nextIndex * HERO_WIDTH,
          animated: true,
        });

        return nextIndex;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [hasSearched]);

  const categories = [
    {
      id: 'restaurants',
      label: 'Restaurants',
      subtitle: 'Top-rated places',
      image: require('../../assets/catimg/restaurant.jpg'),
    },
    {
      id: 'cafes',
      label: 'Cafés',
      subtitle: 'Relaxed spots',
      image: require('../../assets/catimg/cafe.jpg'),
    },
    {
      id: 'bars',
      label: 'Bars',
      subtitle: 'Drinks & nightlife',
      image: require('../../assets/catimg/bars.jpg'),
    },
    {
      id: 'hotels',
      label: 'Hotels',
      subtitle: 'Stay in comfort',
      image: require('../../assets/catimg/hotels.jpg'),
    },
    {
      id: 'beaches',
      label: 'Beaches',
      subtitle: 'Scenic views',
      image: require('../../assets/catimg/beaches.jpg'),
    },
    {
      id: 'mosques',
      label: 'Religious Sites',
      subtitle: 'Mosques, Churches etc.',
      image: require('../../assets/catimg/religious.jpg'),
    },
    {
      id: 'historical',
      label: 'Historical Sites',
      subtitle: 'Ancient places',
      image: require('../../assets/catimg/historical.jpg'),
    },
    {
      id: 'hiddengems',
      label: 'Hidden Gems',
      subtitle: 'Exclusive',
      image: require('../../assets/catimg/hiddengems.jpg'),
    },
    {
      id: 'museums',
      label: 'Museums',
      subtitle: 'History & Culture',
      image: require('../../assets/catimg/museum.jpg'),
    },
    {
      id: 'bunkers',
      label: 'Bunkers',
      subtitle: 'Find all Bunkers',
      image: require('../../assets/catimg/bunkers.jpg'),
    },
    {
      id: 'adventures',
      label: 'Adventures',
      subtitle: 'Out and About having Fun',
      image: require('../../assets/catimg/adventures.jpg'),
    },
    {
      id: 'governmentservices',
      label: 'Government Services',
      subtitle: 'Offices, Police, Embassies & more',
      image: require('../../assets/catimg/governmentservices.jpg'),
    },
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
      hiddengems: 'Hidden Gem',
      mosques: 'Mosque',
      churches: 'Church',
      museums: 'Museum',
      bunkers: 'Bunker',
      adventures: 'Adventure',
      governmentservices: 'Government Service',
    };

    return categoryLabels[categoryId] || categoryId;
  };

  const getImageSource = (image) => {
    if (typeof image === 'string') {
      return { uri: image };
    }
    return image;
  };

  const normalizeText = (text) => {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  };

  const levenshteinDistance = (a, b) => {
    const matrix = Array.from({ length: b.length + 1 }, () =>
      Array(a.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;

        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[b.length][a.length];
  };

  const getSimilarityScore = (query, target) => {
    if (!query || !target) return 0;

    const normalizedQuery = normalizeText(query);
    const normalizedTarget = normalizeText(target);

    if (!normalizedQuery || !normalizedTarget) return 0;

    if (normalizedTarget === normalizedQuery) return 100;
    if (normalizedTarget.startsWith(normalizedQuery)) return 80;
    if (normalizedTarget.includes(normalizedQuery)) return 60;

    const queryWords = normalizedQuery.split(' ').filter(Boolean);
    const targetWords = normalizedTarget.split(' ').filter(Boolean);

    let partialMatches = 0;

    queryWords.forEach((queryWord) => {
      if (
        targetWords.some(
          (targetWord) =>
            targetWord.includes(queryWord) ||
            queryWord.includes(targetWord) ||
            levenshteinDistance(queryWord, targetWord) <= 1
        )
      ) {
        partialMatches += 1;
      }
    });

    if (partialMatches > 0) {
      return 30 + partialMatches * 10;
    }

    if (levenshteinDistance(normalizedQuery, normalizedTarget) <= 2) {
      return 25;
    }

    return 0;
  };

  const buildSearchResults = (query) => {
    return places
      .map((place) => {
        const cityName = getCityName(place.cityId);
        const categoryLabel = getCategoryLabel(place.categoryId);

        const score = Math.max(
          getSimilarityScore(query, place.name),
          getSimilarityScore(query, cityName),
          getSimilarityScore(query, place.categoryId),
          getSimilarityScore(query, categoryLabel)
        );

        return {
          ...place,
          searchScore: score,
        };
      })
      .filter((place) => place.searchScore > 0)
      .sort((a, b) => {
        if (b.searchScore !== a.searchScore) {
          return b.searchScore - a.searchScore;
        }
        return Number(b.rating || 0) - Number(a.rating || 0);
      });
  };

  const handleSearchInputChange = (text) => {
    setSearchQuery(text);
    setHasSearched(false);

    const query = normalizeText(text);

    if (!query) {
      setSuggestions([]);
      return;
    }

    const suggestionResults = buildSearchResults(query).slice(0, 5);
    setSuggestions(suggestionResults);
  };

  const handleSearch = () => {
    const query = normalizeText(searchQuery);

    if (!query) {
      return;
    }

    const filteredPlaces = buildSearchResults(query);

    setSearchResults(filteredPlaces);
    setSuggestions([]);
    setHasSearched(true);
    setSearchQuery('');
  };

  const handleCategoryPress = (category) => {
    setSuggestions([]);
    setHasSearched(false);

    navigation.navigate('CategoryPlaces', {
      categoryId: category.id,
      categoryLabel: category.label,
    });
  };

  const clearSearchResults = () => {
    setSearchResults([]);
    setSuggestions([]);
    setHasSearched(false);
    setSearchQuery('');
  };

  const handleHeroScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / HERO_WIDTH);
    setActiveHeroIndex(index);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
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
              placeholder="Search Cities, Restaurants, Cafés, Bars..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={handleSearchInputChange}
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

          {searchQuery.trim().length > 0 &&
            suggestions.length > 0 &&
            !hasSearched ? (
            <View style={styles.suggestionsBox}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.suggestionItem,
                    index === suggestions.length - 1 &&
                    styles.suggestionItemLast,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSuggestions([]);
                    setSearchQuery('');
                    navigation.navigate('PlaceDetails', { placeId: item.id });
                  }}
                >
                  <View style={styles.suggestionTextWrap}>
                    <Text style={styles.suggestionTitle}>{item.name}</Text>
                    <Text style={styles.suggestionSubtitle}>
                      {getCategoryLabel(item.categoryId)} •{' '}
                      {getCityName(item.cityId)}
                    </Text>
                  </View>

                  {item.rating ? (
                    <View style={styles.suggestionRatingBadge}>
                      <Text style={styles.suggestionRatingText}>
                        ★ {item.rating}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {hasSearched ? (
            <View style={styles.section}>
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.sectionTitleNoMargin}>Search results</Text>

                <TouchableOpacity
                  onPress={clearSearchResults}
                  activeOpacity={0.8}
                >
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
                        navigation.navigate('PlaceDetails', {
                          placeId: place.id,
                        })
                      }
                    >
                      <Image
                        source={getImageSource(place.image)}
                        style={styles.resultImage}
                        resizeMode="cover"
                      />

                      <View style={styles.resultContent}>
                        <View style={styles.resultTopRow}>
                          <View style={styles.resultTextWrap}>
                            <Text style={styles.resultTitle}>{place.name}</Text>
                            <Text style={styles.resultSubtitle}>
                              {getCategoryLabel(place.categoryId)} •{' '}
                              {getCityName(place.cityId)}
                            </Text>
                          </View>

                          {place.rating ? (
                            <View style={styles.ratingBadge}>
                              <Text style={styles.ratingText}>
                                ★ {place.rating}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={styles.resultDescription} numberOfLines={2}>
                          {place.description}
                        </Text>
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
              <View style={styles.heroSection}>
                <View style={styles.heroViewport}>
                  <ScrollView
                    ref={heroScrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    bounces={false}
                    onMomentumScrollEnd={handleHeroScrollEnd}
                    scrollEventThrottle={16}
                  >
                    <View style={styles.heroCard}>
                      <Text style={styles.heroEyebrow}>Travel smarter</Text>
                      <Text style={styles.heroTitle}>
                        Find the best places in Albania
                      </Text>
                      <Text style={styles.heroText}>
                        Explore Cities, Villages, Restaurants, Cafés, Bars,
                        Clubs and Hidden Gems in one experience.
                      </Text>
                    </View>

                    <View style={styles.videoHeroCard}>
                      <VideoView
                        style={styles.videoHero}
                        player={heroVideoPlayer}
                        nativeControls={false}
                        allowsPictureInPicture={false}
                        fullscreenOptions={{ enable: false }}
                        contentFit="cover"
                        surfaceType="textureView"
                      />
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.pagination}>
                  {[0, 1].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        activeHeroIndex === index &&
                        styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Popular categories</Text>

                <View style={styles.categoryGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryCard}
                      activeOpacity={0.85}
                      onPress={() => handleCategoryPress(category)}
                    >
                      <Image
                        source={category.image}
                        style={styles.categoryImage}
                        resizeMode="cover"
                      />

                      <View style={styles.categoryContent}>
                        <Text style={styles.categoryTitle}>
                          {category.label}
                        </Text>
                        <Text style={styles.categorySubtitle}>
                          {category.subtitle}
                        </Text>
                      </View>
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
    borderRadius: 23,
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

  suggestionsBox: {
    marginTop: 10,
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  suggestionItemLast: {
    borderBottomWidth: 0,
  },

  suggestionTextWrap: {
    flex: 1,
    marginRight: 12,
  },

  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },

  suggestionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },

  suggestionRatingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  suggestionRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },

  heroSection: {
    marginTop: 22,
  },

  heroViewport: {
    width: HERO_WIDTH,
    overflow: 'hidden',
    borderRadius: 24,
  },

  heroCard: {
    width: HERO_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },

  videoHeroCard: {
    width: HERO_WIDTH,
    height: 190,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },

  videoHero: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },

  heroEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 10,
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

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },

  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },

  paginationDotActive: {
    width: 22,
    backgroundColor: colors.primary,
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

  sectionTitleNoMargin: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  clearResultsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },

  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  resultImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#E5E7EB',
  },

  resultContent: {
    padding: 16,
  },

  resultTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  resultTextWrap: {
    flex: 1,
    marginRight: 12,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },

  resultSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },

  resultDescription: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
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
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  categoryImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E7EB',
  },

  categoryContent: {
    padding: 16,
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