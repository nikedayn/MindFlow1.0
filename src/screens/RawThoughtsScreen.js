// src/screens/RawThoughtsScreen.js
import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput, 
  Platform 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import DataService from '../data/DataService';
import { ItemType } from '../constants/types';

// === КОМПОНЕНТ ОДНОГО ЕЛЕМЕНТА СПИСКУ (SWIPEABLE) ===
const ThoughtItem = ({ item, onSwipeLeft, onSwipeRight }) => {
  
  // Рендер дій при свайпі вправо (Архів/Видалити)
  const renderRightActions = (progress, dragX) => {
    return (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.archiveBtn]} onPress={() => onSwipeRight('archive', item)}>
          <Ionicons name="archive-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Архів</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteBtn]} onPress={() => onSwipeRight('delete', item)}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>Видалити</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Рендер дій при свайпі вліво (Ідея/Справа)
  const renderLeftActions = (progress, dragX) => {
    return (
      <View style={styles.leftActionsContainer}>
        <TouchableOpacity style={[styles.actionButton, styles.ideaBtn]} onPress={() => onSwipeLeft('idea', item)}>
          <Ionicons name="bulb-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>В Ідею</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.taskBtn]} onPress={() => onSwipeLeft('task', item)}>
          <Ionicons name="checkbox-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>В Справу</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} renderLeftActions={renderLeftActions}>
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{item.text}</Text>
        <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </Swipeable>
  );
};

// === ГОЛОВНИЙ ЕКРАН ===
export default function RawThoughtsScreen({ navigation }) {
  const [thoughts, setThoughts] = useState([]);
  
  // Стейт для модального вікна конвертації
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [targetType, setTargetType] = useState(null); // 'task' або 'idea'
  
  // Дані форми в модальному вікні
  const [editText, setEditText] = useState('');
  const [editTag, setEditTag] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Завантаження даних при кожному вході на екран
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await DataService.getRawThoughts();
    setThoughts(data);
  };

  // Обробка свайпа вправо (Архів/Видалення)
  const handleSwipeRight = async (action, item) => {
    if (action === 'archive') {
      await DataService.archiveItem(item.id);
      loadData(); // Оновлюємо список
    } else if (action === 'delete') {
      Alert.alert(
        "Видалити?",
        "Цю дію неможливо скасувати.",
        [
          { text: "Скасувати", style: "cancel" },
          { text: "Видалити", style: "destructive", onPress: async () => {
              await DataService.deleteItem(item.id);
              loadData();
            } 
          }
        ]
      );
    }
  };

  // Обробка свайпа вліво (Відкриття модалки)
  const handleSwipeLeft = (type, item) => {
    setSelectedItem(item);
    setTargetType(type); // 'task' або 'idea'
    
    // Заповнюємо форму поточними даними
    setEditText(item.text);
    setEditTag('');
    setDueDate(new Date());
    
    setModalVisible(true);
  };

  // Збереження конвертації
  const handleConvert = async () => {
    if (!editText.trim()) return;

    const updates = {
      text: editText,
      tag: editTag.trim() || null, // якщо пустий рядок - null
    };

    if (targetType === 'task') {
      updates.dueDate = dueDate.toISOString();
      updates.isCompleted = false;
    }

    const newType = targetType === 'task' ? ItemType.TASK : ItemType.IDEA;
    
    await DataService.convertItem(selectedItem.id, newType, updates);
    
    setModalVisible(false);
    loadData();
    Alert.alert("Успіх", `Перенесено в ${targetType === 'task' ? 'Справи' : 'Ідеї'}`);
  };

  // Рендер списку
  return (
    <View style={styles.container}>
      <FlatList
        data={thoughts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ThoughtItem 
            item={item} 
            onSwipeRight={handleSwipeRight} 
            onSwipeLeft={handleSwipeLeft} 
          />
        )}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Сирі думки</Text>
            <Text style={styles.headerSubtitle}>Просто ваші сирі думки</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Поки що тут пусто.</Text>
            <Text style={styles.emptySubText}>Поверніться на Головну, щоб додати думку.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* === МОДАЛЬНЕ ВІКНО КОНВЕРТАЦІЇ === */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {targetType === 'task' ? 'Нова Справа' : 'Нова Ідея'}
            </Text>

            {/* Редагування тексту */}
            <Text style={styles.label}>Зміст:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              value={editText}
              onChangeText={setEditText}
            />

            {/* Тег */}
            <Text style={styles.label}>Тег (опціонально):</Text>
            <TextInput
              style={styles.input}
              placeholder="Робота, Дім..."
              value={editTag}
              onChangeText={setEditTag}
            />

            {/* Дата (Тільки для Task) */}
            {targetType === 'task' && (
              <View>
                <Text style={styles.label}>Дата виконання:</Text>
                <TouchableOpacity 
                  style={styles.dateButton} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{dueDate.toLocaleDateString()} {dueDate.toLocaleTimeString().slice(0,5)}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#333" />
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={dueDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios'); // На iOS не закриваємо відразу
                      if (selectedDate) setDueDate(selectedDate);
                    }}
                  />
                )}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Скасувати</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleConvert}
              >
                <Text style={[styles.btnText, {color: '#fff'}]}>Зберегти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  // Header
  headerContainer: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#F5F7FA',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  // List Item
  itemContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 18,
    color: '#333',
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  // Swipe Actions
  rightActionsContainer: {
    flexDirection: 'row',
    width: 160, 
  },
  leftActionsContainer: {
    flexDirection: 'row',
    width: 160,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  archiveBtn: { backgroundColor: '#FF9500' }, // Orange
  deleteBtn: { backgroundColor: '#FF3B30' }, // Red
  ideaBtn: { backgroundColor: '#5856D6' }, // Purple
  taskBtn: { backgroundColor: '#34C759' }, // Green
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: '#ddd',
  },
  saveBtn: {
    backgroundColor: '#4A90E2',
  },
  btnText: {
    fontWeight: '600',
    fontSize: 16,
  },
});