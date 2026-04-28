import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
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

export default function TripPlacePickerModal({
  visible,
  existingPlaceIds = [],
  onClose,
  onSelectPlace,
}) {
  const { places } = useAppData();
  const [query, setQuery] = useState('');

  const existingIds = useMemo(
    () => new Set(existingPlaceIds.filter(Boolean).map(String)),
    [existingPlaceIds]
  );

  const filteredPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (places || [])
      .filter((place) => {
        if (!normalizedQuery) return true;

        const haystack = [
          place.name,
          place.cityName,
          place.categoryName,
          place.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
      .slice(0, 60);
  }, [places, query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => null}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add Place</Text>
              <Text style={styles.subtitle}>Choose a place for this trip.</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            {filteredPlaces.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={34} color="#A1A1AA" />
                <Text style={styles.emptyTitle}>No places found</Text>
                <Text style={styles.emptyText}>Try another search term.</Text>
              </View>
            ) : (
              filteredPlaces.map((place) => {
                const isAdded =
                  existingIds.has(String(place.id)) ||
                  existingIds.has(String(place.seededId));

                return (
                  <TouchableOpacity
                    key={place.id}
                    style={[styles.placeOption, isAdded && styles.placeOptionDisabled]}
                    activeOpacity={0.88}
                    disabled={isAdded}
                    onPress={() => onSelectPlace?.(place)}
                  >
                    <Image
                      source={getImageSource(place.image)}
                      style={styles.placeImage}
                      resizeMode="cover"
                    />

                    <View style={styles.placeContent}>
                      <Text style={styles.placeTitle} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={styles.placeMeta} numberOfLines={1}>
                        {isAdded ? 'Already in this trip' : place.cityName || 'Albania'}
                      </Text>
                    </View>

                    <Ionicons
                      name={isAdded ? 'checkmark-circle' : 'add-circle-outline'}
                      size={22}
                      color={isAdded ? '#A1A1AA' : colors.primary}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
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
