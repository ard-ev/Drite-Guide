import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';

export default function LanguageSettingScreen() {
    const navigation = useNavigation();
    const [selectedLanguage, setSelectedLanguage] = useState('english');

    const languages = [
        {
            id: 'english',
            title: 'English',
            subtitle: 'App interface in English',
        },
        {
            id: 'deutsch',
            title: 'Deutsch',
            subtitle: 'App-Oberfläche auf Deutsch',
        },
        {
            id: 'albanian',
            title: 'Shqip',
            subtitle: 'Ndërfaqja e aplikacionit në shqip',
        },
    ];

    const handleSelectLanguage = (languageId) => {
        setSelectedLanguage(languageId);
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
                        <TouchableOpacity
                            style={styles.backButton}
                            activeOpacity={0.85}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={22} color="#222222" />
                        </TouchableOpacity>

                        <Text style={styles.title}>Language</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroCard}>
                        <Ionicons name="language-outline" size={42} color={colors.primary} />
                        <Text style={styles.heroTitle}>Choose your language</Text>
                        <Text style={styles.heroSubtitle}>
                            Select the language you want to use in the app.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        {languages.map((language) => {
                            const isSelected = selectedLanguage === language.id;

                            return (
                                <TouchableOpacity
                                    key={language.id}
                                    style={[
                                        styles.languageCard,
                                        isSelected && styles.languageCardActive,
                                    ]}
                                    activeOpacity={0.88}
                                    onPress={() => handleSelectLanguage(language.id)}
                                >
                                    <View style={styles.languageTextWrap}>
                                        <Text style={styles.languageTitle}>{language.title}</Text>
                                        <Text style={styles.languageSubtitle}>
                                            {language.subtitle}
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.radioOuter,
                                            isSelected && styles.radioOuterActive,
                                        ]}
                                    >
                                        {isSelected ? <View style={styles.radioInner} /> : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        activeOpacity={0.88}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.saveButtonText}>Save language</Text>
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

    languageCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },

    languageCardActive: {
        borderColor: colors.primary,
        backgroundColor: '#FFFFFF',
    },

    languageTextWrap: {
        flex: 1,
        marginRight: 14,
    },

    languageTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 4,
    },

    languageSubtitle: {
        fontSize: 13,
        lineHeight: 19,
        color: '#6B7280',
    },

    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    radioOuterActive: {
        borderColor: colors.primary,
    },

    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
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