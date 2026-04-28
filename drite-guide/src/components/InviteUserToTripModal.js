import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../theme/colors';

export default function InviteUserToTripModal({ visible, onClose, onInvite }) {
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername('');
    }
  }, [visible]);

  const handleInvite = async () => {
    const normalizedUsername = username.trim().replace(/^@/, '');

    if (!normalizedUsername) {
      Alert.alert('Missing username', 'Enter the username you want to invite.');
      return;
    }

    setIsSaving(true);
    const result = await onInvite(normalizedUsername);
    setIsSaving(false);

    if (!result?.success) {
      Alert.alert('Invite failed', result?.message || 'Could not invite this user.');
      return;
    }

    onClose?.(result.member);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onClose?.()}>
      <Pressable style={styles.backdrop} onPress={() => onClose?.()}>
        <Pressable style={styles.card} onPress={() => null}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Invite User</Text>
              <Text style={styles.subtitle}>Invite someone you follow by username.</Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => onClose?.()}>
              <Ionicons name="close" size={20} color="#222222" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="exampleuser"
              placeholderTextColor="#A1A1AA"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.inviteButton, isSaving && styles.inviteButtonDisabled]}
              activeOpacity={0.88}
              onPress={handleInvite}
              disabled={isSaving}
            >
              <Ionicons name="person-add-outline" size={19} color="#FFFFFF" />
              <Text style={styles.inviteButtonText}>{isSaving ? 'Inviting...' : 'Invite User'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#222222',
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 250,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
  },
  input: {
    minHeight: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 14,
    color: '#222222',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    gap: 8,
  },
  inviteButtonDisabled: {
    opacity: 0.65,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
