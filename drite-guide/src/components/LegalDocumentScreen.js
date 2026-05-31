import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTranslation } from '../context/TranslationContext';
import { getLegalCopy } from '../data/legalCopy';
import colors from '../theme/colors';

export default function LegalDocumentScreen({ documentKey }) {
  const navigation = useNavigation();
  const { language } = useTranslation();
  const { copy, icon } = getLegalCopy(documentKey, language);

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

            <Text style={styles.title}>{copy.title}</Text>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.heroCard}>
            <Ionicons name={icon} size={42} color={colors.primary} />
            <Text style={styles.heroTitle}>{copy.heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{copy.heroSubtitle}</Text>
          </View>

          {copy.sections.map((section) => (
            <View key={section.title} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.body.map((paragraph, index) => (
                <Text key={`${section.title}-${index}`} style={styles.sectionText}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
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
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
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

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
    boxShadow: '0 6px 12px rgba(0,0,0,0.04)',
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },

  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 10,
  },
});
