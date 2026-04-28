import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SavedScreen from '../screens/SavedScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';
import TripDetailScreen from '../screens/TripDetailScreen';

const Stack = createNativeStackNavigator();

export default function SavedStackNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
            }}
        >
            <Stack.Screen name="SavedMain" component={SavedScreen} />
            <Stack.Screen name="PlaceDetails" component={PlaceDetailScreen} />
            <Stack.Screen name="TripDetails" component={TripDetailScreen} />
        </Stack.Navigator>
    );
}
