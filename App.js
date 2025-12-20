// App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
// 1. Імпортуємо необхідні компоненти для жестів та навігації
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 2. Імпортуємо наш провайдер теми та екрани
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import HomeScreen from './src/screens/HomeScreen';
import RawThoughtsScreen from './src/screens/RawThoughtsScreen';
import MyLibraryScreen from './src/screens/MyLibraryScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

/**
 * Окремий компонент навігації, щоб ми могли використовувати хук useTheme всередині.
 * Це критично для динамічної зміни кольорів NavigationContainer.
 */
function AppNavigation() {
  const { colors, isDark } = useTheme();

  // Налаштування теми для самої бібліотеки React Navigation (прибирає спалахи)
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background, // Колір підкладки між переходами
      card: colors.card,             // Колір фону заголовків
      text: colors.text,             // Колір тексту заголовків
      border: colors.border,         // Колір ліній
      primary: colors.primary,       // Активний колір (кнопка назад тощо)
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {/* Автоматично змінює колір годинника та іконок статус-бару */}
      <StatusBar style={isDark ? "light" : "dark"} />
      
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background }, // Для нових версій
          // Додайте це для старіших версій або специфічних рендерів Android:
          cardStyle: { backgroundColor: colors.background }, 
          animation: 'fade_from_bottom', // Спробуйте змінити тип анімації на більш плавний
        }}
      >
        
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            headerShown: false,
            contentStyle: { backgroundColor: colors.background }
          }} 
        />

        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen} 
          options={{ title: 'Налаштування' }}
        />

        <Stack.Screen 
          name="RawThoughts" 
          component={RawThoughtsScreen} 
          options={{ title: 'Миттєві думки' }}
        />

        <Stack.Screen 
          name="MyLibrary" 
          component={MyLibraryScreen} 
          options={{ title: 'Моя бібліотека' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Головний вхід в додаток
 */
export default function App() {
  return (
    // GestureHandlerRootView обов'язково має бути на самому верху для Swipeable
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}