// src/screens/SettingsScreen.js
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// ЗМІНІТЬ ЦЕЙ РЯДОК: додайте /legacy в кінець імпорту
import * as FileSystem from 'expo-file-system/legacy'; 
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import DataService from '../data/DataService';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const { colors, themeMode, updateTheme, isDark } = useTheme();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // ЕКСПОРТ ТА ІМПОРТ ДАНИХ
  const handleExport = async () => {
    try {
      const allData = await DataService.getAllItems();
      const jsonData = JSON.stringify(allData, null, 2);
      // FileSystem тепер імпортований з /legacy, тому ці методи працюватимуть
      const fileUri = FileSystem.documentDirectory + 'mindflow_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, jsonData, { encoding: 'utf8' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Не вдалося експортувати дані.");
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      
      // Використання legacy методу для читання
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const success = await DataService.importData(fileContent);
      if (success) {
        Alert.alert("Успіх", "Дані успішно імпортовано.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Некоректний файл даних.");
    }
  };

  // ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ ВСІХ ДАНИХ
  const confirmDeleteAll = async () => {
    await DataService.clearAllData();
    setDeleteModalVisible(false);
    Alert.alert("Очищено", "Всі дані видалено.");
  };

  // Компонент для варіантів теми
  const ThemeOption = ({ id, label, icon }) => (
    <TouchableOpacity 
      style={styles.row} 
      onPress={() => updateTheme(id)}
    >
      <View style={[styles.iconBox, { backgroundColor: themeMode === id ? colors.primary + '20' : colors.surfaceVariant }]}>
        <Ionicons name={icon} size={22} color={themeMode === id ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.textWrapper}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
      </View>
      {themeMode === id && <Ionicons name="checkmark" size={20} color={colors.primary} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Зовнішній вигляд</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <ThemeOption id="light" label="Світла тема" icon="sunny-outline" />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ThemeOption id="dark" label="Темна тема" icon="moon-outline" />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <ThemeOption id="system" label="Системна" icon="settings-outline" />
      </View>

      <Text style={[styles.sectionHeader, { color: colors.primary }]}>Дані та резервні копії</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.row} onPress={handleExport}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.textSecondary} />
          </View>
          <View style={styles.textWrapper}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Експорт даних</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>Зберегти все у файл JSON</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.row} onPress={handleImport}>
          <View style={[styles.iconBox, { backgroundColor: colors.surfaceVariant }]}>
            <Ionicons name="cloud-download-outline" size={22} color={colors.textSecondary} />
          </View>
          <View style={styles.textWrapper}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Імпорт даних</Text>
            <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>Відновити записи з файлу</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionHeader, { color: colors.error }]}>Небезпечна зона</Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#3D1C1B' : '#FFF1F0' }]}>
        <TouchableOpacity style={styles.row} onPress={() => setDeleteModalVisible(true)}>
          <View style={[styles.iconBox, { backgroundColor: isDark ? '#601410' : '#F9DEDC' }]}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </View>
          <View style={styles.textWrapper}>
            <Text style={[styles.rowTitle, { color: colors.error }]}>Видалити всі дані</Text>
            <Text style={[styles.rowSubtitle, { color: isDark ? '#E6E1E5' : '#49454F' }]}>Безповоротне очищення</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* МОДАЛЬНЕ ВІКНО ВИДАЛЕННЯ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { backgroundColor: colors.card }]}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning-outline" size={28} color={colors.error} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Видалити все?</Text>
            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
              Цю дію неможливо скасувати. Всі ваші думки, ідеї та завдання зникнуть назавжди.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={{ color: colors.primary, fontWeight: '500' }}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.error }]} 
                onPress={confirmDeleteAll}
              >
                <Text style={{ color: '#FFF', fontWeight: '500' }}>Видалити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>MindFlow v1.3.3</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // ГОЛОВНА СТРУКТУРА (Layout)
  // ==========================================
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 16,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ==========================================
  // КАРТКИ ТА РЯДКИ (List / Rows)
  // ==========================================
  card: {
    marginBottom: 8,
    borderRadius: 28,
    overflow: 'hidden', // Щоб контент не виходив за межі радіуса
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textWrapper: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: '85%',
    alignSelf: 'flex-end',
    marginRight: 16,
  },

  // ==========================================
  // МОДАЛЬНІ ВІКНА (Modals)
  // ==========================================
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '85%',
    padding: 24,
    borderRadius: 28,
    elevation: 6, // Тінь для Android
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginLeft: 8,
  },

  // ==========================================
  // НИЖНЯ ЧАСТИНА (Footer)
  // ==========================================
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
  },
});