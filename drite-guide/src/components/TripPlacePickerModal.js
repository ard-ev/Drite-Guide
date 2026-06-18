import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppData } from '../context/AppDataContext';
import colors from '../theme/colors';
import { getImageSource } from '../utils/placeMeta';
import FastImage from './FastImage';

const normalizeSearchText = (text) => {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
};

const getLevenshteinDistance = (a, b) => {
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

const getSimilarityScore = (searchValue, targetValue) => {
  const searchText = normalizeSearchText(searchValue);
  const targetText = normalizeSearchText(targetValue);

  if (!searchText || !targetText) return 0;
  if (targetText === searchText) return 100;
  if (targetText.startsWith(searchText)) return 80;
  if (targetText.includes(searchText)) return 60;

  const queryWords = searchText.split(' ').filter(Boolean);
  const targetWords = targetText.split(' ').filter(Boolean);
  const matchedWords = queryWords.filter((queryWord) =>
    targetWords.some(
      (targetWord) =>
        targetWord.includes(queryWord) ||
        queryWord.includes(targetWord) ||
        getLevenshteinDistance(queryWord, targetWord) <= 1
    )
  );

  if (matchedWords.length > 0) {
    return 30 + matchedWords.length * 10;
  }

  return getLevenshteinDistance(searchText, targetText) <= 2 ? 25 : 0;
};

export default function TripPlacePickerModal({
  visible,
  existingPlaceIds = [],
  addingPlaceId = null,
  onClose,
  onSelectPlace,
}) {
  const { places } = useAppData();
  const [query, setQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isMounted, setIsMounted] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(36)).current;

  useEffect(() => {
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(keyboardShowEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setIsMounted(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(42);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (isMounted) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 30,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsMounted(false);
        }
      });
    }
  }, [backdropOpacity, isMounted, sheetTranslateY, visible]);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 30,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setQuery('');
      onClose?.();
    });
  };

  const handleSelectPlace = (place) => {
    setQuery('');
    Keyboard.dismiss();
    onSelectPlace?.(place);
  };

  const existingIds = useMemo(
    () => new Set(existingPlaceIds.filter(Boolean).map(String)),
    [existingPlaceIds]
  );

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);

    return (places || [])
      .filter(Boolean)
      .map((place) => {
        if (!normalizedQuery) {
          return { ...place, searchScore: Number(place.rating || 0) };
        }

        const searchScore = Math.max(
          getSimilarityScore(normalizedQuery, place.name),
          getSimilarityScore(normalizedQuery, place.cityName),
          getSimilarityScore(normalizedQuery, place.categoryName),
          getSimilarityScore(normalizedQuery, place.categoryId),
          getSimilarityScore(normalizedQuery, place.description)
        );

        return { ...place, searchScore };
      })
      .filter((place) => !normalizedQuery || place.searchScore > 0)
      .sort((left, right) => {
        if (right.searchScore !== left.searchScore) {
          return right.searchScore - left.searchScore;
        }

        return Number(right.rating || 0) - Number(left.rating || 0);
      })
      .slice(0, 60);
  }, [places, query]);

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={closeWithAnimation}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[styles.backdropOverlay, styles.noPointerEvents, { opacity: backdropOpacity }]}
        />
        <Pressable style={styles.backdropPressArea} onPress={closeWithAnimation} />
        <Animated.View
          style={[
            styles.sheet,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + 20 },
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <Pressable style={styles.sheetContent} onPress={() => null}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add Place</Text>
              <Text style={styles.subtitle}>Choose a place for this trip.</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={closeWithAnimation}>
              <Ionicons name="close" size={20} color="#222222" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search places"
              placeholderTextColor="#A1A1AA"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.trim().length > 0 ? (
              <TouchableOpacity
                style={styles.clearSearchButton}
                activeOpacity={0.82}
                onPress={() => setQuery('')}
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView
            style={styles.resultsScroll}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.resultsContent}
          >
            {filteredPlaces.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={34} color="#A1A1AA" />
                <Text style={styles.emptyTitle}>No places found</Text>
                <Text style={styles.emptyText}>Try another search term.</Text>
              </View>
            ) : (
              filteredPlaces.map((place) => {
                const isAdded = existingIds.has(String(place.id));
                const isAdding = String(addingPlaceId || '') === String(place.id);

                return (
                  <TouchableOpacity
                    key={place.id}
                    style={[styles.placeOption, (isAdded || isAdding) && styles.placeOptionDisabled]}
                    activeOpacity={0.88}
                    disabled={isAdded || isAdding}
                    onPress={() => handleSelectPlace(place)}
                  >
                    <FastImage
                      source={getImageSource(place.image)}
                      style={styles.placeImage}
                      resizeMode="cover"
                    />

                    <View style={styles.placeContent}>
                      <Text style={styles.placeTitle} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={styles.placeMeta} numberOfLines={1}>
                        {isAdding ? 'Adding...' : isAdded ? 'Already in this trip' : place.cityName || 'Albania'}
                      </Text>
                    </View>

                    <Ionicons
                      name={isAdding || isAdded ? 'checkmark-circle' : 'add-circle-outline'}
                      size={22}
                      color={isAdding ? colors.primary : isAdded ? '#A1A1AA' : colors.primary}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  noPointerEvents: {
    pointerEvents: 'none',
  },
  backdropPressArea: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  sheetContent: {
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222222',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#222222',
  },
  clearSearchButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF0F3',
  },
  resultsScroll: {
    minHeight: 0,
  },
  resultsContent: {
    paddingBottom: 28,
  },
  placeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  placeOptionDisabled: {
    opacity: 0.58,
  },
  placeImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  placeContent: {
    flex: 1,
    marginRight: 10,
  },
  placeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#222222',
  },
  placeMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 18,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '800',
    color: '#222222',
  },
  emptyText: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
});
