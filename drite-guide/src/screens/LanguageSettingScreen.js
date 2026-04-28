import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';
import { translate } from '../i18n/translations';

export default function LanguageSettingScreen() {
  const navigation = useNavigation();
  const {
    currentLanguage,
    languages,
    refreshLanguages,
    updateLanguage,
  } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const didLoadLanguages = useRef(false);

  const copy = (key, params) => translate(selectedLanguage, key, params);

  useEffect(() => {
    if (didLoadLanguages.current) {
      return;
    }

    didLoadLanguages.current = true;
    refreshLanguages();
  }, [refreshLanguages]);

  useEffect(() => {
    setSelectedLanguage(currentLanguage || 'en');
  }, [currentLanguage]);

  const languageOptions = useMemo(
    () =>
      languages.map((language) => {
        const optionTitle = translate(
          selectedLanguage,
          `language.options.${language.code}.title`
        );
        const optionSubtitle = translate(
          selectedLanguage,
          `language.options.${language.code}.subtitle`
        );
        const meta = optionTitle.startsWith('language.options.')
          ? {
              title: language.name,
              subtitle: language.name,
            }
          : {
              title: optionTitle,
              subtitle: optionSubtitle,
            };

        return {
          id: language.code,
          ...meta,
        };
      }),
    [languages, selectedLanguage]
  );

  const handleSaveLanguage = async () => {
    setIsSaving(true);
    const result = await updateLanguage(selectedLanguage);
    setIsSaving(false);

    if (!result.success) {
      Alert.alert(copy('language.title'), result.message);
      return;
    }

    Alert.alert(copy('language.saved'), copy('language.savedMessage'), [
      { text: copy('common.ok'), onPress: () => navigation.goBack() },
    ]);
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

            <Text style={styles.title}>{copy('language.title')}</Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.heroCard}>
            <Ionicons name="language-outline" size={42} color={colors.primary} />
            <Text style={styles.heroTitle}>{copy('language.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{copy('language.heroSubtitle')}</Text>
          </View>

          <View style={styles.section}>
            {languageOptions.map((language) => {
              const isSelected = selectedLanguage === language.id;

              return (
                <TouchableOpacity
                  key={language.id}
                  style={[
                    styles.languageCard,
                    isSelected && styles.languageCardActive,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedLanguage(language.id)}
                >
                  <View style={styles.languageTextWrap}>
                    <Text style={styles.languageTitle}>{language.title}</Text>
                    <Text style={styles.languageSubtitle}>{language.subtitle}</Text>
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
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            activeOpacity={isSaving ? 1 : 0.88}
            disabled={isSaving}
            onPress={handleSaveLanguage}
          >
            <Text style={styles.saveButtonText}>{copy('language.save')}</Text>
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
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
