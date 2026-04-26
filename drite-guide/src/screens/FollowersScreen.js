import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function FollowersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser, isLoggedIn } = useAuth();
  const listType =
    route.params?.listType || (route.name === 'FollowingList' ? 'following' : 'followers');
  const username = normalizeUsername(route.params?.username || '');
  const titleUsername = normalizeUsername(route.params?.titleUsername || username);
  const pageTitle = listType === 'following' ? 'Following' : 'Followers';

  const [followers, setFollowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState('');

  const loadFollowers = useCallback(async () => {
    if (!username) {
      setErrorMessage('Followers could not be loaded.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get(
        `/users/${encodeURIComponent(username)}/${listType}`
      );
      setFollowers(response.data || []);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        await extractApiErrorMessage(error, `${pageTitle} could not be loaded.`)
      );
    } finally {
      setIsLoading(false);
    }
  }, [listType, pageTitle, username]);

  useEffect(() => {
    loadFollowers();
  }, [loadFollowers]);

  const handleProfilePress = (user) => {
    navigation.navigate('Profile', {
      username: user.username,
      profile: user,
    });
  };

  const handleToggleFollow = async (user) => {
    const targetUsername = normalizeUsername(user?.username);

    if (!isLoggedIn || !targetUsername || updatingUsername) {
      return;
    }

    const isOwnUser =
      normalizeUsername(currentUser?.username) === targetUsername;

    if (isOwnUser) {
      return;
    }

    setUpdatingUsername(targetUsername);

    const previousFollowers = followers;
    const nextIsFollowing = !user.is_following;

    setFollowers((currentFollowers) =>
      currentFollowers.map((follower) =>
        normalizeUsername(follower.username) === targetUsername
          ? {
              ...follower,
              is_following: nextIsFollowing,
              followers_count: Math.max(
                0,
                (follower.followers_count || 0) + (nextIsFollowing ? 1 : -1)
              ),
            }
          : follower
      )
    );

    try {
      const response = nextIsFollowing
        ? await api.post(`/users/${encodeURIComponent(targetUsername)}/follow`)
        : await api.delete(`/users/${encodeURIComponent(targetUsername)}/follow`);

      setFollowers((currentFollowers) =>
        currentFollowers.map((follower) =>
          normalizeUsername(follower.username) === targetUsername
            ? response.data
            : follower
        )
      );
    } catch (error) {
      setFollowers(previousFollowers);
      setErrorMessage(
        await extractApiErrorMessage(error, 'Could not update follow status.')
      );
    } finally {
      setUpdatingUsername('');
    }
  };

  const renderFollower = (user) => {
    const targetUsername = normalizeUsername(user.username);
    const isOwnUser = normalizeUsername(currentUser?.username) === targetUsername;
    const showFollowButton = isLoggedIn && !isOwnUser;

    return (
      <TouchableOpacity
        key={user.id}
        style={styles.userRow}
        activeOpacity={0.85}
        onPress={() => handleProfilePress(user)}
      >
        <Image
          source={{
            uri:
              toAbsoluteAssetUrl(user.profile_picture_path) ||
              DEFAULT_PROFILE_PICTURE,
          }}
          style={styles.avatar}
        />

        <View style={styles.userText}>
          <Text style={styles.userName}>
            {user.first_name} {user.last_name}
          </Text>
          <Text style={styles.username}>@{user.username}</Text>
        </View>

        {showFollowButton ? (
          <TouchableOpacity
            style={[
              styles.followButton,
              user.is_following && styles.followButtonActive,
              updatingUsername === targetUsername && styles.followButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={updatingUsername === targetUsername}
            onPress={(event) => {
              event.stopPropagation?.();
              handleToggleFollow(user);
            }}
          >
            <Text
              style={[
                styles.followButtonText,
                user.is_following && styles.followButtonTextActive,
              ]}
            >
              {updatingUsername === targetUsername
                ? '...'
                : user.is_following
                  ? 'Following'
                  : 'Follow'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#222222" />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>{pageTitle}</Text>
            <Text style={styles.subtitle}>@{titleUsername}</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.helperText}>Loading {pageTitle.toLowerCase()}...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.emptyState}>
              <Text style={styles.helperText}>{errorMessage}</Text>
            </View>
          ) : followers.length > 0 ? (
            followers.map(renderFollower)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No {pageTitle.toLowerCase()} yet</Text>
              <Text style={styles.helperText}>
                {pageTitle} will appear here once this profile has any.
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
    backgroundColor: colors.gray,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.gray,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },

  headerSpacer: {
    width: 40,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },

  userText: {
    flex: 1,
  },

  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  username: {
    marginTop: 3,
    fontSize: 13,
    color: '#6B7280',
  },

  followButton: {
    minWidth: 88,
    minHeight: 38,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  followButtonTextActive: {
    color: colors.primary,
  },

  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
    textAlign: 'center',
  },

  helperText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
});
