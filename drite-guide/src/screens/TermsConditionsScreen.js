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
import colors from '../theme/colors';

export default function TermsConditionsScreen() {
    const navigation = useNavigation();

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

                        <Text style={styles.title}>Terms & Conditions</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroCard}>
                        <Ionicons
                            name="document-text-outline"
                            size={42}
                            color={colors.primary}
                        />
                        <Text style={styles.heroTitle}>Terms of use</Text>
                        <Text style={styles.heroSubtitle}>
                            Please read these terms carefully before using Dritë Guide.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>1. Acceptance of terms</Text>
                        <Text style={styles.sectionText}>
                            By accessing or using Dritë Guide, you agree to be bound by these
                            Terms & Conditions. If you do not agree with any part of these terms,
                            you should not use the app.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>2. Use of the app</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide is intended to help users discover places, save favorites
                            and explore information about locations in Albania. You agree to use
                            the app only for lawful purposes and in a way that does not harm the
                            app, its services or other users.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>3. Account responsibility</Text>
                        <Text style={styles.sectionText}>
                            If you create an account, you are responsible for maintaining the
                            confidentiality of your login details and for all activities that
                            happen under your account.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>4. Content and accuracy</Text>
                        <Text style={styles.sectionText}>
                            We aim to provide helpful and accurate information, but we cannot
                            guarantee that all place details, descriptions, contact information or
                            availability are always complete, current or error-free.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>5. Saved places and trips</Text>
                        <Text style={styles.sectionText}>
                            Features such as saved places, personal activity and trips are
                            provided for convenience. We are not responsible for any loss of data,
                            interruptions or unavailable features caused by technical issues or
                            third-party services.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>6. Intellectual property</Text>
                        <Text style={styles.sectionText}>
                            All branding, design elements, text, graphics and app-related content
                            are owned by or licensed to Dritë Guide unless stated otherwise. You
                            may not copy, distribute or reuse app content without permission.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>7. Limitation of liability</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide is provided on an “as is” basis. We are not liable for
                            any direct, indirect, incidental or consequential damages resulting
                            from the use of the app or reliance on its content.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>8. Changes to these terms</Text>
                        <Text style={styles.sectionText}>
                            We may update these Terms & Conditions from time to time. Continued
                            use of the app after changes are published means you accept the
                            updated terms.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>9. Contact</Text>
                        <Text style={styles.sectionText}>
                            If you have questions about these Terms & Conditions, you can contact
                            us through the channels provided in the app or official company
                            information.
                        </Text>
                    </View>
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
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    headerSpacer: {
        width: 42,
        height: 42,
    },

    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222222',
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
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
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
    },
});