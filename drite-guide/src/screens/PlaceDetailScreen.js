import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';

export default function PlaceDetailScreen({ route }) {
  const { placeId } = route.params || {};
  const { getSavedPlaces, savePlace, removeSavedPlace } = useAuth();

  const place = places.find((p) => p.id === placeId);
  const savedPlaces = getSavedPlaces() || [];
  const isSaved = savedPlaces.some((item) => item.id === placeId);

  if (!place) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Place not found</Text>
          <Text style={styles.notFoundText}>
            The selected place could not be loaded.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const city = cities.find((c) => c.id === place.cityId);

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

  const imageGallery =
    Array.isArray(place.images) && place.images.length > 0
      ? place.images
      : place.image
        ? [place.image]
        : ['https://placehold.co/1200x800/E5E7EB/222222?text=No+Image'];

  const phoneNumber = place.phone || '+355000000000';
  const address = place.address || `${city?.name || 'Albania'} Center`;
  const latitude = place.latitude ?? null;
  const longitude = place.longitude ?? null;

  const getImageSource = (image) => {
    if (typeof image === 'string') {
      return { uri: image };
    }
    return image;
  };

  const handleCall = async () => {
    const url = `tel:${phoneNumber}`;
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert('Call unavailable', 'This device cannot open the phone dialer.');
      return;
    }

    Linking.openURL(url);
  };

  

  const handleNavigate = async () => {
    try {
      if (!place?.googleMapsLink) {
        Alert.alert('Kein Link', 'Für diesen Ort ist kein Kartenlink hinterlegt.');
        return;
      }

      await Linking.openURL(place.googleMapsLink);
    } catch (error) {
      console.log('Navigation error:', error);
      Alert.alert('Fehler', 'Karte konnte nicht geöffnet werden.');
    }
  };

  const handleToggleSaved = () => {
    if (isSaved) {
      removeSavedPlace(place.id);
      return;
    }

    savePlace(place);
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Details</Text>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleToggleSaved}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
          >
            {imageGallery.map((img, index) => (
              <Image
                key={`${place.id}-image-${index}`}
                source={getImageSource(img)}
                style={[
                  styles.galleryImage,
                  index === 0 ? styles.galleryImageFirst : null,
                ]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View style={styles.topSection}>
            <View style={styles.categoryBadge}>
              <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
              <Text style={styles.categoryLabel}>
                {getCategoryLabel(place.categoryId)}
              </Text>
            </View>

            {place.rating ? (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.ratingText}>{place.rating}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.placeName}>{place.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
              <Text style={styles.metaText}>{city?.name || 'Unknown City'}</Text>
            </View>

            <View style={styles.metaDot} />

            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={16} color={colors.primary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {address}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.description}>
              {place.description || 'No description available for this place yet.'}
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { marginRight: 8 }]}>
              <Ionicons name="star-outline" size={22} color={colors.primary} />
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>{place.rating || 'N/A'}</Text>
            </View>

            <View style={[styles.infoCard, { marginLeft: 8 }]}>
              <Ionicons name="call-outline" size={22} color={colors.primary} />
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {phoneNumber}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleCall}
              activeOpacity={0.88}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleNavigate}
              activeOpacity={0.88}
            >
              <Ionicons name="navigate" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
  },

  headerSpacer: {
    width: 40,
    height: 40,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  galleryRow: {
    paddingRight: 6,
    marginBottom: 18,
  },

  galleryImage: {
    width: 280,
    height: 220,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },

  galleryImageFirst: {
    marginLeft: 0,
  },

  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 6,
  },

  placeName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 10,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '46%',
  },

  metaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6,
  },

  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 10,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#4B5563',
  },

  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
    marginTop: 4,
    textAlign: 'center',
  },

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
  },

  primaryButton: {
    backgroundColor: colors.primary,
  },

  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },

  notFoundText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});