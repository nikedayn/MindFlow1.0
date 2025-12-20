// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import DataService from '../data/DataService';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await DataService.getTheme();
      if (savedTheme) setThemeMode(savedTheme);
    };
    loadTheme();
  }, []);

  const updateTheme = async (newMode) => {
    setThemeMode(newMode);
    await DataService.setTheme(newMode);
  };

  // Визначаємо, чи зараз темна тема
  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const colors = {
    background: isDark ? '#1C1B1F' : '#FEF7FF',
    surface: isDark ? '#2B2930' : '#FFF',
    surfaceVariant: isDark ? '#49454F' : '#ECE6F0',
    primary: isDark ? '#D0BCFF' : '#6750A4',
    text: isDark ? '#E6E1E5' : '#1C1B1F',
    textSecondary: isDark ? '#CAC4D0' : '#49454F',
    border: isDark ? '#49454F' : '#CAC4D0',
    error: isDark ? '#F2B8B5' : '#B3261E',
    outline: isDark ? '#938F99' : '#79747E',
    card: isDark ? '#211F26' : '#F7F2FA',
  };

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeMode, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);