import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { getCategoryLabel, getImageSource } from '../utils/placeMeta';

export default function SavedScreen({ route }) {
  const navigation = useNavigation();
  const screenScrollRef = useRef(null);
  const {
    currentUser,
    isLoggedIn,
    getSavedPlaces,
    getTrips,
    removeSavedPlace,
  } = useAuth();
  const { getCityById, getPlaceById } = useAppData();

  const savedPlaces = useMemo(() => getSavedPlaces() || [], [getSavedPlaces]);
  const trips = useMemo(() => getTrips() || [], [getTrips]);
  const [selectedTab, setSelectedTab] = useState(
    route?.params?.initialTab === 'trips' ? 'trips' : 'places'
  );

  const activeTab = isLoggedIn ? selectedTab : 'places';

  useEffect(() => {
    if (route?.params?.refreshKey && !route?.params?.initialTab) {
      setSelectedTab('places');
      screenScrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }

    if (route?.params?.initialTab === 'trips') {
      setSelectedTab('trips');
      screenScrollRef.current?.scrollTo({ y: 0, animated: false });
      return;
    }

    if (route?.params?.initialTab === 'places') {
      setSelectedTab('places');
      screenScrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [route?.params?.initialTab, route?.params?.refreshKey]);

  const getCityName = (cityId) => {
    return getCityById(cityId)?.name || 'Unknown city';
  };

  const tripSummary = useMemo(
    () =>
      `${trips.length} ${trips.length === 1 ? 'planned trip' : 'planned trips'}`,
    [trips]
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView
          ref={screenScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Saved</Text>
            <Ionicons name="bookmark-outline" size={24} color="#222222" />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {isLoggedIn
                ? activeTab === 'trips'
                  ? 'Your planned trips'
                  : 'Your saved places'
                : 'Saved places on this device'}
            </Text>

            <Text style={styles.infoSubtitle}>
              {isLoggedIn
                ? `You are logged in as @${currentUser?.username}.`
                : 'Without an account you can still save places on this device.'}
            </Text>
          </View>

          {isLoggedIn ? (
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  activeTab === 'places' && styles.segmentButtonActive,
                ]}
                activeOpacity={0.88}
                onPress={() => setSelectedTab('places')}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    activeTab === 'places' && styles.segmentButtonTextActive,
                  ]}
                >
                  Places
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  activeTab === 'trips' && styles.segmentButtonActive,
                ]}
                activeOpacity={0.88}
                onPress={() => setSelectedTab('trips')}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    activeTab === 'trips' && styles.segmentButtonTextActive,
                  ]}
                >
                  Trips
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {activeTab === 'trips' ? (
            trips.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="map-outline" size={54} color="#A1A1AA" />
                <Text style={styles.emptyTitle}>No trips planned yet</Text>
                <Text style={styles.emptySubtitle}>
                  {tripSummary}. Once you create a trip, it will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Planned trips</Text>

                {trips.map((trip) => (
                  <View key={trip.id} style={styles.tripCard}>
                    <View style={styles.tripBadge}>
                      <Ionicons name="airplane-outline" size={16} color={colors.primary} />
                    </View>

                    <View style={styles.tripContent}>
                      <Text style={styles.tripTitle}>{trip.title}</Text>
                      <Text style={styles.tripDescription} numberOfLines={2}>
                        {trip.description || 'No description added yet.'}
                      </Text>
                      <Text style={styles.tripMeta}>
                        {trip.start_date} - {trip.end_date}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )
          ) : savedPlaces.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bookmark-outline" size={54} color="#A1A1AA" />
              <Text style={styles.emptyTitle}>No saved places yet</Text>
              <Text style={styles.emptySubtitle}>
                Saved places will appear here once the user bookmarks a location.
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved places</Text>

              {savedPlaces.map((savedPlace) => {
                const place = getPlaceById(savedPlace.id) || savedPlace;

                return (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCard}
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation.navigate('PlaceDetails', {
                      placeId: place.id,
                    })
                  }
                >
                  <Image
                    source={getImageSource(place.image)}
                    style={styles.placeImage}
                    resizeMode="cover"
                  />

                  <View style={styles.placeContent}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {place.name || 'Unnamed place'}
                    </Text>

                    <Text style={styles.placeMeta} numberOfLines={1}>
                      {getCategoryLabel(place.categoryId, place.categoryName)} • {getCityName(place.cityId)}
                    </Text>

                    {place.rating ? (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>{place.rating}</Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    activeOpacity={0.8}
                    onPress={() => removeSavedPlace(place.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#d51e1e" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )})}
            </View>
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
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222222',
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  infoSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
  },

  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 6,
    marginBottom: 16,
  },

  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },

  segmentButtonActive: {
    backgroundColor: '#FDECEC',
  },

  segmentButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },

  segmentButtonTextActive: {
    color: colors.primary,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginTop: 14,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },

  section: {
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 12,
  },

  placeCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  placeImage: {
    width: 96,
    height: 96,
    backgroundColor: '#E5E7EB',
  },

  placeContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  placeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },

  placeMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },

  deleteButton: {
    width: 52,
    height: 52,
    marginRight: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },

  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  tripBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  tripContent: {
    flex: 1,
  },

  tripTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
  },

  tripDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },

  tripMeta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
