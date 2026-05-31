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
import { CommonActions, useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';

const navigateToAccount = (navigation) => {
    navigation.dispatch(
        CommonActions.reset({
            index: 0,
            routes: [
                { name: 'AccountMain' },
            ],
        })
    );
};

export default function LoginScreen() {
    const navigation = useNavigation();
    const { login, isBootstrapping, resendEmailVerification } = useAuth();
    const { t } = useTranslation();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');

    const handleLogin = async () => {
        const result = await login(identifier, password);

        if (!result.success) {
            const verificationEmail = result.verificationEmail ||
                (identifier.includes('@') ? identifier.trim().toLowerCase() : '');
            setPendingVerificationEmail(
                result.requiresEmailVerification ? verificationEmail : ''
            );
            Alert.alert(t('auth.loginFailed'), result.message);
            return;
        }

        setPendingVerificationEmail('');
        navigateToAccount(navigation);
    };

    const handleResendVerification = async () => {
        const result = await resendEmailVerification(pendingVerificationEmail || identifier);
        Alert.alert(
            result.success ? t('auth.verificationEmailSentTitle') : t('auth.verificationEmailFailedTitle'),
            result.message
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
                            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
                            <Text style={styles.subtitle}>
                                {t('auth.loginSubtitle')}
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.emailOrUsername')}</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.emailOrUsernamePlaceholder')}
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>{t('auth.password')}</Text>
                                <View style={styles.passwordWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder={t('auth.passwordPlaceholder')}
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

                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.88}
                                onPress={handleLogin}
                                disabled={isBootstrapping}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {isBootstrapping ? t('common.pleaseWait') : t('auth.loginTitle')}
                                </Text>
                            </TouchableOpacity>

                            {pendingVerificationEmail ? (
                                <TouchableOpacity
                                    style={styles.secondaryButton}
                                    activeOpacity={0.85}
                                    onPress={handleResendVerification}
                                >
                                    <Text style={styles.secondaryButtonText}>
                                        {t('auth.resendVerificationEmail')}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity
                                style={styles.linkButton}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Signup')}
                            >
                                <Text style={styles.linkText}>
                                    {t('auth.signupPrompt')}
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

    secondaryButton: {
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
    },

    secondaryButtonText: {
        color: colors.primary,
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
