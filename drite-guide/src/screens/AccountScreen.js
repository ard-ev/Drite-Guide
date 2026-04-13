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

export default function AccountScreen() {
    const navigation = useNavigation();

    // Später mit echtem Auth-State ersetzen
    const isLoggedIn = false;

    const accountSections = [
        {
            id: 'favourites',
            title: 'My Favourites',
            subtitle: isLoggedIn
                ? 'Your saved places across the app'
                : 'Saved locally on this device',
            icon: 'heart-outline',
            screen: 'Favourites',
        },
        {
            id: 'trips',
            title: 'My Trips',
            subtitle: 'Create and manage your saved travel lists',
            icon: 'briefcase-outline',
            screen: 'MyTrips',
        },
        {
            id: 'visited',
            title: 'Visited Places',
            subtitle: 'Track places you have already explored',
            icon: 'checkmark-circle-outline',
            screen: 'VisitedPlaces',
        },
    ];

    const settingsSections = [
        {
            id: 'language',
            title: 'Language',
            subtitle: 'English',
            icon: 'language-outline',
            screen: 'LanguageSettings',
        },
        {
            id: 'notifications',
            title: 'Notifications',
            subtitle: 'Manage alerts and updates',
            icon: 'notifications-outline',
            screen: 'NotificationsSettings',
        },
    ];

    const legalSections = [
        {
            id: 'privacy',
            title: 'Privacy Policy',
            subtitle: 'How we collect and use your data',
            icon: 'shield-checkmark-outline',
            screen: 'PrivacyPolicy',
        },
        {
            id: 'terms',
            title: 'Terms & Conditions',
            subtitle: 'Rules for using Dritë Guide',
            icon: 'document-text-outline',
            screen: 'TermsConditions',
        },
        {
            id: 'cookies',
            title: 'Cookie Policy',
            subtitle: 'Information about cookies and tracking',
            icon: 'analytics-outline',
            screen: 'CookiePolicy',
        },
        {
            id: 'legal',
            title: 'Legal Notice',
            subtitle: 'Company and legal information',
            icon: 'briefcase-outline',
            screen: 'LegalNotice',
        },
    ];

    const handlePress = (screen) => {
        if (!screen) return;
        navigation.navigate(screen);
    };

    const renderMenuItem = (item) => (
        <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            activeOpacity={0.85}
            onPress={() => handlePress(item.screen)}
        >
            <View style={styles.menuItemLeft}>
                <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={20} color="#222222" />
                </View>

                <View style={styles.menuTextWrap}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <StatusBar style="dark" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Account</Text>
                        <Ionicons
                            name="person-circle-outline"
                            size={24}
                            color="#222222"
                        />
                    </View>

                    {!isLoggedIn ? (
                        <View style={styles.authCard}>
                            <View style={styles.authIconWrap}>
                                <Ionicons
                                    name="person-circle-outline"
                                    size={64}
                                    color="#A1A1AA"
                                />
                            </View>

                            <Text style={styles.authTitle}>Log in or sign up</Text>
                            <Text style={styles.authSubtitle}>
                                Save your favourites, create trips and sync your activity across
                                devices.
                            </Text>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.primaryButtonText}>Log in</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.secondaryButtonText}>Sign up</Text>
                            </TouchableOpacity>

                            <View style={styles.syncHint}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={16}
                                    color={colors.primary}
                                />
                                <Text style={styles.syncHintText}>
                                    Favourites are currently saved locally on this device.
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.profileCard}>
                            <Image
                                source={{ uri: 'https://i.pravatar.cc/160?img=12' }}
                                style={styles.avatar}
                            />

                            <Text style={styles.profileName}>Ard</Text>
                            <Text style={styles.profileLocation}>Switzerland</Text>

                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>18</Text>
                                    <Text style={styles.statLabel}>Saved</Text>
                                </View>

                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>4</Text>
                                    <Text style={styles.statLabel}>Trips</Text>
                                </View>

                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>9</Text>
                                    <Text style={styles.statLabel}>Visited</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>My Activity</Text>
                        {accountSections.map(renderMenuItem)}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Settings</Text>
                        {settingsSections.map(renderMenuItem)}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Legal</Text>
                        {legalSections.map(renderMenuItem)}
                    </View>
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

    authCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        marginBottom: 28,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
        alignItems: 'center',
    },

    authIconWrap: {
        marginBottom: 10,
    },

    authTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222222',
        textAlign: 'center',
    },

    authSubtitle: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
    },

    primaryButton: {
        width: '100%',
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 10,
    },

    primaryButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },

    secondaryButton: {
        width: '100%',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
    },

    secondaryButtonText: {
        color: '#222222',
        fontSize: 15,
        fontWeight: '700',
    },

    syncHint: {
        marginTop: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    syncHintText: {
        fontSize: 13,
        color: '#6B7280',
    },

    profileCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        marginBottom: 28,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
        alignItems: 'center',
    },

    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
        marginBottom: 12,
    },

    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222222',
    },

    profileLocation: {
        marginTop: 4,
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 18,
    },

    statsRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },

    statBox: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
    },

    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222222',
    },

    statLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#6B7280',
    },

    section: {
        marginBottom: 28,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 12,
    },

    menuItem: {
        backgroundColor: colors.white,
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },

    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },

    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    menuTextWrap: {
        flex: 1,
    },

    menuTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#222222',
    },

    menuSubtitle: {
        marginTop: 2,
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },
});