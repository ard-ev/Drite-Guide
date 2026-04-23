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

export default function LoginScreen() {
    const navigation = useNavigation();
    const { login, isBootstrapping } = useAuth();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        const result = await login(identifier, password);

        if (!result.success) {
            Alert.alert('Login failed', result.message);
            return;
        }

        Alert.alert('Login successful', `Welcome back, ${result.user.first_name}!`, [
            {
                text: 'Continue',
                onPress: () => navigation.navigate('AccountMain'),
            },
        ]);
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
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>

                        <View style={styles.card}>
                            <Text style={styles.title}>Log in</Text>
                            <Text style={styles.subtitle}>
                                Log in with your email address or username and your password.
                            </Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email or username</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email or username"
                                    placeholderTextColor="#9CA3AF"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordWrap}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Enter your password"
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
                                    {isBootstrapping ? 'Please wait...' : 'Log in'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.linkButton}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Signup')}
                            >
                                <Text style={styles.linkText}>
                                    Don’t have an account? Sign up first
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
