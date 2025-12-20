// src/screens/SettingsScreen.js
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import DataService from '../data/DataService';

export default function SettingsScreen() {
  // Стан для модального вікна видалення
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleExport = async () => {
    try {
      const allData = await DataService.getAllItems();
      const jsonData = JSON.stringify(allData, null, 2);
      const fileUri = FileSystem.documentDirectory + 'mindflow_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, jsonData, { encoding: 'utf8' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      await DataService.importData(fileContent);
      // Тут можна додати Material 3 Snackbar або просте сповіщення про успіх
    } catch (error) {
      console.error(error);
    }
  };

  const confirmDeleteAll = async () => {
    await DataService.clearAllData();
    setDeleteModalVisible(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <Text style={styles.sectionHeader}>Дані та резервні копії</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.row} onPress={handleExport}>
          <View style={[styles.iconBox, { backgroundColor: '#EADDFF' }]}>
            <Ionicons name="cloud-upload-outline" size={22} color="#21005D" />
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.rowTitle}>Експорт даних</Text>
            <Text style={styles.rowSubtitle}>Зберегти все у файл JSON</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#49454F" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.row} onPress={handleImport}>
          <View style={[styles.iconBox, { backgroundColor: '#EADDFF' }]}>
            <Ionicons name="cloud-download-outline" size={22} color="#21005D" />
          </View>
          <View style={styles.textWrapper}>
            <Text style={styles.rowTitle}>Імпорт даних</Text>
            <Text style={styles.rowSubtitle}>Відновити записи з файлу</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#49454F" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionHeader, { color: '#B3261E' }]}>Небезпечна зона</Text>
      <View style={[styles.card, styles.dangerCard]}>
        <TouchableOpacity style={styles.row} onPress={() => setDeleteModalVisible(true)}>
          <View style={[styles.iconBox, { backgroundColor: '#F9DEDC' }]}>
            <Ionicons name="trash-outline" size={22} color="#B3261E" />
          </View>
          <View style={styles.textWrapper}>
            <Text style={[styles.rowTitle, { color: '#B3261E' }]}>Видалити всі дані</Text>
            <Text style={styles.rowSubtitle}>Безповоротне очищення застосунку</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* КУСТОМНЕ MATERIAL 3 МОДАЛЬНЕ ВІКНО ВИДАЛЕННЯ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning-outline" size={28} color="#B3261E" />
            </View>
            <Text style={styles.modalTitle}>Видалити все?</Text>
            <Text style={styles.modalText}>
              Цю дію неможливо скасувати. Всі ваші думки, ідеї та завдання зникнуть назавжди.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.deleteConfirmBtn]} 
                onPress={confirmDeleteAll}
              >
                <Text style={styles.deleteBtnText}>Видалити все</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Text style={styles.versionText}>MindFlow v1.3.0</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF7FF' },
  content: { padding: 16 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6750A4',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#F7F2FA', 
    borderRadius: 28, 
    overflow: 'hidden',
    marginBottom: 16,
  },
  dangerCard: { backgroundColor: '#FFF1F0' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textWrapper: { flex: 1 },
  rowTitle: { fontSize: 16, color: '#1C1B1F', fontWeight: '500' },
  rowSubtitle: { fontSize: 14, color: '#49454F', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#CAC4D0', marginLeft: 72 },
  
  // Стилі модального вікна M3
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '85%',
    backgroundColor: '#F7F2FA',
    borderRadius: 28,
    padding: 24,
    elevation: 6,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    color: '#1C1B1F',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '400',
  },
  modalText: {
    fontSize: 16,
    color: '#49454F',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    marginLeft: 8,
  },
  deleteConfirmBtn: {
    backgroundColor: '#B3261E',
  },
  deleteBtnText: { color: '#FFF', fontWeight: '500' },
  cancelBtnText: { color: '#6750A4', fontWeight: '500' },
  
  footer: { padding: 32, alignItems: 'center' },
  versionText: { color: '#938F99', fontSize: 12, fontWeight: '500' },
});