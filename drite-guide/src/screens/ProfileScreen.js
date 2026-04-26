import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { api, extractApiErrorMessage } from '../services/api';

const DEFAULT_PROFILE_PICTURE =
  'https://placehold.co/240x240/E5E7EB/222222?text=DG';

const normalizeUsername = (value) =>
  String(value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser, isLoggedIn } = useAuth();
  const initialProfile = route.params?.profile || null;
  const initialOpenConnections = route.params?.openConnections || '';
  const hasOpenedInitialConnections = useRef(false);
  const username = normalizeUsername(
    route.params?.username || initialProfile?.username || ''
  );

  const [profile, setProfile] = useState(initialProfile);
  const [errorMessage, setErrorMessage] = useState('');
  const [followMessage, setFollowMessage] = useState('');
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [connectionMetric, setConnectionMetric] = useState('followers');
  const isOwnProfile =
    !!currentUser?.username &&
    !!(profile?.username || username) &&
    normalizeUsername(currentUser.username) ===
      normalizeUsername(profile?.username || username);
  const canShowFollowButton = !!(profile || username) && !isOwnProfile;
  const isFollowing = !!profile?.is_following;
  const displayUsername = normalizeUsername(profile?.username || username);
  const connectionCount =
    connectionMetric === 'followers'
      ? profile?.followers_count ?? 0
      : profile?.following_count ?? 0;
  const connectionLabel =
    connectionMetric === 'followers' ? 'Followers' : 'Following';

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) {
        setErrorMessage('Profile could not be loaded.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get(`/users/${encodeURIComponent(username)}`);
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

    loadProfile();
  }, [isLoggedIn, username]);

  const handleFollowPress = async () => {
    const targetUsername = normalizeUsername(profile?.username || username);

    if (!targetUsername || isFollowLoading) {
      return;
    }

    if (!isLoggedIn) {
      setFollowMessage('Please log in to follow users.');
      return;
    }

    setFollowMessage('');
    setIsFollowLoading(true);

    const previousProfile = profile;
    const nextIsFollowing = !isFollowing;
    setProfile({
      ...profile,
      is_following: nextIsFollowing,
      followers_count: Math.max(
        0,
        (profile.followers_count || 0) + (nextIsFollowing ? 1 : -1)
      ),
    });

    try {
      const profileUsername = encodeURIComponent(targetUsername);
      const response = nextIsFollowing
        ? await api.post(`/users/${profileUsername}/follow`)
        : await api.delete(`/users/${profileUsername}/follow`);
      const refreshedResponse = await api.get(`/users/${profileUsername}`);
      setProfile({
        ...response.data,
        ...refreshedResponse.data,
      });
    } catch (error) {
      setProfile(previousProfile);
      setFollowMessage(
        await extractApiErrorMessage(error, 'Could not update follow status.')
      );
    } finally {
      setIsFollowLoading(false);
    }
  };

  const openFollowersList = useCallback(() => {
    const profileUsername = normalizeUsername(profile?.username || username);

    if (!profileUsername) {
      return;
    }

    const isFollowingList = connectionMetric === 'following';

    navigation.navigate(isFollowingList ? 'FollowingList' : 'FollowersList', {
      username: profileUsername,
      titleUsername: profileUsername,
      listType: isFollowingList ? 'following' : 'followers',
    });
  }, [connectionMetric, navigation, profile?.username, username]);

  const toggleConnectionMetric = () => {
    setConnectionMetric((currentMetric) =>
      currentMetric === 'followers' ? 'following' : 'followers'
    );
  };

  const navigateToSavedTab = (initialTab) => {
    if (!isOwnProfile) {
      return;
    }

    const parentNavigation = navigation.getParent?.();
    const targetNavigation = parentNavigation || navigation;

    targetNavigation.navigate('Saved', {
      screen: 'SavedMain',
      params: { initialTab },
    });
  };

  useEffect(() => {
    if (
      hasOpenedInitialConnections.current ||
      initialOpenConnections !== 'followers' ||
      !profile?.username
    ) {
      return;
    }

    hasOpenedInitialConnections.current = true;
    openFollowersList();
  }, [initialOpenConnections, openFollowersList, profile?.username]);

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

            <Text style={styles.profileUsername}>@{displayUsername}</Text>
            <Text style={styles.profileEmail}>
              {profile?.email || 'No email available'}
            </Text>

            {canShowFollowButton ? (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followButtonActive,
                  isFollowLoading && styles.followButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={handleFollowPress}
                disabled={isFollowLoading}
              >
                <Ionicons
                  name={isFollowing ? 'checkmark' : 'person-add-outline'}
                  size={18}
                  color={isFollowing ? colors.primary : colors.white}
                />
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && styles.followButtonTextActive,
                  ]}
                >
                  {isFollowLoading
                    ? 'Updating...'
                    : isFollowing
                      ? 'Following'
                      : isLoggedIn
                        ? 'Follow'
                        : 'Log in to follow'}
                </Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statBox}
                activeOpacity={isOwnProfile ? 0.8 : 1}
                onPress={() => navigateToSavedTab('places')}
                disabled={!isOwnProfile}
              >
                <Text style={styles.statValue}>
                  {profile?.saved_places_count ?? 0}
                </Text>
                <Text style={styles.statLabel}>Saved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statBox}
                activeOpacity={isOwnProfile ? 0.8 : 1}
                onPress={() => navigateToSavedTab('trips')}
                disabled={!isOwnProfile}
              >
                <Text style={styles.statValue}>{profile?.trips_count ?? 0}</Text>
                <Text style={styles.statLabel}>Trips</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statBox}
                activeOpacity={0.8}
                onPress={openFollowersList}
                onLongPress={toggleConnectionMetric}
                delayLongPress={350}
              >
                <Text style={styles.statValue}>{connectionCount}</Text>
                <Text style={styles.statLabel}>{connectionLabel}</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <Text style={styles.helperText}>Loading profile...</Text>
            ) : errorMessage ? (
              <Text style={styles.helperText}>{errorMessage}</Text>
            ) : followMessage ? (
              <Text style={styles.helperText}>{followMessage}</Text>
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
    marginBottom: 14,
  },

  followButton: {
    minWidth: 150,
    minHeight: 46,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginBottom: 18,
    gap: 8,
  },

  followButtonActive: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  followButtonDisabled: {
    opacity: 0.7,
  },

  followButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },

  followButtonTextActive: {
    color: colors.primary,
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
