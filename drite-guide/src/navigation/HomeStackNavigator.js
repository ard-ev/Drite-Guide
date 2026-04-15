import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import CategoryPlacesScreen from '../screens/CategoryPlacesScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';

const Stack = createNativeStackNavigator();

export default function HomeStackNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
            }}
        >
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="CategoryPlaces" component={CategoryPlacesScreen} />
            <Stack.Screen name="PlaceDetails" component={PlaceDetailScreen} />
        </Stack.Navigator>
    );
}