import React, { useEffect, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { CommonActions, useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { isUsernameAvailable } from '../services/profileService';
import { isStrongSignupPassword, normalizeUsername } from '../services/supabaseService';

const USERNAME_CHECK_DELAY_MS = 400;

const navigateToProfile = (navigation, user) => {
    navigation.dispatch(
        CommonActions.reset({
            index: 1,
            routes: [
                { name: 'AccountMain' },
                {
                    name: 'Profile',
                    params: {
                        username: user?.username,
                        profile: user,
                    },
                },
            ],
        })
    );
};

export default function SignupScreen() {
    const navigation = useNavigation();
    const tabBarHeight = useBottomTabBarHeight();
    const insets = useSafeAreaInsets();
    const { signup } = useAuth();
    const { t } = useTranslation();

    const bottomScrollPadding = Math.max(tabBarHeight + insets.bottom + 120, 220);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState('idle');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const usernameTakenText = t('auth.usernameTaken') || 'Username already taken';

    const passwordRules = [
        {
            key: 'length',
            label: t('auth.passwordRuleLength') || 'At least 8 characters',
            met: password.length >= 8,
        },
        {
            key: 'uppercase',
            label: t('auth.passwordRuleUppercase') || 'One uppercase letter',
            met: /[A-Z]/.test(password),
        },
        {
            key: 'lowercase',
            label: t('auth.passwordRuleLowercase') || 'One lowercase letter',
            met: /[a-z]/.test(password),
        },
        {
            key: 'number',
            label: t('auth.passwordRuleNumber') || 'One number',
            met: /\d/.test(password),
        },
    ];

    const finalUsername = normalizeUsername(username);
    const isPasswordWeak = password.length > 0 && !isStrongSignupPassword(password);
    const isUsernameTooShort = username.trim().length > 0 && finalUsername.length < 3;

    const isUsernameBlockingSignup =
        usernameStatus === 'checking' ||
        usernameStatus === 'taken' ||
        usernameStatus === 'too_short' ||
        isUsernameTooShort;

    const isCreateDisabled =
        isSubmitting ||
        isPasswordWeak ||
        isUsernameBlockingSignup;

    const usernameFeedback = (() => {
        if (usernameStatus === 'too_short') {
            return { text: t('auth.invalidUsername') || 'Username must be at least 3 characters.', tone: 'error' };
        }

        if (usernameStatus === 'checking') {
            return { text: t('auth.usernameChecking') || 'Checking username...', tone: 'neutral' };
        }

        if (usernameStatus === 'available') {
            return { text: t('auth.usernameAvailable') || 'Username is available.', tone: 'success' };
        }

        if (usernameStatus === 'taken') {
            return { text: usernameTakenText, tone: 'error' };
        }

        if (usernameStatus === 'error') {
            return { text: t('auth.usernameCheckFailed') || 'Could not check username.', tone: 'neutral' };
        }

        return null;
    })();

    useEffect(() => {
        if (!username.trim()) {
            setUsernameStatus('idle');
            return undefined;
        }

        const nextUsername = normalizeUsername(username);

        if (nextUsername.length < 3) {
            setUsernameStatus('too_short');
            return undefined;
        }

        let isActive = true;
        setUsernameStatus('checking');

        const timeoutId = setTimeout(async () => {
            try {
                const available = await isUsernameAvailable(nextUsername);

                if (isActive) {
                    setUsernameStatus(available ? 'available' : 'taken');
                }
            } catch (error) {
                console.log('Username check failed:', error);

                if (isActive) {
                    setUsernameStatus('error');
                }
            }
        }, USERNAME_CHECK_DELAY_MS);

        return () => {
            isActive = false;
            clearTimeout(timeoutId);
        };
    }, [username]);

    const handleUsernameChange = (value) => {
        const cleanUsername = value
            .trimStart()
            .replace(/\s/g, '')
            .toLowerCase();

        setUsername(cleanUsername);

        const nextUsername = normalizeUsername(cleanUsername);

        if (!nextUsername) {
            setUsernameStatus('idle');
        } else if (nextUsername.length < 3) {
            setUsernameStatus('too_short');
        } else {
            setUsernameStatus('checking');
        }
    };

    const handleSignUp = async () => {
        if (isSubmitting) return;

        const cleanFirstName = firstName.trim();
        const cleanLastName = lastName.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = normalizeUsername(username);

        if (!cleanFirstName || !cleanLastName || !cleanEmail || !cleanUsername || !password || !confirmPassword) {
            Alert.alert(
                t('auth.signupFailed') || 'Sign up failed',
                t('auth.fillAllFields') || 'Please fill in all fields.'
            );
            return;
        }

        if (!cleanEmail.includes('@')) {
            Alert.alert(
                t('auth.signupFailed') || 'Sign up failed',
                t('auth.invalidEmail') || 'Please enter a valid email address.'
            );
            return;
        }

        if (!/^[a-z0-9_.]{3,30}$/.test(cleanUsername)) {
            Alert.alert(
                t('auth.signupFailed') || 'Sign up failed',
                t('auth.invalidUsername') ||
                    'Username must be 3 to 30 characters and may only contain letters, numbers, underscore and dot.'
            );
            return;
        }

        if (usernameStatus === 'checking') {
            Alert.alert(
                t('auth.signupFailed') || 'Sign up failed',
                t('auth.usernameChecking') || 'Username is still being checked.'
            );
            return;
        }

        if (usernameStatus === 'taken') {
            Alert.alert(t('auth.signupFailed') || 'Sign up failed', usernameTakenText);
            return;
        }

        if (!isStrongSignupPassword(password)) {
            Alert.alert(
                t('auth.signupFailed') || 'Sign up failed',
                t('auth.passwordRequirements') ||
                    'Password must have at least 8 characters, one uppercase letter, one lowercase letter and one number.'
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert(
                t('auth.signupFailed') || 'Sign up failed',
                t('auth.passwordsDoNotMatch') || 'Passwords do not match.'
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const available = await isUsernameAvailable(cleanUsername);

            if (!available) {
                setUsernameStatus('taken');
                Alert.alert(t('auth.signupFailed') || 'Sign up failed', usernameTakenText);
                return;
            }

            setUsernameStatus('available');

            const result = await signup({
                firstName: cleanFirstName,
                lastName: cleanLastName,
                email: cleanEmail,
                username: cleanUsername,
                password,
                confirmPassword,
            });

            console.log('Signup result:', result);

            if (!result?.success) {
                Alert.alert(
                    t('auth.signupFailed') || 'Sign up failed',
                    result?.message || t('auth.signupFailedFallback') || 'Could not create account.'
                );
                return;
            }

            if (result.requiresEmailVerification) {
                Alert.alert(
                    t('Verify your Email') || 'Verify your email',
                    t('Your Account was created. Please check your Email and verify your Account.') ||
                        'Your account was created. Please check your email and verify your account.'
                );

                navigation.navigate('Login');
                return;
            }

            navigateToProfile(navigation, result.user);
        } catch (error) {
            console.log('Signup screen error:', error);

            Alert.alert(
                t('auth.signupFailed') || 'Sign up failed',
                error?.message || t('auth.signupFailedFallback') || 'Could not create account.'
            );
        } finally {
            setIsSubmitting(false);
        }
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
                        contentContainerStyle={[
                            styles.content,
                            { paddingBottom: bottomScrollPadding },
                        ]}
                        scrollIndicatorInsets={{ bottom: bottomScrollPadding }}
                        keyboardShouldPersistTaps="handled"
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
                            <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.firstName')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.firstNamePlaceholder')}
                                    placeholderTextColor="#9CA3AF"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    editable={!isSubmitting}
                                    autoCorrect={false}
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
                                    editable={!isSubmitting}
                                    autoCorrect={false}
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
                                    editable={!isSubmitting}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.username')}</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        usernameStatus === 'taken' && styles.inputError,
                                        usernameStatus === 'available' && styles.inputSuccess,
                                    ]}
                                    placeholder={t('auth.usernamePlaceholder')}
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={username}
                                    onChangeText={handleUsernameChange}
                                    editable={!isSubmitting}
                                />

                                {usernameFeedback ? (
                                    <Text
                                        style={[
                                            styles.fieldFeedback,
                                            usernameFeedback.tone === 'success' &&
                                                styles.fieldFeedbackSuccess,
                                            usernameFeedback.tone === 'error' &&
                                                styles.fieldFeedbackError,
                                        ]}
                                    >
                                        {usernameFeedback.text}
                                    </Text>
                                ) : null}
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
                                        editable={!isSubmitting}
                                    />

                                    <TouchableOpacity
                                        onPress={() => setShowPassword((prev) => !prev)}
                                        activeOpacity={0.8}
                                        disabled={isSubmitting}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#6B7280"
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.passwordRules}>
                                    {passwordRules.map((rule) => (
                                        <View key={rule.key} style={styles.passwordRule}>
                                            <Ionicons
                                                name={rule.met ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={16}
                                                color={rule.met ? '#15803D' : '#9CA3AF'}
                                            />

                                            <Text
                                                style={[
                                                    styles.passwordRuleText,
                                                    rule.met && styles.passwordRuleTextMet,
                                                ]}
                                            >
                                                {rule.label}
                                            </Text>
                                        </View>
                                    ))}
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
                                        editable={!isSubmitting}
                                    />

                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                                        activeOpacity={0.8}
                                        disabled={isSubmitting}
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
                                style={[
                                    styles.primaryButton,
                                    isCreateDisabled && styles.primaryButtonDisabled,
                                ]}
                                activeOpacity={0.88}
                                onPress={handleSignUp}
                                disabled={isCreateDisabled}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {isSubmitting
                                        ? t('common.pleaseWait')
                                        : t('auth.createAccount')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkButton}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Login')}
                                disabled={isSubmitting}
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
        flexGrow: 1,
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
    boxShadow: '0 8px 16px rgba(0,0,0,0.05)',
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

    inputError: {
        borderColor: '#B91C1C',
    },

    inputSuccess: {
        borderColor: '#15803D',
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

    fieldFeedback: {
        marginTop: 8,
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
    },

    fieldFeedbackSuccess: {
        color: '#15803D',
    },

    fieldFeedbackError: {
        color: '#B91C1C',
    },

    passwordRules: {
        marginTop: 8,
    },

    passwordRule: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },

    passwordRuleText: {
        marginLeft: 8,
        fontSize: 12,
        lineHeight: 18,
        color: '#6B7280',
        flex: 1,
    },

    passwordRuleTextMet: {
        color: '#15803D',
        fontWeight: '600',
    },

    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },

    primaryButtonDisabled: {
        opacity: 0.65,
    },

    primaryButtonText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },

    linkButton: {
        marginTop: 16,
        marginBottom: 16,
        alignItems: 'center',
    },

    linkText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
