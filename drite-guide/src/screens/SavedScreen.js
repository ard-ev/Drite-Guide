import React from 'react';
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
import { cities } from '../data/cities';

export default function SavedScreen() {
  const navigation = useNavigation();
  const { currentUser, isLoggedIn, getSavedPlaces, removeSavedPlace } = useAuth();

  const savedPlaces = getSavedPlaces() || [];

  const getCityName = (cityId) => {
    return cities.find((city) => city.id === cityId)?.name || 'Unknown city';
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

    return categoryLabels[categoryId] || categoryId || 'Place';
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
            <Text style={styles.title}>Saved</Text>
            <Ionicons name="bookmark-outline" size={24} color="#222222" />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {isLoggedIn ? 'Your saved places' : 'Saved on this device'}
            </Text>

            <Text style={styles.infoSubtitle}>
              {isLoggedIn
                ? `You are logged in as @${currentUser?.username}.`
                : 'You can save places without an account. Later you can sign up to sync them.'}
            </Text>
          </View>

          {savedPlaces.length === 0 ? (
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

              {savedPlaces.map((place) => (
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
                    source={
                      typeof place.image === 'string'
                        ? { uri: place.image }
                        : place.image
                          ? place.image
                          : { uri: 'https://placehold.co/600x400/E5E7EB/222222?text=No+Image' }
                    }
                    style={styles.placeImage}
                    resizeMode="cover"
                  />

                  <View style={styles.placeContent}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {place.name || 'Unnamed place'}
                    </Text>

                    <Text style={styles.placeMeta} numberOfLines={1}>
                      {getCategoryLabel(place.categoryId)} • {getCityName(place.cityId)}
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
              ))}
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
});