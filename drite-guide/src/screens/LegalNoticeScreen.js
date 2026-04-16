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

export default function LegalNoticeScreen() {
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

                        <Text style={styles.title}>Legal Notice</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.heroCard}>
                        <Ionicons
                            name="briefcase-outline"
                            size={42}
                            color={colors.primary}
                        />
                        <Text style={styles.heroTitle}>Company information</Text>
                        <Text style={styles.heroSubtitle}>
                            Legal and business information related to Dritë Guide.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>1. Provider</Text>
                        <Text style={styles.sectionText}>
                            Dritë Guide{"\n"}
                            Ard Sadiki{"\n"}
                            1000 Tirana{"\n"}
                            Albania
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>2. Contact</Text>
                        <Text style={styles.sectionText}>
                            Email: driteguide@gmail.com{"\n"}
                            Phone: +41 78 727 92 30{"\n"}
                            Website: www.ardsadiki.com
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>3. Authorized representatives</Text>
                        <Text style={styles.sectionText}>
                            The app and related services are represented by the responsible
                            management or owners of Dritë Guide.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>4. Commercial register</Text>
                        <Text style={styles.sectionText}>
                            If applicable, information about company registration, legal form
                            and registration number can be listed here.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>5. VAT / Tax information</Text>
                        <Text style={styles.sectionText}>
                            If applicable, VAT or tax identification details can be provided in
                            this section according to local legal requirements.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>6. Liability for content</Text>
                        <Text style={styles.sectionText}>
                            We make every effort to keep the content of Dritë Guide accurate
                            and up to date. However, we do not guarantee the completeness,
                            correctness or current validity of all information shown in the app.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>7. Liability for links</Text>
                        <Text style={styles.sectionText}>
                            Our app may contain links to third-party websites or services. We
                            are not responsible for the content, policies or practices of those
                            external services.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>8. Copyright</Text>
                        <Text style={styles.sectionText}>
                            All texts, graphics, branding, layouts and other materials in
                            Dritë Guide are protected by copyright unless otherwise stated.
                            Any reproduction or use without permission is prohibited.
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>9. Jurisdiction</Text>
                        <Text style={styles.sectionText}>
                            Unless otherwise required by law, disputes relating to Dritë Guide
                            are subject to the applicable laws and jurisdiction of the relevant
                            local authority.
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