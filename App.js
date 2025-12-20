// App.js
import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import RawThoughtsScreen from './src/screens/RawThoughtsScreen';
import MyLibraryScreen from './src/screens/MyLibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function AppNavigation() {
  const { colors, isDark } = useTheme();

  // Динамічна тема для навігації: прибирає "підкладку", яка викликає спалахи або затемнення
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background, 
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          // Примусово встановлюємо фон для кожного екрана в стеку
          contentStyle: { backgroundColor: colors.background },
          animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            headerShown: false,
            // Вимикаємо анімацію для головної, щоб уникнути мерехтіння при поверненні
            animation: 'none' 
          }} 
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Налаштування' }} />
        <Stack.Screen name="RawThoughts" component={RawThoughtsScreen} options={{ title: 'Миттєві думки' }} />
        <Stack.Screen name="MyLibrary" component={MyLibraryScreen} options={{ title: 'Моя бібліотека' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}