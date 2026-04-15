import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { places } from '../data/places';
import { cities } from '../data/cities';
import colors from '../theme/colors';

export default function CityPlacesScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const cityId = route.params?.cityId;
    const city = cities.find((item) => item.id === cityId);

    const filteredPlaces = places.filter((place) => place.cityId === cityId);

    const getImageSource = (image) => {
        if (typeof image === 'string') {
            return { uri: image };
        }
        return image;
    };

    const handlePlacePress = (place) => {
        navigation.navigate('PlaceDetails', {
            placeId: place.id,
        });
    };

    const renderPlaceCard = (place) => {
        return (
            <TouchableOpacity
                key={place.id}
                style={styles.placeCard}
                activeOpacity={0.9}
                onPress={() => handlePlacePress(place)}
            >
                <Image
                    source={getImageSource(place.image)}
                    style={styles.placeImage}
                    resizeMode="cover"
                />

                <View style={styles.placeContent}>
                    <View style={styles.placeTopRow}>
                        <Text style={styles.placeName} numberOfLines={1}>
                            {place.name}
                        </Text>

                        {place.rating ? (
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color="#F59E0B" />
                                <Text style={styles.ratingText}>{place.rating}</Text>
                            </View>
                        ) : null}
                    </View>

                    <Text style={styles.placeCategory}>
                        {place.categoryId
                            ? place.categoryId.charAt(0).toUpperCase() + place.categoryId.slice(1)
                            : 'Place'}
                    </Text>

                    <Text style={styles.placeDescription} numberOfLines={2}>
                        {place.description || 'No description available.'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <StatusBar style="dark" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.headerBlock}>
                        <Text style={styles.title}>{city?.name || 'City'}</Text>
                        <Text style={styles.subtitle}>
                            {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'} found
                        </Text>
                    </View>

                    {filteredPlaces.length > 0 ? (
                        <View style={styles.placesSection}>
                            {filteredPlaces.map(renderPlaceCard)}
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons
                                name="location-outline"
                                size={40}
                                color={colors.primary}
                            />
                            <Text style={styles.emptyStateTitle}>No places yet</Text>
                            <Text style={styles.emptyStateText}>
                                There are currently no places added for this city.
                            </Text>
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
        backgroundColor: '#F5F5F5',
    },

    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },

    content: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },

    headerBlock: {
        marginTop: 10,
        marginBottom: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.black,
    },

    subtitle: {
        marginTop: 4,
        fontSize: 14,
        color: '#6B7280',
    },

    placesSection: {
        gap: 14,
    },

    placeCard: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 22,
        overflow: 'hidden',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
        elevation: 3,
    },

    placeImage: {
        width: 118,
        height: 118,
        backgroundColor: '#E5E7EB',
    },

    placeContent: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 14,
        justifyContent: 'center',
    },

    placeTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
        gap: 10,
    },

    placeName: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: colors.black,
    },

    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
    },

    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9A3412',
    },

    placeCategory: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 6,
    },

    placeDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 19,
    },

    emptyState: {
        backgroundColor: colors.white,
        borderRadius: 22,
        paddingVertical: 36,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },

    emptyStateTitle: {
        marginTop: 10,
        marginBottom: 6,
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
    },

    emptyStateText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});