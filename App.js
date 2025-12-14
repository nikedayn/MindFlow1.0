// App.js
import React from 'react';
import { View, Text } from 'react-native';
// 1. Імпортуємо GestureHandlerRootView
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import RawThoughtsScreen from './src/screens/RawThoughtsScreen';
import MyLibraryScreen from './src/screens/MyLibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Заглушка для бібліотеки (поки що)
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Екран: {route.name}</Text>
    <Text style={{ color: 'gray', marginTop: 10 }}>Ще в розробці</Text>
  </View>
);

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // 2. Обгортаємо весь застосунок. style={{ flex: 1 }} є ОБОВ'ЯЗКОВИМ!
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
          />

          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: 'Налаштування' }}
          />

          <Stack.Screen 
            name="RawThoughts" 
            component={RawThoughtsScreen} 
            options={{ title: 'Сирі думки' }}
          />

          <Stack.Screen 
            name="MyLibrary" 
            component={MyLibraryScreen} 
            options={{ title: 'Моя бібліотека' }}
          />

        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
