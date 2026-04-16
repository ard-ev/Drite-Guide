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

export default function CookiePolicyScreen() {
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

                        <Text style={styles.title}>Cookie Policy</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroCard}>
                        <Ionicons
                            name="analytics-outline"
                            size={42}
                            color={colors.primary}
                        />
                        <Text style={styles.heroTitle}>Cookies & similar technologies</Text>
                        <Text style={styles.heroSubtitle}>
                            Learn how Dritë Guide uses cookies, device storage, SDKs,
                            analytics and similar tracking technologies.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Effective date</Text>
                        <Text style={styles.sectionText}>
                            16.04.2026
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>1. Scope of this Policy</Text>
                        <Text style={styles.sectionText}>
                            This Cookie Policy explains how Dritë Guide uses cookies and
                            similar technologies in connection with our app, website, and
                            related services, where applicable.
                        </Text>
                        <Text style={styles.sectionText}>
                            Because Dritë Guide is primarily a mobile application, some of
                            the technologies we use may not be traditional browser cookies.
                            Instead, we may use similar technologies such as local storage,
                            SDKs, device identifiers, pixels, analytics tools, or other
                            technologies that store information on or access information
                            from your device.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>2. What are cookies and similar technologies?</Text>
                        <Text style={styles.sectionText}>
                            Cookies are small text files that websites may store on your
                            browser or device. In mobile apps and modern digital services,
                            similar functions may also be carried out by technologies such
                            as local storage, software development kits (SDKs), tracking
                            pixels, tags, device identifiers, or similar tools used to
                            remember preferences, enable core functions, measure usage, or
                            improve performance.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>3. Technologies we may use</Text>
                        <Text style={styles.sectionText}>
                            Depending on the platform and features used, Dritë Guide may
                            use the following types of technologies:
                            {'\n\n'}• essential storage technologies required for app login,
                            settings, navigation, or basic functionality;
                            {'\n'}• functional technologies used to remember your preferences,
                            saved places, or language and interface settings;
                            {'\n'}• analytics or measurement technologies used to understand
                            how users interact with the app and to improve performance;
                            {'\n'}• diagnostic or crash-reporting tools used to detect errors,
                            monitor stability, and maintain service quality;
                            {'\n'}• location-related technologies used when you grant
                            location permission for nearby places or map-based features.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>4. Why we use these technologies</Text>
                        <Text style={styles.sectionText}>
                            We may use cookies and similar technologies to:
                            {'\n\n'}• operate and secure the app;
                            {'\n'}• remember preferences and saved content;
                            {'\n'}• provide maps, nearby places, and location-based features;
                            {'\n'}• understand how the app is used;
                            {'\n'}• improve performance, reliability, and user experience;
                            {'\n'}• detect bugs, crashes, misuse, or technical problems.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>5. Legal basis and consent</Text>
                        <Text style={styles.sectionText}>
                            Where required by applicable law, we will ask for your consent
                            before using non-essential cookies or similar technologies.
                            Technologies that are strictly necessary for core app operation,
                            security, or the service you actively request may be used
                            without separate consent where permitted by law.
                        </Text>
                        <Text style={styles.sectionText}>
                            You can also control certain permissions, such as location
                            access, through your device settings.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>6. Third-party technologies</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide may use third-party services, libraries, or SDKs
                            that use cookies or similar technologies on our behalf or for
                            their own technical operation. Depending on your implementation,
                            this may include providers for analytics, crash reporting,
                            maps, authentication, hosting, or notifications.
                        </Text>
                        <Text style={styles.sectionText}>
                            {'\n\n'}• Analytics
                            {'\n'}• Google Maps
                            {'\n'}• Authentication tool
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>7. How you can manage these technologies</Text>
                        <Text style={styles.sectionText}>
                            Depending on your device, browser, or operating system, you may
                            be able to manage cookies, identifiers, app permissions, local
                            storage, or tracking preferences through your system settings or
                            browser settings.
                        </Text>
                        <Text style={styles.sectionText}>
                            Please note that disabling certain essential technologies may
                            affect the availability, functionality, or performance of parts
                            of Dritë Guide.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>8. Relationship with our Privacy Policy</Text>
                        <Text style={styles.sectionText}>
                            This Cookie Policy should be read together with our Privacy
                            Policy, which explains how we collect, use, share, and protect
                            personal data. Where cookies or similar technologies involve
                            personal data, our Privacy Policy also applies.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>9. Changes to this Policy</Text>
                        <Text style={styles.sectionText}>
                            We may update this Cookie Policy from time to time. When we do,
                            we will update the effective date above. Continued use of the
                            app after the updated Policy becomes effective means you accept
                            the revised version, to the extent permitted by law.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>10. Contact</Text>
                        <Text style={styles.sectionText}>
                            If you have questions about this Cookie Policy or our use of
                            cookies and similar technologies, contact us at:
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