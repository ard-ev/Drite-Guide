import React, { useCallback, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';
import { useAppData } from '../context/AppDataContext';
import { getCategoryLabel, getImageSource } from '../utils/placeMeta';
import { useTranslation } from '../context/TranslationContext';
import useAppRefresh from '../hooks/useAppRefresh';
import FastImage from '../components/FastImage';

export default function CityPlacesScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { places, categories, getCityById } = useAppData();
    const { t, tc, language } = useTranslation();
    const { isRefreshing, refreshApp } = useAppRefresh();
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    const cityId = route.params?.cityId;
    const city = getCityById(cityId);
    const idsMatch = useCallback((left, right) =>
        left === right || String(left) === String(right), []);

    const matchesCity = useCallback((place) =>
        idsMatch(place.cityId, cityId) ||
        place.legacyId === cityId, [cityId, idsMatch]);

    const matchesCategory = useCallback((place, categoryId) => {
        if (!categoryId) {
            return true;
        }

        if (categoryId === 'religious_sites') {
            return ['religious_sites', 'mosques', 'churches'].includes(place.categoryId);
        }

        return idsMatch(place.categoryId, categoryId);
    }, [idsMatch]);

    const cityPlaces = useMemo(() => {
        return places
            .filter(Boolean)
            .filter(matchesCity);
    }, [matchesCity, places]);

    const categoriesWithCityPlaces = useMemo(() => {
        return categories
            .filter((category) =>
                cityPlaces.some((place) => matchesCategory(place, category?.id))
            )
            .sort((left, right) =>
                String(left?.name || '').localeCompare(String(right?.name || ''))
            );
    }, [categories, cityPlaces, matchesCategory]);

    const filteredPlaces = useMemo(() => {
        return cityPlaces.filter((place) =>
            matchesCategory(place, selectedCategoryId)
        );
    }, [cityPlaces, matchesCategory, selectedCategoryId]);

    const handlePlacePress = (place) => {
        navigation.navigate('PlaceDetails', {
            placeId: place?.id,
            place,
        });
    };

    const renderCategoryFilter = () => (
        <View style={styles.filterSection}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterChipsContent}
            >
                <TouchableOpacity
                    style={[
                        styles.filterChip,
                        !selectedCategoryId && styles.filterChipActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedCategoryId(null)}
                >
                    <Text
                        style={[
                            styles.filterChipText,
                            !selectedCategoryId && styles.filterChipTextActive,
                        ]}
                    >
                        {t('explore.allCategories')}
                    </Text>
                </TouchableOpacity>

                {categoriesWithCityPlaces.map((category) => {
                    const isActive = idsMatch(selectedCategoryId, category?.id);

                    return (
                        <TouchableOpacity
                            key={category?.id || category?.legacyId || category?.name}
                            style={[
                                styles.filterChip,
                                isActive && styles.filterChipActive,
                            ]}
                            activeOpacity={0.85}
                            onPress={() => setSelectedCategoryId(category?.id)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    isActive && styles.filterChipTextActive,
                                ]}
                                numberOfLines={1}
                            >
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {selectedCategoryId ? (
                <TouchableOpacity
                    style={styles.clearFilterButton}
                    activeOpacity={0.85}
                    onPress={() => setSelectedCategoryId(null)}
                >
                    <Ionicons name="close" size={16} color={colors.primary} />
                    <Text style={styles.clearFilterText}>{t('common.clear')}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );

    const renderPlaceCard = (place) => {
        return (
            <TouchableOpacity
                key={place?.id || place?.legacyId || place?.name}
                style={styles.placeCard}
                activeOpacity={0.9}
                onPress={() => handlePlacePress(place)}
            >
                <FastImage
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
                        {getCategoryLabel(place.categoryId, place.categoryName, language)}
                    </Text>

                    <Text style={styles.placeDescription} numberOfLines={2}>
                        {place.description || t('common.noDescription')}
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
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refreshApp}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                >
                    <View style={styles.headerBlock}>
                        <Text style={styles.title}>{city?.name || t('common.city')}</Text>
                        <Text style={styles.subtitle}>
                            {tc('common.countPlacesFound', filteredPlaces.length)}
                        </Text>
                    </View>

                    {renderCategoryFilter()}

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
                            <Text style={styles.emptyStateTitle}>{t('listing.noPlacesYet')}</Text>
                            <Text style={styles.emptyStateText}>
                                {selectedCategoryId
                                    ? t('listing.noFilteredPlaces')
                                    : t('listing.noCityPlaces')}
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

    filterSection: {
        marginBottom: 18,
    },

    filterChipsContent: {
        gap: 10,
        paddingRight: 4,
    },

    filterChip: {
        minHeight: 40,
        maxWidth: 180,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#ECECEC',
        alignItems: 'center',
        justifyContent: 'center',
    },

    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    filterChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#555',
    },

    filterChipTextActive: {
        color: colors.white,
    },

    clearFilterButton: {
        marginTop: 10,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 36,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: '#FFF1F1',
    },

    clearFilterText: {
        marginLeft: 4,
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },

    placeCard: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: 22,
        overflow: 'hidden',
    boxShadow: '0 6px 14px rgba(0,0,0,0.05)',
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
