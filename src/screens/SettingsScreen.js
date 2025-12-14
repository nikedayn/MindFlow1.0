// src/screens/SettingsScreen.js
import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import DataService from '../data/DataService';

export default function SettingsScreen() {

  // === 1. ЕКСПОРТ ДАНИХ ===
  const handleExport = async () => {
    try {
      // 1. Отримуємо всі дані з БД
      const allData = await DataService.getAllItems();
      const jsonData = JSON.stringify(allData, null, 2);

      // 2. Створюємо тимчасовий файл
      const fileUri = FileSystem.documentDirectory + 'mindflow_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, jsonData, { encoding: 'utf8' });

      // 3. Відкриваємо діалог "Поділитися/Зберегти"
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Помилка", "Функція 'Поділитися' недоступна на цьому пристрої");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Не вдалося створити файл резервної копії");
    }
  };

  // === 2. ІМПОРТ ДАНИХ ===
  const handleImport = async () => {
    try {
      // 1. Відкриваємо пікер файлів
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json', // Тільки JSON
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;

      // 2. Читаємо файл
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      
      // 3. Валідація JSON (спрощена)
      const parsedData = JSON.parse(fileContent);
      if (!Array.isArray(parsedData)) {
        throw new Error("Невірний формат файлу (має бути масив)");
      }

      // 4. Завантажуємо в БД
      // Питаємо підтвердження, бо це перезапише дані
      Alert.alert(
        "Підтвердження імпорту",
        "Це замінить усі ваші поточні записи даними з файлу. Ви впевнені?",
        [
          { text: "Скасувати", style: "cancel" },
          { 
            text: "Імпортувати", 
            onPress: async () => {
              await DataService.importData(fileContent); // Зберігаємо як string
              Alert.alert("Успіх", "Дані успішно відновлено!");
            } 
          }
        ]
      );

    } catch (error) {
      console.error(error);
      Alert.alert("Помилка", "Не вдалося прочитати файл. Переконайтеся, що це коректний JSON backup.");
    }
  };

  // === 3. ПОВНЕ ВИДАЛЕННЯ ===
  const handleDeleteAll = () => {
    Alert.alert(
      "Видалити ВСІ дані?",
      "Ви впевнені, що хочете видалити всі локальні дані? Цю дію неможливо скасувати.",
      [
        { text: "Скасувати", style: "cancel" },
        { 
          text: "Видалити все", 
          style: "destructive", // Червоний колір на iOS
          onPress: async () => {
            await DataService.clearAllData();
            Alert.alert("Виконано", "Застосунок очищено. Можна починати з чистого аркуша.");
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* Секція: Дані */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Збереження і відновлення даних</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleExport}>
          <Ionicons name="cloud-upload-outline" size={24} color="#333" />
          <View style={styles.textWrapper}>
            <Text style={styles.buttonTitle}>Експорт даних</Text>
            <Text style={styles.buttonSubtitle}>Зберегти резервну копію у файл JSON</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleImport}>
          <Ionicons name="cloud-download-outline" size={24} color="#333" />
          <View style={styles.textWrapper}>
            <Text style={styles.buttonTitle}>Імпорт даних</Text>
            <Text style={styles.buttonSubtitle}>Відновити дані з файлу JSON</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Секція: Небезпечна зона */}
      <View style={[styles.section, styles.dangerZone]}>
        <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Небезпечна зона</Text>
        
        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAll}>
          <Ionicons name="trash-bin-outline" size={24} color="#fff" />
          <Text style={styles.dangerButtonText}>Видалити всі локальні дані</Text>
        </TouchableOpacity>
        
        <Text style={styles.warningText}>
          Увага: Ця дія безповоротно видалить усі ваші думки, справи та ідеї з цього пристрою.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>MindFlow v1.0.0</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  textWrapper: {
    marginLeft: 15,
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  buttonSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  
  // Danger Zone
  dangerZone: {
    marginTop: 30,
    borderColor: '#ffcccb', // light red border
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 5,
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  warningText: {
    marginTop: 15,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    color: '#ccc',
    fontSize: 12,
  },
});