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
  Linking,
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
const HERO_COUNT = 3;
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
const HIDDEN_HOME_CATEGORY_KEYS = ['mosque', 'mosques', 'church', 'churches'];

export default function HomeScreen({ route }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const screenScrollRef = useRef(null);
  const heroScrollRef = useRef(null);
  const { categories, places, cities, errorMessage } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);
  const [cityResults, setCityResults] = useState([]);
  const refreshKey = route?.params?.refreshKey;

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

  const isHiddenHomeCategory = (category) => {
    const rawKeys = [category.legacyId, category.id, category.name].map(
      normalizeCategoryKey
    );

    return rawKeys.some((key) => HIDDEN_HOME_CATEGORY_KEYS.includes(key));
  };

  const categoryCards = [...categories]
    .filter((category) => !isHiddenHomeCategory(category))
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

  const buildCategorySearchResults = (query) => {
    return categories
      .map((category) => {
        const score = Math.max(
          getSimilarityScore(query, category.name),
          getSimilarityScore(query, category.id),
          getSimilarityScore(query, category.legacyId),
          getSimilarityScore(query, getCategoryKey(category))
        );

        return {
          ...category,
          searchScore: score,
        };
      })
      .filter((category) => category.searchScore > 0)
      .sort((a, b) => {
        if (b.searchScore !== a.searchScore) {
          return b.searchScore - a.searchScore;
        }

        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  };

  const buildCitySearchResults = (query) => {
    return cities
      .map((city) => {
        const score = Math.max(
          getSimilarityScore(query, city.name),
          getSimilarityScore(query, city.id),
          getSimilarityScore(query, city.legacyId),
          getSimilarityScore(query, city.location_text)
        );

        return {
          ...city,
          searchScore: score,
        };
      })
      .filter((city) => city.searchScore > 0)
      .sort((a, b) => {
        if (b.searchScore !== a.searchScore) {
          return b.searchScore - a.searchScore;
        }

        return String(a.name || '').localeCompare(String(b.name || ''));
      });
  };

  const searchUsers = async (query) => {
    const userQuery = String(query || '').trim().replace(/^@+/, '');

    if (!userQuery) {
      setUserSuggestions([]);
      return [];
    }

    try {
      const response = await api.get('/users/search', {
        params: { q: userQuery },
      });
      const nextUsers = response.data || [];
      setUserSuggestions(nextUsers.slice(0, 5));
      return nextUsers;
    } catch (_searchError) {
      try {
        const response = await api.get(
          `/users/${encodeURIComponent(userQuery)}`
        );
        const fallbackUsers = response.data ? [response.data] : [];
        setUserSuggestions(fallbackUsers);
        return fallbackUsers;
      } catch (_profileError) {
        setUserSuggestions([]);
        return [];
      }
    }
  };

  const handleSearchInputChange = async (text) => {
    setSearchQuery(text);
    setHasSearched(false);

    const query = normalizeText(text);

    if (!query) {
      setSuggestions([]);
      setCategorySuggestions([]);
      setCitySuggestions([]);
      setUserSuggestions([]);
      return;
    }

    const suggestionResults = buildSearchResults(query).slice(0, 5);
    const nextCategorySuggestions = buildCategorySearchResults(query).slice(0, 4);
    const nextCitySuggestions = buildCitySearchResults(query).slice(0, 4);
    setSuggestions(suggestionResults);
    setCategorySuggestions(nextCategorySuggestions);
    setCitySuggestions(nextCitySuggestions);
    await searchUsers(text);
  };

  const handleSearch = async () => {
    const query = normalizeText(searchQuery);

    if (!query) {
      return;
    }

    const filteredPlaces = buildSearchResults(query);
    const filteredCategories = buildCategorySearchResults(query);
    const filteredCities = buildCitySearchResults(query);
    const filteredUsers = await searchUsers(searchQuery);

    setSearchResults(filteredPlaces);
    setCategoryResults(filteredCategories);
    setCityResults(filteredCities);
    setUserResults(filteredUsers);
    setSuggestions([]);
    setCategorySuggestions([]);
    setCitySuggestions([]);
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
    setCategoryResults([]);
    setCityResults([]);
    setUserResults([]);
    setSuggestions([]);
    setCategorySuggestions([]);
    setCitySuggestions([]);
    setUserSuggestions([]);
    setHasSearched(false);
    setSearchQuery('');
  };

  useEffect(() => {
    if (!refreshKey) {
      return;
    }

    setSearchResults([]);
    setCategoryResults([]);
    setCityResults([]);
    setUserResults([]);
    setSuggestions([]);
    setCategorySuggestions([]);
    setCitySuggestions([]);
    setUserSuggestions([]);
    setHasSearched(false);
    setSearchQuery('');
    setActiveHeroIndex(0);
    screenScrollRef.current?.scrollTo({ y: 0, animated: false });
    heroScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [refreshKey]);

  const clearSearchSuggestions = () => {
    setSuggestions([]);
    setCategorySuggestions([]);
    setCitySuggestions([]);
    setUserSuggestions([]);
    setSearchQuery('');
  };

  const navigateToCategory = (category) => {
    clearSearchSuggestions();
    navigation.navigate('CategoryPlaces', {
      categoryId: category.id,
      categoryLabel: category.name,
    });
  };

  const navigateToCity = (city) => {
    clearSearchSuggestions();
    navigation.navigate('CityPlaces', {
      cityId: city.id,
    });
  };

  const navigateToProfile = (user) => {
    clearSearchSuggestions();
    navigation.navigate('Profile', {
      username: user.username,
      profile: user,
    });
  };

  const navigateToPlace = (place) => {
    clearSearchSuggestions();
    navigation.navigate('PlaceDetails', { placeId: place.id });
  };

  const handlePartnerContactPress = () => {
    const subject = encodeURIComponent('Business partnership with Drite Guide');
    const body = encodeURIComponent(
      'Hi Drite Guide,\n\nI would like to become a business partner.\n\nBusiness name:\nLocation:\nWhat we offer:\nContact person:\nPhone:\n\nThank you!'
    );

    Linking.openURL(
      `mailto:driteguide@gmail.com?subject=${subject}&body=${body}`
    );
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
          ref={screenScrollRef}
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
              placeholder="Search places, categories, cities, accounts..."
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
            (citySuggestions.length > 0 ||
              categorySuggestions.length > 0 ||
              userSuggestions.length > 0 ||
              suggestions.length > 0) &&
            !hasSearched ? (
            <View style={styles.suggestionsBox}>
              {citySuggestions.map((city) => (
                <TouchableOpacity
                  key={`city-${city.id}`}
                  style={styles.suggestionItem}
                  activeOpacity={0.85}
                  onPress={() => navigateToCity(city)}
                >
                  <Image
                    source={getImageSource(city.heroImage || city.image)}
                    style={styles.suggestionThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.suggestionTextWrap}>
                    <Text style={styles.suggestionTitle}>{city.name}</Text>
                    <Text style={styles.suggestionSubtitle}>City</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {categorySuggestions.map((category) => (
                <TouchableOpacity
                  key={`category-${category.id}`}
                  style={styles.suggestionItem}
                  activeOpacity={0.85}
                  onPress={() => navigateToCategory(category)}
                >
                  <Image
                    source={getImageSource(category.image)}
                    style={styles.suggestionThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.suggestionTextWrap}>
                    <Text style={styles.suggestionTitle}>{category.name}</Text>
                    <Text style={styles.suggestionSubtitle}>Category</Text>
                  </View>
                </TouchableOpacity>
              ))}

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
                  onPress={() => navigateToProfile(user)}
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
                  onPress={() => navigateToPlace(item)}
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

              {cityResults.length > 0 ||
                categoryResults.length > 0 ||
                userResults.length > 0 ||
                searchResults.length > 0 ? (
                <View>
                  {cityResults.length > 0 ? (
                    <View style={styles.searchGroup}>
                      <Text style={styles.searchGroupTitle}>Cities</Text>
                      {cityResults.map((city) => (
                        <TouchableOpacity
                          key={`result-city-${city.id}`}
                          style={styles.resultCard}
                          activeOpacity={0.85}
                          onPress={() => navigateToCity(city)}
                        >
                          <Image
                            source={getImageSource(city.heroImage || city.image)}
                            style={styles.resultImage}
                            resizeMode="cover"
                          />

                          <View style={styles.resultContent}>
                            <Text style={styles.resultTitle}>{city.name}</Text>
                            <Text style={styles.resultSubtitle}>City</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}

                  {categoryResults.length > 0 ? (
                    <View style={styles.searchGroup}>
                      <Text style={styles.searchGroupTitle}>Categories</Text>
                      {categoryResults.map((category) => (
                        <TouchableOpacity
                          key={`result-category-${category.id}`}
                          style={styles.resultCard}
                          activeOpacity={0.85}
                          onPress={() => navigateToCategory(category)}
                        >
                          <Image
                            source={getImageSource(category.image)}
                            style={styles.resultImage}
                            resizeMode="cover"
                          />

                          <View style={styles.resultContent}>
                            <Text style={styles.resultTitle}>{category.name}</Text>
                            <Text style={styles.resultSubtitle}>Category</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}

                  {userResults.length > 0 ? (
                    <View style={styles.searchGroup}>
                      <Text style={styles.searchGroupTitle}>Profiles</Text>
                      {userResults.map((user) => (
                        <TouchableOpacity
                          key={`result-user-${user.id}`}
                          style={styles.userResultCard}
                          activeOpacity={0.85}
                          onPress={() => navigateToProfile(user)}
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

                  {searchResults.length > 0 ? (
                    <Text style={styles.searchGroupTitle}>Places</Text>
                  ) : null}

                  {searchResults.map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.resultCard}
                      activeOpacity={0.85}
                      onPress={() => navigateToPlace(place)}
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

                    <View style={styles.partnerHeroCard}>
                      <View style={styles.partnerHeroGlowOne} />
                      <View style={styles.partnerHeroGlowTwo} />

                      <View style={styles.partnerHeroTopRow}>
                        <Text style={styles.partnerHeroEyebrow}>For businesses</Text>
                        <View style={styles.partnerHeroBadge}>
                          <Text style={styles.partnerHeroBadgeText}>Partner up</Text>
                        </View>
                      </View>

                      <Text style={styles.partnerHeroTitle}>
                        Put your spot where Albania is looking
                      </Text>
                      <Text style={styles.partnerHeroText}>
                        Hotels, cafés, tours and local gems can team up with
                        Dritë Guide and get discovered by curious travelers.
                      </Text>

                      <TouchableOpacity
                        style={styles.partnerHeroFooter}
                        activeOpacity={0.86}
                        onPress={handlePartnerContactPress}
                      >
                        <Text style={styles.partnerHeroFooterText}>Tell us what you do</Text>
                        <View style={styles.partnerHeroArrow}>
                          <Text style={styles.partnerHeroArrowText}>→</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.pagination}>
                  {Array.from({ length: HERO_COUNT }).map((_, index) => (
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

  suggestionThumb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
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

  partnerHeroCard: {
    width: HERO_WIDTH,
    height: 190,
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: '#101418',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  partnerHeroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -54,
    top: -62,
    backgroundColor: 'rgba(214, 40, 40, 0.82)',
  },

  partnerHeroGlowTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    left: -62,
    bottom: -64,
    backgroundColor: 'rgba(255, 184, 77, 0.34)',
  },

  partnerHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  partnerHeroEyebrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD166',
  },

  partnerHeroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  partnerHeroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
  },

  partnerHeroTitle: {
    maxWidth: '88%',
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 27,
    marginBottom: 8,
  },

  partnerHeroText: {
    maxWidth: '92%',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.82)',
  },

  partnerHeroFooter: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },

  partnerHeroFooterText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#101418',
    marginRight: 10,
  },

  partnerHeroArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  partnerHeroArrowText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 18,
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

  searchGroup: {
    marginBottom: 16,
  },

  searchGroupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
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
