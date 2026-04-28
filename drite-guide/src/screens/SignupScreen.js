import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';

export default function SignupScreen() {
    const navigation = useNavigation();
    const { signup } = useAuth();
    const { t } = useTranslation();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSignUp = async () => {
        const result = await signup({
            firstName,
            lastName,
            email,
            username,
            password,
            confirmPassword,
        });

        if (!result.success) {
            Alert.alert(t('auth.signupFailed'), result.message);
            return;
        }

        Alert.alert(
            t('auth.accountCreated'),
            result.message || t('auth.accountCreatedMessage', { name: result.user.first_name }),
            [
                {
                    text: t('common.continue'),
                    onPress: () => navigation.navigate('AccountMain'),
                },
            ]
        );
    };

    return (
        <View style={styles.screen}>
            <SafeAreaView edges={['top']} style={styles.safeArea}>
                <StatusBar style="dark" />

                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
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
                            <Text style={styles.backButtonText}>{t('common.back')}</Text>
                        </TouchableOpacity>

                        <View style={styles.card}>
                            <Text style={styles.title}>{t('auth.signupTitle')}</Text>
                            <Text style={styles.subtitle}>
                                {t('auth.signupSubtitle')}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.firstName')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.firstNamePlaceholder')}
                                    placeholderTextColor="#9CA3AF"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.lastName')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.lastNamePlaceholder')}
                                    placeholderTextColor="#9CA3AF"
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.email')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.emailPlaceholder')}
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.username')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.usernamePlaceholder')}
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={username}
                                    onChangeText={setUsername}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.password')}</Text>
                                <View style={styles.passwordWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder={t('auth.createPasswordPlaceholder')}
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword((prev) => !prev)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                                <View style={styles.passwordWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder={t('auth.confirmPasswordPlaceholder')}
                                        placeholderTextColor="#9CA3AF"
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons
                                            name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.88}
                                onPress={handleSignUp}
                            >
                                <Text style={styles.primaryButtonText}>{t('auth.createAccount')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkButton}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Login')}
                            >
                                <Text style={styles.linkText}>
                                    {t('auth.alreadyAccount')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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

    flex: {
        flex: 1,
    },

    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
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

    card: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#222222',
    },

    subtitle: {
        marginTop: 8,
        marginBottom: 24,
        fontSize: 14,
        lineHeight: 22,
        color: '#6B7280',
    },

    inputGroup: {
        marginBottom: 16,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#222222',
        marginBottom: 8,
    },

    input: {
        height: 54,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#222222',
    },

    passwordWrap: {
        height: 54,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },

    passwordInput: {
        flex: 1,
        fontSize: 15,
        color: '#222222',
    },

    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },

    primaryButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },

    linkButton: {
        marginTop: 16,
        alignItems: 'center',
    },

    linkText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
