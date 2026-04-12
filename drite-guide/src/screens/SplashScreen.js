import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';

export default function SplashScreen() {
    const navigation = useNavigation();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Main');
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/logo.jpeg')}
                style={styles.logo}
                resizeMode="contain"
            />

            <Text style={styles.title}>Dritë Guide</Text>
            <Text style={styles.subtitle}>Discover Albania with ease</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    logo: {
        width: 200,
        height: 200,
        marginBottom: -10,
    },

    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    subtitle: {
        marginTop: 6,
        fontSize: 14,
        color: '#FAD4D4',
    },
});