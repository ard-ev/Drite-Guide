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
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import colors from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { toAbsoluteAssetUrl } from '../config/api';
import { getCategoryLabel, getImageSource } from '../utils/placeMeta';
import { api } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');
const HERO_WIDTH = screenWidth - 40;
const HERO_COUNT = 2;
const VIDEO_HERO_INDEX = 1;
const CATEGORY_PRIORITY = [
  'restaurants',
  'hotels',
  'cafes',
  'bars',
  'beaches',
  'historicalsites',
  'hidden_gems',
  'government_help',
  'governmenthelp',
  'governmentservices',
];
const CATEGORY_SUBTITLES = {
  restaurants: 'Traditional and modern dining spots',
  hotels: 'Stay close to the best destinations',
  bars: 'Cocktails, music and nightlife vibes',
  cafes: 'Coffee breaks and cozy corners',
  beaches: 'Sunny coastlines and crystal water',
  historical: 'Castles, ruins and heritage places',
  historicalsites: 'Castles, ruins and heritage places',
  hidden_gems: 'Lesser-known local favorites',
  hiddengems: 'Lesser-known local favorites',
  government_help: 'Banks, offices and public help points',
  governmenthelp: 'Helpful public services and support',
  mosques: 'Beautiful Islamic landmarks',
  churches: 'Historic churches and sacred sites',
  religious_sites: 'Mosques, churches and sacred places',
  religioussites: 'Mosques, churches and sacred places',
  clubs: 'Late-night venues and party spots',
  museums: 'Culture, art and local history',
  bunkers: 'Unique Cold War era locations',
  adventures: 'Outdoor action and active escapes',
  governmentservices: 'Useful public service locations',
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const heroScrollRef = useRef(null);
  const { categories, places, cities, errorMessage } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [userResults, setUserResults] = useState([]);

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

  const normalizeCategoryKey = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '');

  const getCategoryKey = (category) => {
    const candidates = [
      category.legacyId,
      category.id,
      category.name,
    ].map(normalizeCategoryKey);

    const aliases = {
      historical: 'historicalsites',
      historicalsites: 'historicalsites',
      hiddengems: 'hidden_gems',
      religioussites: 'religious_sites',
      government_help: 'government_help',
      governmentservice: 'governmentservices',
      governmentservices: 'governmentservices',
      governmenthelp: 'governmenthelp',
      mosques: 'religious_sites',
      churches: 'religious_sites',
    };

    for (const candidate of candidates) {
      if (CATEGORY_PRIORITY.includes(candidate)) {
        return candidate;
      }

      if (aliases[candidate]) {
        return aliases[candidate];
      }
    }

    return candidates[0] || '';
  };

  const categoryCards = [...categories]
    .sort((left, right) => {
      const leftKey = getCategoryKey(left);
      const rightKey = getCategoryKey(right);
      const leftPriority = CATEGORY_PRIORITY.indexOf(leftKey);
      const rightPriority = CATEGORY_PRIORITY.indexOf(rightKey);

      if (leftPriority !== -1 || rightPriority !== -1) {
        if (leftPriority === -1) return 1;
        if (rightPriority === -1) return -1;
        return leftPriority - rightPriority;
      }

      return String(left.name || '').localeCompare(String(right.name || ''));
    })
    .map((category) => ({
      id: category.id,
      label: category.name,
      subtitle:
        CATEGORY_SUBTITLES[getCategoryKey(category)] || 'Explore places in this category',
      image: category.image,
    }));

  const getCityName = (cityId) => {
    return cities.find((city) => city.id === cityId)?.name || 'Unknown City';
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
        const categoryLabel = getCategoryLabel(place.categoryId, place.categoryName);

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

  const searchUsers = async (query) => {
    if (!query) {
      setUserSuggestions([]);
      return [];
    }

    try {
      const response = await api.get('/users/search', {
        params: { q: query },
      });
      const nextUsers = response.data || [];
      setUserSuggestions(nextUsers.slice(0, 5));
      return nextUsers;
    } catch (error) {
      setUserSuggestions([]);
      return [];
    }
  };

  const handleSearchInputChange = async (text) => {
    setSearchQuery(text);
    setHasSearched(false);

    const query = normalizeText(text);

    if (!query) {
      setSuggestions([]);
      setUserSuggestions([]);
      return;
    }

    const suggestionResults = buildSearchResults(query).slice(0, 5);
    setSuggestions(suggestionResults);
    await searchUsers(query);
  };

  const handleSearch = async () => {
    const query = normalizeText(searchQuery);

    if (!query) {
      return;
    }

    const filteredPlaces = buildSearchResults(query);
    const filteredUsers = await searchUsers(query);

    setSearchResults(filteredPlaces);
    setUserResults(filteredUsers);
    setSuggestions([]);
    setUserSuggestions([]);
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
    setUserResults([]);
    setSuggestions([]);
    setUserSuggestions([]);
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
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={Keyboard.dismiss}
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

          {errorMessage ? (
            <View style={styles.noResultsCard}>
              <Text style={styles.noResultsText}>{errorMessage}</Text>
            </View>
          ) : null}

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
            (suggestions.length > 0 || userSuggestions.length > 0) &&
            !hasSearched ? (
            <View style={styles.suggestionsBox}>
              {userSuggestions.map((user, userIndex) => (
                <TouchableOpacity
                  key={`user-${user.id}`}
                  style={[
                    styles.suggestionItem,
                    userIndex === userSuggestions.length - 1 &&
                      suggestions.length === 0 &&
                      styles.suggestionItemLast,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSuggestions([]);
                    setUserSuggestions([]);
                    setSearchQuery('');
                    navigation.navigate('Profile', {
                      username: user.username,
                      profile: user,
                    });
                  }}
                >
                  <View style={styles.userSuggestionAvatarWrap}>
                    <Image
                      source={{
                        uri:
                          toAbsoluteAssetUrl(user.profile_picture_path) ||
                          'https://placehold.co/120x120/E5E7EB/222222?text=DG',
                      }}
                      style={styles.userSuggestionAvatar}
                    />
                  </View>
                  <View style={styles.suggestionTextWrap}>
                    <Text style={styles.suggestionTitle}>@{user.username}</Text>
                    <Text style={styles.suggestionSubtitle}>
                      {user.first_name} {user.last_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.suggestionItem,
                    index === suggestions.length - 1 &&
                    userSuggestions.length === 0 &&
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
                      {getCategoryLabel(item.categoryId, item.categoryName)} •{' '}
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

              {userResults.length > 0 || searchResults.length > 0 ? (
                <View>
                  {userResults.length > 0 ? (
                    <View style={styles.userResultsSection}>
                      <Text style={styles.sectionTitleNoMargin}>Profiles</Text>
                      {userResults.map((user) => (
                        <TouchableOpacity
                          key={`result-user-${user.id}`}
                          style={styles.userResultCard}
                          activeOpacity={0.85}
                          onPress={() =>
                            navigation.navigate('Profile', {
                              username: user.username,
                              profile: user,
                            })
                          }
                        >
                          <Image
                            source={{
                              uri:
                                toAbsoluteAssetUrl(user.profile_picture_path) ||
                                'https://placehold.co/120x120/E5E7EB/222222?text=DG',
                            }}
                            style={styles.userResultAvatar}
                          />
                          <View style={styles.userResultContent}>
                            <Text style={styles.resultTitle}>
                              {user.first_name} {user.last_name}
                            </Text>
                            <Text style={styles.resultSubtitle}>
                              @{user.username} • {user.followers_count || 0} followers
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}

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
                              {getCategoryLabel(place.categoryId, place.categoryName)} •{' '}
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
                  {categoryCards.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryCard}
                      activeOpacity={0.85}
                      onPress={() => handleCategoryPress(category)}
                    >
                      <Image
                        source={getImageSource(category.image)}
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

  userSuggestionAvatarWrap: {
    marginRight: 12,
  },

  userSuggestionAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E5E7EB',
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

  userResultsSection: {
    marginBottom: 16,
  },

  userResultCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  userResultAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E7EB',
    marginRight: 14,
  },

  userResultContent: {
    flex: 1,
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
