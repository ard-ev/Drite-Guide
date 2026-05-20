import React, { useEffect, useMemo, useState } from 'react';
import {
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

const DEFAULT_NOTIFICATION_SETTINGS = {
    pushNotifications: true,
    tripUpdates: true,
    savedPlaceAlerts: false,
    newsAndTips: true,
    emailNotifications: false,
};

export default function NotificationSettingsScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { currentUser } = useAuth();

    const userStorageKey = useMemo(
        () => `${NOTIFICATION_SETTINGS_STORAGE_KEY}:${currentUser?.id || 'device'}`,
        [currentUser?.id]
    );
    const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);

    useEffect(() => {
        let isMounted = true;

        const loadSettings = async () => {
            try {
                const storedSettings = await safeGetItem(userStorageKey);
                const parsedSettings = storedSettings ? JSON.parse(storedSettings) : null;

                if (isMounted) {
                    setSettings({
                        ...DEFAULT_NOTIFICATION_SETTINGS,
                        ...(parsedSettings && typeof parsedSettings === 'object'
                            ? parsedSettings
                            : {}),
                    });
                }
            } catch (error) {
                console.warn('Could not load notification settings:', error?.message);
            }
        };

        loadSettings();

        return () => {
            isMounted = false;
        };
    }, [userStorageKey]);

    const updateSetting = async (settingKey, value) => {
        const nextSettings = {
            ...settings,
            [settingKey]: value,
        };

        setSettings(nextSettings);

        try {
            await safeSetItem(userStorageKey, JSON.stringify(nextSettings));
        } catch (error) {
            console.warn('Could not save notification settings:', error?.message);
        }
    };

    const renderSettingItem = ({
        id,
        title,
        subtitle,
        value,
        onValueChange,
        icon,
    }) => (
        <View key={id} style={styles.settingCard}>
            <View style={styles.settingLeft}>
                <View style={styles.iconWrap}>
                    <Ionicons name={icon} size={20} color="#222222" />
                </View>

                <View style={styles.settingTextWrap}>
                    <Text style={styles.settingTitle}>{title}</Text>
                    <Text style={styles.settingSubtitle}>{subtitle}</Text>
                </View>
            </View>

            <Switch
                value={value}
                onValueChange={onValueChange}
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
                            icon: 'airplane-outline',
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

                        {renderSettingItem({
                            id: 'news',
                            title: t('notifications.newsTitle'),
                            subtitle: t('notifications.newsSubtitle'),
                            value: settings.newsAndTips,
                            onValueChange: (value) => updateSetting('newsAndTips', value),
                            icon: 'newspaper-outline',
                        })}

                        {renderSettingItem({
                            id: 'email',
                            title: t('notifications.emailTitle'),
                            subtitle: t('notifications.emailSubtitle'),
                            value: settings.emailNotifications,
                            onValueChange: (value) => updateSetting('emailNotifications', value),
                            icon: 'mail-outline',
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
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
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
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
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

    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
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
