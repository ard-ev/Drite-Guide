import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function FavouritesScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Favourites</Text>
            <Text style={styles.subtitle}>Your saved places will appear here.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
});