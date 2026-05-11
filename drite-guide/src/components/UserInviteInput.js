import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../services/api';
import colors from '../theme/colors';

const normalizeUsername = (value) => String(value || '').trim().replace(/^@+/, '');

function getActiveInviteToken(value, multiple) {
  const rawValue = String(value || '');

  if (!multiple) {
    return normalizeUsername(rawValue);
  }

  const parts = rawValue.split(/[\s,]+/);
  return normalizeUsername(parts[parts.length - 1]);
}

function applySelectedUsername(value, username, multiple) {
  const normalizedUsername = normalizeUsername(username);

  if (!multiple) {
    return normalizedUsername;
  }

  const rawValue = String(value || '');
  const match = rawValue.match(/^(.*?)([^\s,]*)$/);
  const prefix = match?.[1] || '';
  return `${prefix}${normalizedUsername}, `;
}

export default function UserInviteInput({
  value,
  onChangeText,
  multiple = false,
  placeholder,
  inputStyle,
  onFocus,
  onLayout,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const requestIdRef = useRef(0);
  const query = useMemo(() => getActiveInviteToken(value, multiple), [multiple, value]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (query.length < 1 || !isFocused) {
      setSuggestions([]);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get('/users/search', {
          params: { q: query },
        });

        if (requestId === requestIdRef.current) {
          setSuggestions((response.data || []).slice(0, 5));
        }
      } catch (_error) {
        if (requestId === requestIdRef.current) {
          setSuggestions([]);
        }
      }
    }, 220);

    return () => clearTimeout(timeoutId);
  }, [isFocused, query]);

  const handleSelectSuggestion = (user) => {
    const username = user?.username;
    if (!username) {
      return;
    }

    onChangeText?.(applySelectedUsername(value, username, multiple));
    setSuggestions([]);
  };

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={inputStyle}
        value={value}
        onChangeText={onChangeText}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={() => {
          window.setTimeout(() => setIsFocused(false), 160);
        }}
        onLayout={onLayout}
        placeholder={placeholder}
        placeholderTextColor="#A1A1AA"
        autoCapitalize="none"
      />

      {suggestions.length > 0 ? (
        <View style={styles.suggestionsPanel}>
          {suggestions.map((user) => (
            <TouchableOpacity
              key={user.id || user.username}
              style={styles.suggestionRow}
              activeOpacity={0.86}
              onPress={() => handleSelectSuggestion(user)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.username || '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>

              <View style={styles.suggestionContent}>
                <Text style={styles.username}>@{user.username}</Text>
                <Text style={styles.fullName} numberOfLines={1}>
                  {[user.first_name, user.last_name].filter(Boolean).join(' ') || 'Drite Guide user'}
                </Text>
              </View>

              <Ionicons name="add-circle-outline" size={19} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 20,
  },
  suggestionsPanel: {
    marginTop: -8,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  suggestionRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  suggestionContent: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222222',
  },
  fullName: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
});
