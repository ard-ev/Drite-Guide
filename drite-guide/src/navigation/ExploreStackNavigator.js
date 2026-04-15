import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ExploreScreen from '../screens/ExploreScreen';
import CityPlacesScreen from '../screens/CityPlacesScreen';
import PlaceDetailScreen from '../screens/PlaceDetailScreen';

const Stack = createNativeStackNavigator();

export default function ExploreStackNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: true,
            }}
        >
            <Stack.Screen name="ExploreMain" component={ExploreScreen} />
            <Stack.Screen name="CityPlaces" component={CityPlacesScreen} />
            <Stack.Screen name="PlaceDetails" component={PlaceDetailScreen} />
        </Stack.Navigator>
    );
}