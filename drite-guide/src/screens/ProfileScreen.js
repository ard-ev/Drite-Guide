import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import colors from '../theme/colors';
import { toAbsoluteAssetUrl } from '../config/api';
import { api, extractApiErrorMessage } from '../services/api';

const DEFAULT_PROFILE_PICTURE =
  'https://placehold.co/240x240/E5E7EB/222222?text=DG';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialProfile = route.params?.profile || null;
  const username = route.params?.username || initialProfile?.username || '';

  const [profile, setProfile] = useState(initialProfile);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(!initialProfile);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        setErrorMessage('Profile could not be loaded.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get(`/users/${username}`);
        setProfile(response.data);
        setErrorMessage('');
      } catch (error) {
        setErrorMessage(
          await extractApiErrorMessage(error, 'Profile could not be loaded.')
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!initialProfile) {
      loadProfile();
    }
  }, [initialProfile, username]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#222222" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.profileCard}>
            <Image
              source={{
                uri:
                  toAbsoluteAssetUrl(profile?.profile_picture_path) ||
                  DEFAULT_PROFILE_PICTURE,
              }}
              style={styles.avatar}
            />

            <Text style={styles.profileName}>
              {profile
                ? `${profile.first_name} ${profile.last_name}`
                : 'Profile'}
            </Text>

            <Text style={styles.profileUsername}>@{profile?.username || username}</Text>
            <Text style={styles.profileEmail}>
              {profile?.email || 'No email available'}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {profile?.saved_places_count ?? 0}
                </Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{profile?.trips_count ?? 0}</Text>
                <Text style={styles.statLabel}>Trips</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {profile?.followers_count ?? 0}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
            </View>

            {isLoading ? (
              <Text style={styles.helperText}>Loading profile...</Text>
            ) : errorMessage ? (
              <Text style={styles.helperText}>{errorMessage}</Text>
            ) : null}
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

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },

  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    marginLeft: 4,
  },

  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 14,
    backgroundColor: '#E5E7EB',
  },

  profileName: {
    fontSize: 24,
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

  helperText: {
    marginTop: 18,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
});
