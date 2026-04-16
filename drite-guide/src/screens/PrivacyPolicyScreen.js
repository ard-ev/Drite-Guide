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

export default function PrivacyPolicyScreen() {
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

                        <Text style={styles.title}>Privacy Policy</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroCard}>
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={42}
                            color={colors.primary}
                        />
                        <Text style={styles.heroTitle}>Your privacy matters</Text>
                        <Text style={styles.heroSubtitle}>
                            Please read this Privacy Policy carefully to understand how
                            Dritë Guide handles personal data.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Effective date</Text>
                        <Text style={styles.sectionText}>
                            16.04.2026
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>1. Who we are</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide is operated by Ard Sadiki, Fortan Zaimi, Deniz Zaimi
                            ("Dritë Guide", "we", "us", or "our"). We are the controller
                            of the personal data described in this Privacy Policy unless
                            stated otherwise.
                        </Text>
                        <Text style={styles.sectionText}>
                            Contact:{'\n'}
                            Ard Sadiki{'\n'}
                            driteguide@gmail.com{'\n'}
                            +41 78 727 92 30
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>2. Scope of this Privacy Policy</Text>
                        <Text style={styles.sectionText}>
                            This Privacy Policy applies to the Dritë Guide mobile app,
                            related websites, and related services, unless a separate
                            privacy notice applies to a specific service.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>3. Personal data we may collect</Text>
                        <Text style={styles.sectionText}>
                            Depending on how you use Dritë Guide, we may collect the
                            following categories of personal data:
                            {'\n\n'}• Account information, such as name, email address,
                            username, or login details, if you create an account.
                            {'\n'}• User content and preferences, such as saved places,
                            favorites, profile preferences, reviews, or other information
                            you choose to provide.
                            {'\n'}• Location data, if you grant location permissions, in
                            order to show nearby places, map features, or location-based
                            recommendations.
                            {'\n'}• Device and technical information, such as app version,
                            device type, operating system, language settings, crash logs,
                            and diagnostic information.
                            {'\n'}• Usage information, such as pages or screens viewed,
                            features used, taps, interactions, and general app activity.
                            {'\n'}• Communications, if you contact us for support or other
                            inquiries.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>4. How we collect personal data</Text>
                        <Text style={styles.sectionText}>
                            We collect personal data:
                            {'\n\n'}• directly from you, when you sign up, edit your
                            profile, save places, contact us, or otherwise use the app;
                            {'\n'}• automatically from your device and app usage;
                            {'\n'}• from permissions you choose to grant, such as location
                            access;
                            {'\n'}• from service providers and third-party tools that help
                            us operate the app.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>5. Why we use personal data</Text>
                        <Text style={styles.sectionText}>
                            We may use personal data for the following purposes:
                            {'\n\n'}• to provide, maintain, and improve Dritë Guide;
                            {'\n'}• to enable maps, location-based features, saved places,
                            and personalized app functions;
                            {'\n'}• to create and manage user accounts;
                            {'\n'}• to respond to support requests and communicate with you;
                            {'\n'}• to monitor app performance, diagnose errors, and improve
                            security and reliability;
                            {'\n'}• to prevent abuse, misuse, fraud, or unlawful activity;
                            {'\n'}• to comply with legal obligations and enforce our terms.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>6. Legal bases for processing</Text>
                        <Text style={styles.sectionText}>
                            Where applicable under relevant data protection law, we process
                            personal data on one or more of the following legal bases:
                            {'\n\n'}• performance of a contract or pre-contractual steps,
                            such as providing the app features you request;
                            {'\n'}• your consent, for example where location permissions or
                            optional notifications are enabled;
                            {'\n'}• our legitimate interests, such as improving the app,
                            keeping services secure, and understanding how features are used;
                            {'\n'}• compliance with legal obligations.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>7. Location data</Text>
                        <Text style={styles.sectionText}>
                            If you grant permission, Dritë Guide may access your device
                            location to provide map functionality, show nearby places, and
                            improve location-based recommendations. You can disable location
                            access at any time in your device settings. If you do not allow
                            location access, some features may not function properly.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>8. Sharing of personal data</Text>
                        <Text style={styles.sectionText}>
                            We do not sell your personal data. We may share personal data
                            only where necessary, including with:
                            {'\n\n'}• hosting, infrastructure, database, analytics, crash
                            reporting, support, authentication, or communications providers;
                            {'\n'}• mapping and location service providers, where required to
                            deliver map or place-related functionality;
                            {'\n'}• professional advisers, auditors, insurers, or legal
                            representatives where necessary;
                            {'\n'}• competent authorities, courts, regulators, or law
                            enforcement where required by law or to protect rights, safety,
                            or security;
                            {'\n'}• a purchaser, investor, or successor entity in connection
                            with a merger, acquisition, restructuring, or sale of assets.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>9. Third-party services</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide may rely on third-party services, libraries, or SDKs
                            to provide app functionality. Depending on your implementation,
                            these may include services for maps, location, hosting,
                            authentication, analytics, diagnostics, or notifications.
                        </Text>
                        <Text style={styles.sectionText}>
                            {'\n\n'}• Google Analytics
                            {'\n'}• Auth provider
                            {'\n'}• Google Maps
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>10. International data transfers</Text>
                        <Text style={styles.sectionText}>
                            Your personal data may be processed in countries other than your
                            own, including countries that may not provide the same level of
                            data protection. Where required, we take appropriate safeguards
                            to protect personal data, such as contractual protections or
                            other lawful transfer mechanisms.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>11. Data retention</Text>
                        <Text style={styles.sectionText}>
                            We keep personal data only for as long as necessary for the
                            purposes described in this Privacy Policy, including to provide
                            the services, comply with legal obligations, resolve disputes,
                            enforce agreements, and maintain security and business records.
                        </Text>
                        <Text style={styles.sectionText}>
                            Retention periods may vary depending on the type of data, how the
                            app is used, and legal or operational requirements.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>12. Data security</Text>
                        <Text style={styles.sectionText}>
                            We implement reasonable technical and organizational measures to
                            protect personal data against unauthorized access, loss, misuse,
                            alteration, or disclosure. However, no method of storage,
                            transmission, or electronic processing is completely secure, and
                            we cannot guarantee absolute security.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>13. Your rights</Text>
                        <Text style={styles.sectionText}>
                            Depending on the law that applies to you, you may have rights to:
                            {'\n\n'}• request access to your personal data;
                            {'\n'}• request correction of inaccurate or incomplete data;
                            {'\n'}• request deletion of personal data;
                            {'\n'}• object to or request restriction of certain processing;
                            {'\n'}• withdraw consent where processing is based on consent;
                            {'\n'}• request data portability where applicable;
                            {'\n'}• lodge a complaint with a competent supervisory authority.
                        </Text>
                        <Text style={styles.sectionText}>
                            To exercise your rights, contact us at driteguide@gmail.com. We may ask
                            you to verify your identity before processing your request.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>14. Children’s privacy</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide is not directed to children under the age required by
                            applicable law to provide valid consent on their own. We do not
                            knowingly collect personal data from children in violation of
                            applicable law. If you believe a child has provided personal data
                            unlawfully, please contact us so we can take appropriate steps.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>15. Changes to this Privacy Policy</Text>
                        <Text style={styles.sectionText}>
                            We may update this Privacy Policy from time to time. When we do,
                            we will update the effective date above. If changes are material,
                            we may provide additional notice in the app or by other
                            appropriate means.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>16. Contact us</Text>
                        <Text style={styles.sectionText}>
                            If you have questions, requests, or concerns about this Privacy
                            Policy or our privacy practices, contact us at:
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