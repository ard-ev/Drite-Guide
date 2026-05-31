import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';
import { useTranslation } from '../context/TranslationContext';
import { useAuth } from '../context/AuthContext';
import { safeGetItem, safeSetItem } from '../utils/storage';

const NOTIFICATION_SETTINGS_STORAGE_KEY = '@drite_guide_notification_settings';
const DEFAULT_NOTIFICATION_FROM_EMAIL = 'info@driteguide.com';

const DEFAULT_NOTIFICATION_SETTINGS = {
    pushNotifications: true,
    tripUpdates: true,
    savedPlaceAlerts: false,
    newsAndTips: false,
    emailNotifications: false,
};

const applyEmailVerificationGate = (nextSettings, canManageEmailContent) => {
    if (canManageEmailContent) {
        return nextSettings;
    }

    return {
        ...nextSettings,
        newsAndTips: false,
        emailNotifications: false,
    };
};

export default function NotificationSettingsScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const canManageEmailContent = !!currentUser?.email_verified;

    const userStorageKey = useMemo(
        () => `${NOTIFICATION_SETTINGS_STORAGE_KEY}:${currentUser?.id || 'device'}`,
        [currentUser?.id]
    );
    const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);
    const [notificationFromEmail, setNotificationFromEmail] = useState(
        DEFAULT_NOTIFICATION_FROM_EMAIL
    );

    useEffect(() => {
        let isMounted = true;

        const loadSettings = async () => {
            try {
                const storedSettings = await safeGetItem(userStorageKey);
                const parsedSettings = storedSettings ? JSON.parse(storedSettings) : null;
                const nextSettings = {
                    ...DEFAULT_NOTIFICATION_SETTINGS,
                    ...(parsedSettings && typeof parsedSettings === 'object'
                        ? parsedSettings
                        : {}),
                };

                if (isMounted) {
                    setNotificationFromEmail(DEFAULT_NOTIFICATION_FROM_EMAIL);
                    setSettings(
                        applyEmailVerificationGate(
                            nextSettings,
                            !!currentUser?.email_verified
                        )
                    );
                }
            } catch (error) {
                console.warn('Could not load notification settings:', error?.message);
            }
        };

        loadSettings();

        return () => {
            isMounted = false;
        };
    }, [currentUser, userStorageKey]);

    const updateSetting = async (settingKey, value) => {
        const isEmailContentSetting =
            settingKey === 'newsAndTips' || settingKey === 'emailNotifications';

        if (isEmailContentSetting && !canManageEmailContent) {
            const title = currentUser
                ? t('notifications.emailUnverifiedTitle')
                : t('notifications.emailLoginRequiredTitle');
            const message = currentUser
                ? t('notifications.emailUnverifiedText', {
                    email: currentUser?.email || t('common.noEmail'),
                    fromEmail: notificationFromEmail,
                })
                : t('notifications.emailLoginRequiredText', {
                    fromEmail: notificationFromEmail,
                });

            Alert.alert(title, message);
            return;
        }

        const nextSettings = applyEmailVerificationGate({
            ...settings,
            [settingKey]: value,
        }, canManageEmailContent);

        setSettings(nextSettings);

        try {
            await safeSetItem(userStorageKey, JSON.stringify(nextSettings));
        } catch (error) {
            console.warn('Could not save notification settings:', error?.message);
        }
    };

    const emailContentDisabledSubtitle = currentUser
        ? t('notifications.emailContentDisabledSubtitle')
        : t('notifications.emailContentLoginSubtitle');

    const renderSettingItem = ({
        id,
        title,
        subtitle,
        value,
        onValueChange,
        icon,
        disabled = false,
        disabledSubtitle,
    }) => (
        <View
            key={id}
            style={[
                styles.settingCard,
                disabled && styles.settingCardDisabled,
            ]}
        >
            <View style={styles.settingLeft}>
                <View style={styles.iconWrap}>
                    <Ionicons
                        name={icon}
                        size={20}
                        color={disabled ? '#9CA3AF' : '#222222'}
                    />
                </View>

                <View style={styles.settingTextWrap}>
                    <Text
                        style={[
                            styles.settingTitle,
                            disabled && styles.settingTextDisabled,
                        ]}
                    >
                        {title}
                    </Text>
                    <Text
                        style={[
                            styles.settingSubtitle,
                            disabled && styles.settingTextDisabled,
                        ]}
                    >
                        {disabled && disabledSubtitle ? disabledSubtitle : subtitle}
                    </Text>
                </View>
            </View>

            <Switch
                value={value}
                onValueChange={disabled ? undefined : onValueChange}
                disabled={disabled}
                trackColor={{ false: '#E5E7EB', true: colors.primary }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
            />
        </View>
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
                        <TouchableOpacity
                            style={styles.backButton}
                            activeOpacity={0.85}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={22} color="#222222" />
                        </TouchableOpacity>

                        <Text style={styles.title}>{t('notifications.title')}</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroCard}>
                        <Ionicons
                            name="notifications-outline"
                            size={42}
                            color={colors.primary}
                        />
                        <Text style={styles.heroTitle}>{t('notifications.heroTitle')}</Text>
                        <Text style={styles.heroSubtitle}>
                            {t('notifications.heroSubtitle')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('notifications.appSection')}</Text>

                        {renderSettingItem({
                            id: 'push',
                            title: t('notifications.pushTitle'),
                            subtitle: t('notifications.pushSubtitle'),
                            value: settings.pushNotifications,
                            onValueChange: (value) => updateSetting('pushNotifications', value),
                            icon: 'phone-portrait-outline',
                        })}

                        {renderSettingItem({
                            id: 'tripUpdates',
                            title: t('notifications.tripTitle'),
                            subtitle: t('notifications.tripSubtitle'),
                            value: settings.tripUpdates,
                            onValueChange: (value) => updateSetting('tripUpdates', value),
                            icon: 'map-outline',
                        })}

                        {renderSettingItem({
                            id: 'savedPlaces',
                            title: t('notifications.savedPlacesTitle'),
                            subtitle: t('notifications.savedPlacesSubtitle'),
                            value: settings.savedPlaceAlerts,
                            onValueChange: (value) => updateSetting('savedPlaceAlerts', value),
                            icon: 'bookmark-outline',
                        })}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('notifications.emailSection')}</Text>

                        <View style={styles.emailSourceCard}>
                            <View
                                style={[
                                    styles.emailSourceIconWrap,
                                    canManageEmailContent && styles.emailSourceIconWrapVerified,
                                ]}
                            >
                                <Ionicons
                                    name={
                                        canManageEmailContent
                                            ? 'shield-checkmark-outline'
                                            : 'mail-unread-outline'
                                    }
                                    size={20}
                                    color={canManageEmailContent ? '#047857' : colors.primary}
                                />
                            </View>

                            <View style={styles.emailSourceTextWrap}>
                                <Text style={styles.emailSourceTitle}>
                                    {currentUser
                                        ? canManageEmailContent
                                            ? t('notifications.emailVerifiedTitle')
                                            : t('notifications.emailUnverifiedTitle')
                                        : t('notifications.emailLoginRequiredTitle')}
                                </Text>
                                <Text style={styles.emailSourceText}>
                                    {currentUser
                                        ? canManageEmailContent
                                            ? t('notifications.emailVerifiedText', {
                                                email: currentUser?.email || t('common.noEmail'),
                                                fromEmail: notificationFromEmail,
                                            })
                                            : t('notifications.emailUnverifiedText', {
                                                email: currentUser?.email || t('common.noEmail'),
                                                fromEmail: notificationFromEmail,
                                            })
                                        : t('notifications.emailLoginRequiredText', {
                                            fromEmail: notificationFromEmail,
                                        })}
                                </Text>
                            </View>
                        </View>

                        {renderSettingItem({
                            id: 'news',
                            title: t('notifications.newsTitle'),
                            subtitle: t('notifications.newsSubtitle'),
                            value: settings.newsAndTips,
                            onValueChange: (value) => updateSetting('newsAndTips', value),
                            icon: 'newspaper-outline',
                            disabled: !canManageEmailContent,
                            disabledSubtitle: emailContentDisabledSubtitle,
                        })}

                        {renderSettingItem({
                            id: 'email',
                            title: t('notifications.emailTitle'),
                            subtitle: t('notifications.emailSubtitle', {
                                email: notificationFromEmail,
                            }),
                            value: settings.emailNotifications,
                            onValueChange: (value) => updateSetting('emailNotifications', value),
                            icon: 'mail-outline',
                            disabled: !canManageEmailContent,
                            disabledSubtitle: emailContentDisabledSubtitle,
                        })}
                    </View>

                    <View style={styles.infoCard}>
                        <Ionicons
                            name="information-circle-outline"
                            size={18}
                            color={colors.primary}
                        />
                        <Text style={styles.infoText}>
                            {t('notifications.info')}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        activeOpacity={0.88}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.saveButtonText}>{t('notifications.save')}</Text>
                    </TouchableOpacity>
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

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
        elevation: 2,
    },

    headerSpacer: {
        width: 42,
        height: 42,
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222222',
    },

    heroCard: {
        backgroundColor: colors.primary + '12',
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 22,
        marginBottom: 24,
        alignItems: 'center',
    },

    heroTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#222222',
        marginTop: 12,
        marginBottom: 6,
        textAlign: 'center',
    },

    heroSubtitle: {
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
        textAlign: 'center',
    },

    section: {
        marginBottom: 24,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 12,
    },

    settingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    boxShadow: '0 6px 12px rgba(0,0,0,0.04)',
        elevation: 2,
    },

    settingCardDisabled: {
        opacity: 0.7,
    },

    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 14,
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

    settingTextWrap: {
        flex: 1,
    },

    settingTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 3,
    },

    settingSubtitle: {
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
    },

    settingTextDisabled: {
        color: '#9CA3AF',
    },

    emailSourceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
    boxShadow: '0 6px 12px rgba(0,0,0,0.04)',
        elevation: 2,
    },

    emailSourceIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    emailSourceIconWrapVerified: {
        backgroundColor: '#D1FAE5',
    },

    emailSourceTextWrap: {
        flex: 1,
    },

    emailSourceTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 4,
    },

    emailSourceText: {
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
    },

    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
    boxShadow: '0 6px 12px rgba(0,0,0,0.04)',
        elevation: 2,
    },

    infoText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        lineHeight: 20,
        color: '#6B7280',
    },

    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
