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

                        <Text style={styles.title}>Terms of Use</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroCard}>
                        <Ionicons
                            name="document-text-outline"
                            size={42}
                            color={colors.primary}
                        />
                        <Text style={styles.heroTitle}>Terms of Use</Text>
                        <Text style={styles.heroSubtitle}>
                            Please read these terms carefully before using Dritë Guide.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Effective date</Text>
                        <Text style={styles.sectionText}>
                            EFFECTIVE DATE: 16.04.2026
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>1. Operator</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide is operated by Ard Sadiki, Fortan Zaimi, Deniz Zaimi
                            ("Dritë Guide", "we", "us", or "our").
                        </Text>
                        <Text style={styles.sectionText}>
                            Contact:{'\n'}
                            Ard Sadiki{'\n'}
                            driteguide@gmail.com{'\n'}
                            +41 78 727 92 30
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>2. Acceptance of these Terms</Text>
                        <Text style={styles.sectionText}>
                            By accessing or using Dritë Guide, you agree to be bound by
                            these Terms of Use. If you do not agree to these Terms, you
                            must not use the app.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>3. Description of the Service</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide is a travel and discovery application that helps
                            users explore places, cities, and location-based information,
                            including features such as maps, saved places, recommendations,
                            and related content.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>4. Eligibility and lawful use</Text>
                        <Text style={styles.sectionText}>
                            You agree to use Dritë Guide only for lawful purposes and in
                            compliance with applicable laws and regulations. You must not
                            misuse the app, interfere with its operation, attempt
                            unauthorized access, or use the service in a way that harms
                            us, other users, or third parties.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>5. User accounts</Text>
                        <Text style={styles.sectionText}>
                            If account creation is available, you are responsible for
                            maintaining the confidentiality of your account credentials and
                            for all activities that occur under your account. You must
                            provide accurate information and keep it up to date.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>6. User content and saved data</Text>
                        <Text style={styles.sectionText}>
                            Features such as saved places, preferences, and account-related
                            data are provided for convenience. While we aim to maintain
                            reliable service, we do not guarantee that saved content or app
                            data will always remain available, complete, or error-free.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>7. Place information and accuracy</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide may display place descriptions, ratings, categories,
                            contact details, opening information, map locations, or other
                            content. We try to keep this information useful and accurate,
                            but we do not guarantee that all information is current,
                            complete, accurate, or suitable for your specific needs.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>8. Third-party services</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide may rely on or link to third-party services,
                            including mapping, hosting, analytics, authentication, or other
                            external tools. We are not responsible for third-party
                            services, content, availability, or policies.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>9. Intellectual property</Text>
                        <Text style={styles.sectionText}>
                            All rights, title, and interest in Dritë Guide, including its
                            software, branding, design, logos, text, graphics, layout, and
                            original content, are owned by or licensed to us unless stated
                            otherwise. You may not copy, reproduce, distribute, modify,
                            reverse engineer, or exploit any part of the app except as
                            permitted by law or with our prior written consent.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>10. Prohibited conduct</Text>
                        <Text style={styles.sectionText}>
                            You must not:
                            {'\n\n'}• use the app for unlawful, harmful, or fraudulent purposes;
                            {'\n'}• interfere with the app’s security or technical operation;
                            {'\n'}• scrape, copy, or extract data from the app without permission;
                            {'\n'}• upload or distribute malicious code;
                            {'\n'}• impersonate another person or misrepresent your identity;
                            {'\n'}• violate the rights of other users or third parties.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>11. Availability and changes</Text>
                        <Text style={styles.sectionText}>
                            We may update, modify, suspend, or discontinue any part of
                            Dritë Guide at any time, with or without notice. We do not
                            guarantee uninterrupted availability or that the app will always
                            function without errors or delays.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>12. Disclaimer</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide is provided on an "as is" and "as available"
                            basis. To the maximum extent permitted by applicable law, we
                            disclaim all warranties of any kind, whether express, implied,
                            or statutory, including warranties of merchantability, fitness
                            for a particular purpose, non-infringement, and availability.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>13. Limitation of liability</Text>
                        <Text style={styles.sectionText}>
                            To the fullest extent permitted by applicable law, we are not
                            liable for any indirect, incidental, special, consequential, or
                            punitive damages, or for any loss of profits, revenues, data,
                            goodwill, or business opportunities arising out of or related
                            to your use of, or inability to use, Dritë Guide.
                        </Text>
                        <Text style={styles.sectionText}>
                            Nothing in these Terms excludes liability where such exclusion
                            is not permitted by law.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>14. Indemnification</Text>
                        <Text style={styles.sectionText}>
                            You agree to defend, indemnify, and hold harmless Dritë Guide
                            and its operators, affiliates, partners, and service providers
                            from and against claims, liabilities, damages, losses, and
                            expenses arising from your misuse of the app, your violation of
                            these Terms, or your violation of any rights of a third party.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>15. Suspension and termination</Text>
                        <Text style={styles.sectionText}>
                            We may suspend or terminate your access to Dritë Guide at any
                            time if we reasonably believe that you have violated these
                            Terms, caused risk or harm, or used the app unlawfully or
                            abusively.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>16. Privacy</Text>
                        <Text style={styles.sectionText}>
                            Your use of Dritë Guide is also subject to our Privacy Policy,
                            which explains how we collect, use, and protect personal data.
                            Please review the Privacy Policy carefully.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>17. Changes to these Terms</Text>
                        <Text style={styles.sectionText}>
                            We may revise these Terms of Use from time to time. When we do,
                            we will update the effective date. Continued use of the app
                            after updated Terms become effective means that you accept the
                            revised Terms.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>18. Governing law</Text>
                        <Text style={styles.sectionText}>
                            These Terms are governed by the laws of Albania, excluding its conflict of law rules, unless
                            mandatory consumer protection law provides otherwise.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>19. Contact us</Text>
                        <Text style={styles.sectionText}>
                            If you have questions about these Terms of Use, please contact:
                            {'\n\n'}Ard Sadiki
                            {'\n'}driteguide@gmail.com
                            {'\n'}+41 78 727 92 30
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
        marginBottom: 10,
    },
});