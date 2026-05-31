import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Pressable,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import ProfileAvatar from '../components/ProfileAvatar';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { getProfileByUsername } from '../services/profileService';
import { useTranslation } from '../context/TranslationContext';

const CONNECTION_LONG_PRESS_DELAY = 450;

export default function AccountScreen({ route }) {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const screenScrollRef = useRef(null);
    const refreshTripsRef = useRef(null);
    const connectionLongPressRef = useRef(false);
    const connectionPressTimerRef = useRef(null);
    const {
        currentUser,
        isLoggedIn,
        logout,
        getSavedPlaces,
        getTrips,
        getTripInvites,
        acceptTripInvite,
        declineTripInvite,
        refreshTrips,
        uploadProfilePicture,
        resetProfilePicture,
        defaultProfilePicture,
        currentLanguage,
    } = useAuth();
    const { t } = useTranslation();
    const savedPlaces = getSavedPlaces() || [];
    const trips = getTrips() || [];
    const tripInvites = getTripInvites?.() || [];
    const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
    const [profileStats, setProfileStats] = useState(null);
    const [connectionMetric, setConnectionMetric] = useState('followers');
    const [respondingInviteId, setRespondingInviteId] = useState(null);
    const refreshKey = route?.params?.refreshKey;
    const connectionCount =
        connectionMetric === 'followers'
            ? profileStats?.followers_count ?? currentUser?.followers_count ?? 0
            : profileStats?.following_count ?? currentUser?.following_count ?? 0;
    const connectionLabel =
        connectionMetric === 'followers'
            ? t('common.followers')
            : t('common.following');

    useEffect(() => {
        refreshTripsRef.current = refreshTrips;
    }, [refreshTrips]);

    useEffect(() => {
        if (!refreshKey) {
            return;
        }

        setShowProfilePictureModal(false);
        setConnectionMetric('followers');
        screenScrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [refreshKey]);

    useEffect(() => {
        let isMounted = true;

        const loadProfileStats = async () => {
            if (!isFocused || !isLoggedIn || !currentUser?.username) {
                if (isMounted && !isLoggedIn) {
                    setProfileStats(null);
                    setConnectionMetric('followers');
                }
                return;
            }

            try {
                if (isMounted) {
                    setProfileStats(
                        await getProfileByUsername(currentUser.username, currentUser.id)
                    );
                }
            } catch (_error) {
                if (isMounted) {
                    setProfileStats(null);
                }
            }
        };

        loadProfileStats();
        refreshTripsRef.current?.();

        return () => {
            isMounted = false;
        };
    }, [currentUser?.id, currentUser?.username, isFocused, isLoggedIn]);

    const settingsSections = [
        {
            id: 'language',
            title: t('account.language'),
            subtitle: (currentUser?.preferred_language || currentLanguage || 'en').toUpperCase?.() || 'EN',
            icon: 'language-outline',
            screen: 'LanguageSettings',
        },
        {
            id: 'notifications',
            title: t('account.notifications'),
            subtitle: t('account.notificationsSubtitle'),
            icon: 'notifications-outline',
            screen: 'NotificationsSettings',
        },
    ];

    const legalSections = [
        {
            id: 'privacy',
            title: t('account.privacyPolicy'),
            subtitle: t('account.privacySubtitle'),
            icon: 'shield-checkmark-outline',
            screen: 'PrivacyPolicy',
        },
        {
            id: 'terms',
            title: t('account.terms'),
            subtitle: t('account.termsSubtitle'),
            icon: 'document-text-outline',
            screen: 'TermsConditions',
        },
        {
            id: 'cookies',
            title: t('account.cookies'),
            subtitle: t('account.cookiesSubtitle'),
            icon: 'analytics-outline',
            screen: 'CookiePolicy',
        },
        {
            id: 'legal',
            title: t('account.legalNotice'),
            subtitle: t('account.legalNoticeSubtitle'),
            icon: 'briefcase-outline',
            screen: 'LegalNotice',
        },
    ];

    const handlePress = (screen) => {
        if (!screen) return;
        navigation.navigate(screen);
    };

    const navigateToSavedTab = (initialTab) => {
        const parentNavigation = navigation.getParent?.();
        const targetNavigation = parentNavigation || navigation;

        targetNavigation.navigate('Saved', {
            screen: 'SavedMain',
            params: { initialTab },
        });
    };

    const openConnectionsList = () => {
        if (!currentUser?.username) {
            return;
        }

        const isFollowingList = connectionMetric === 'following';

        navigation.navigate(isFollowingList ? 'FollowingList' : 'FollowersList', {
            username: currentUser?.username,
            titleUsername: currentUser?.username,
            listType: isFollowingList ? 'following' : 'followers',
        });
    };

    const toggleConnectionMetric = () => {
        setConnectionMetric((currentMetric) =>
            currentMetric === 'followers' ? 'following' : 'followers'
        );
    };

    const clearConnectionPressTimer = useCallback(() => {
        if (!connectionPressTimerRef.current) {
            return;
        }

        clearTimeout(connectionPressTimerRef.current);
        connectionPressTimerRef.current = null;
    }, []);

    useEffect(() => {
        return clearConnectionPressTimer;
    }, [clearConnectionPressTimer]);

    const handleConnectionPressIn = () => {
        clearConnectionPressTimer();
        connectionLongPressRef.current = false;

        connectionPressTimerRef.current = setTimeout(() => {
            connectionPressTimerRef.current = null;
            connectionLongPressRef.current = true;
            toggleConnectionMetric();
        }, CONNECTION_LONG_PRESS_DELAY);
    };

    const handleConnectionPress = () => {
        if (connectionLongPressRef.current) {
            connectionLongPressRef.current = false;
            return;
        }

        openConnectionsList();
    };

    const handleConnectionPressOut = () => {
        clearConnectionPressTimer();
    };

    const handleLogout = () => {
        logout();
    };

    const handlePickedAsset = async (asset) => {
        const result = await uploadProfilePicture(asset);

        if (!result.success) {
            Alert.alert(t('account.profilePicture'), result.message);
            return;
        }

        setShowProfilePictureModal(false);
    };

    const handleResetProfilePicture = async () => {
        const result = await resetProfilePicture();

        if (!result.success) {
            Alert.alert(t('account.profilePicture'), result.message);
            return;
        }

        setShowProfilePictureModal(false);
    };

    const handleAcceptTripInvite = async (trip) => {
        if (!trip?.id || respondingInviteId) {
            return;
        }

        setRespondingInviteId(trip.id);
        const result = await acceptTripInvite(trip.id);
        setRespondingInviteId(null);

        if (!result.success) {
            Alert.alert('Invite failed', result.message);
            return;
        }

        Alert.alert('Trip accepted', 'The trip is now visible in your Trips.');
    };

    const handleDeclineTripInvite = (trip) => {
        if (!trip?.id || respondingInviteId) {
            return;
        }

        Alert.alert(
            'Decline invite',
            'Remove this trip invite from your profile?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                        setRespondingInviteId(trip.id);
                        const result = await declineTripInvite(trip.id);
                        setRespondingInviteId(null);

                        if (!result.success) {
                            Alert.alert('Invite failed', result.message);
                        }
                    },
                },
            ]
        );
    };

    const pickFromLibrary = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(t('account.permissionNeeded'), t('account.allowPhotoLibrary'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
            base64: true,
        });

        if (result.canceled || !result.assets?.[0]) {
            return;
        }

        await handlePickedAsset(result.assets[0]);
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
            Alert.alert(t('account.permissionNeeded'), t('account.allowCamera'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
            base64: true,
        });

        if (result.canceled || !result.assets?.[0]) {
            return;
        }

        await handlePickedAsset(result.assets[0]);
    };

    const pickFromFiles = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['image/jpeg', 'image/png', 'image/webp'],
            multiple: false,
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets?.[0]) {
            return;
        }

        await handlePickedAsset(result.assets[0]);
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
                    ref={screenScrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                >
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{t('account.title')}</Text>
                        <Ionicons name="person-circle-outline" size={24} color="#222222" />
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

                            <Text style={styles.authTitle}>{t('account.authTitle')}</Text>
                            <Text style={styles.authSubtitle}>
                                {t('account.authSubtitle')}
                            </Text>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.88}
                                onPress={() => handlePress('Login')}
                            >
                                <Text style={styles.primaryButtonText}>{t('account.login')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                activeOpacity={0.88}
                                onPress={() => handlePress('Signup')}
                            >
                                <Text style={styles.secondaryButtonText}>{t('account.signup')}</Text>
                            </TouchableOpacity>

                            <View style={styles.syncHint}>
                                <Ionicons
                                    name="information-circle-outline"
                                    size={16}
                                    color={colors.primary}
                                />
                                <Text style={styles.syncHintText}>
                                    {t('account.syncHint')}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <>
                            <View style={styles.profileCard}>
                                <ProfileAvatar
                                    profilePicturePath={currentUser?.profile_picture_path}
                                    fallbackUri={defaultProfilePicture}
                                    style={styles.avatar}
                                />

                                <TouchableOpacity
                                    style={styles.changePhotoButton}
                                    activeOpacity={0.88}
                                    onPress={() => setShowProfilePictureModal(true)}
                                >
                                    <Ionicons name="camera-outline" size={16} color={colors.primary} />
                                    <Text style={styles.changePhotoButtonText}>{t('account.changePhoto')}</Text>
                                </TouchableOpacity>

                                <Text style={styles.profileName}>
                                    {currentUser?.first_name} {currentUser?.last_name}
                                </Text>

                                <Text style={styles.profileUsername}>
                                    @{currentUser?.username}
                                </Text>

                                <Text style={styles.profileEmail}>
                                    {currentUser?.email}
                                </Text>

                                <View style={styles.statsRow}>
                                    <TouchableOpacity
                                        style={styles.statBox}
                                        activeOpacity={0.8}
                                        onPress={() => navigateToSavedTab('places')}
                                    >
                                        <Text style={styles.statValue}>
                                            {savedPlaces.length || 0}
                                        </Text>
                                        <Text style={styles.statLabel}>{t('common.saved')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.statBox}
                                        activeOpacity={0.8}
                                        onPress={() => handlePress('Trips')}
                                    >
                                        <Text style={styles.statValue}>{trips.length}</Text>
                                        <Text style={styles.statLabel}>{t('common.trips')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.statBox,
                                            styles.connectionStatBox,
                                            connectionMetric === 'following' &&
                                                styles.connectionStatBoxActive,
                                        ]}
                                        activeOpacity={0.8}
                                        onPress={handleConnectionPress}
                                        onPressIn={handleConnectionPressIn}
                                        onPressOut={handleConnectionPressOut}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${connectionLabel}: ${connectionCount}`}
                                    >
                                        <Text
                                            style={[
                                                styles.statValue,
                                                connectionMetric === 'following' &&
                                                    styles.connectionStatValueActive,
                                            ]}
                                        >
                                            {connectionCount}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.statLabel,
                                                connectionMetric === 'following' &&
                                                    styles.connectionStatLabelActive,
                                            ]}
                                        >
                                            {connectionLabel}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.logoutButton}
                                    activeOpacity={0.88}
                                    onPress={handleLogout}
                                >
                                    <Text style={styles.logoutButtonText}>{t('account.logout')}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Trips</Text>
                                {tripInvites.length > 0 ? (
                                    <View style={styles.inviteStack}>
                                        {tripInvites.map((trip) => {
                                            const owner = (trip.members || []).find(
                                                (member) => member.role === 'owner'
                                            )?.user;
                                            const isResponding = respondingInviteId === trip.id;

                                            return (
                                                <View key={trip.id} style={styles.inviteCard}>
                                                    <View style={styles.inviteIconWrap}>
                                                        <Ionicons name="mail-unread-outline" size={20} color={colors.primary} />
                                                    </View>
                                                    <View style={styles.inviteContent}>
                                                        <Text style={styles.inviteLabel}>Trip invite</Text>
                                                        <Text style={styles.inviteTitle}>{trip.title}</Text>
                                                        <Text style={styles.inviteSubtitle} numberOfLines={2}>
                                                            {owner?.username
                                                                ? `Invited by @${owner.username}`
                                                                : 'A friend invited you to this trip.'}
                                                        </Text>
                                                        <View style={styles.inviteActions}>
                                                            <TouchableOpacity
                                                                style={[
                                                                    styles.inviteActionButton,
                                                                    isResponding && styles.inviteActionDisabled,
                                                                ]}
                                                                activeOpacity={0.86}
                                                                disabled={isResponding}
                                                                onPress={() => handleAcceptTripInvite(trip)}
                                                            >
                                                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                                <Text style={styles.inviteActionText}>
                                                                    {isResponding ? 'Saving...' : 'Accept'}
                                                                </Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[
                                                                    styles.inviteDeclineButton,
                                                                    isResponding && styles.inviteActionDisabled,
                                                                ]}
                                                                activeOpacity={0.86}
                                                                disabled={isResponding}
                                                                onPress={() => handleDeclineTripInvite(trip)}
                                                            >
                                                                <Ionicons name="close" size={16} color={colors.primary} />
                                                                <Text style={styles.inviteDeclineText}>Decline</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : null}
                                <TouchableOpacity
                                    style={styles.menuItem}
                                    activeOpacity={0.85}
                                    onPress={() => handlePress('Trips')}
                                >
                                    <View style={styles.menuItemLeft}>
                                        <View style={styles.iconWrap}>
                                            <Ionicons name="map-outline" size={20} color="#222222" />
                                        </View>

                                        <View style={styles.menuTextWrap}>
                                            <Text style={styles.menuTitle}>Trips</Text>
                                            <Text style={styles.menuSubtitle}>
                                                Plan date ranges, places, invited users, and shared notes.
                                            </Text>
                                        </View>
                                    </View>

                                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{t('account.settings')}</Text>
                                {settingsSections.map(renderMenuItem)}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{t('account.legal')}</Text>
                                {legalSections.map(renderMenuItem)}
                            </View>
                        </>
                    )}
                </ScrollView>

                <Modal
                    visible={showProfilePictureModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowProfilePictureModal(false)}
                >
                    <Pressable
                        style={styles.modalBackdrop}
                        onPress={() => setShowProfilePictureModal(false)}
                    >
                        <Pressable style={styles.modalCard} onPress={() => null}>
                            <Text style={styles.modalTitle}>{t('account.chooseProfilePicture')}</Text>
                            <Text style={styles.modalSubtitle}>
                                {t('account.chooseProfileSubtitle')}
                            </Text>

                            <TouchableOpacity
                                style={styles.sourceButton}
                                activeOpacity={0.88}
                                onPress={pickFromLibrary}
                            >
                                <Ionicons name="images-outline" size={18} color={colors.primary} />
                                <Text style={styles.sourceButtonText}>{t('account.mediaLibrary')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sourceButton}
                                activeOpacity={0.88}
                                onPress={takePhoto}
                            >
                                <Ionicons name="camera-outline" size={18} color={colors.primary} />
                                <Text style={styles.sourceButtonText}>{t('account.takePhoto')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sourceButton}
                                activeOpacity={0.88}
                                onPress={pickFromFiles}
                            >
                                <Ionicons name="document-outline" size={18} color={colors.primary} />
                                <Text style={styles.sourceButtonText}>{t('account.chooseFiles')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.resetButton}
                                activeOpacity={0.88}
                                onPress={handleResetProfilePicture}
                            >
                                <Text style={styles.resetButtonText}>{t('account.defaultPicture')}</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </Modal>
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
    boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
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
        flex: 1,
    },

    profileCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        marginBottom: 28,
    boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
        elevation: 4,
        alignItems: 'center',
    },

    avatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
        marginBottom: 12,
    },

    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDECEC',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
        gap: 6,
    },

    changePhotoButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },

    profileName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222222',
        textAlign: 'center',
    },

    profileUsername: {
        marginTop: 4,
        fontSize: 14,
        color: '#6B7280',
    },

    profileEmail: {
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

    connectionStatBox: {
        borderWidth: 1,
        borderColor: 'transparent',
    },

    connectionStatBoxActive: {
        backgroundColor: '#FFF5F5',
        borderColor: colors.primary,
    },

    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222222',
    },

    connectionStatValueActive: {
        color: colors.primary,
    },

    statLabel: {
        marginTop: 4,
        fontSize: 12,
        color: '#6B7280',
    },

    connectionStatLabelActive: {
        color: colors.primary,
        fontWeight: '700',
    },

    logoutButton: {
        width: '100%',
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 18,
    },

    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
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

    inviteStack: {
        gap: 10,
        marginBottom: 10,
    },

    inviteCard: {
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        boxShadow: '0 6px 12px rgba(0,0,0,0.04)',
        elevation: 2,
    },

    inviteIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: '#FDECEC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    inviteContent: {
        flex: 1,
    },

    inviteLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.primary,
        textTransform: 'uppercase',
    },

    inviteTitle: {
        marginTop: 3,
        fontSize: 16,
        fontWeight: '800',
        color: '#222222',
    },

    inviteSubtitle: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
    },

    inviteActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },

    inviteActionButton: {
        minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 13,
        paddingHorizontal: 13,
        gap: 5,
    },

    inviteDeclineButton: {
        minHeight: 38,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FDECEC',
        borderRadius: 13,
        paddingHorizontal: 13,
        gap: 5,
    },

    inviteActionDisabled: {
        opacity: 0.55,
    },

    inviteActionText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    inviteDeclineText: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.primary,
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
    boxShadow: '0 6px 12px rgba(0,0,0,0.04)',
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

    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.28)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 22,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222222',
    },

    modalSubtitle: {
        marginTop: 6,
        marginBottom: 18,
        fontSize: 14,
        lineHeight: 21,
        color: '#6B7280',
    },

    sourceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
        gap: 10,
    },

    sourceButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222222',
    },

    resetButton: {
        marginTop: 8,
        alignItems: 'center',
        paddingVertical: 8,
    },

    resetButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
});
