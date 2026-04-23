import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '../theme/colors';

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/logosplash.jpeg')}
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.title}>Dritë Guide</Text>
            <Text style={styles.subtitle}>Follow your light</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 90,
    },

    logo: {
        width: 350,
        height: 350,
        marginBottom: -10,
    },

    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    subtitle: {
        marginTop: 6,
        fontSize: 26,
        color: '#FAD4D4',
    },
});