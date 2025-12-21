// src/screens/RawThoughtsScreen.js
// src/screens/RawThoughtsScreen.js
import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import DataService from '../data/DataService';
import { ItemType } from '../constants/types';
import { useTheme } from '../context/ThemeContext';

// Допоміжна функція для форматування заголовка дати
const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const options = { month: 'long', day: 'numeric' };
  if (isSameDay(date, today)) return `Сьогодні, ${date.toLocaleDateString('uk-UA', options)}`;
  if (isSameDay(date, yesterday)) return `Вчора, ${date.toLocaleDateString('uk-UA', options)}`;

  return date.toLocaleDateString('uk-UA', { year: 'numeric', ...options });
};

// Функція для перетворення плаского списку у список із заголовками
const groupThoughtsByDate = (thoughts) => {
  const grouped = [];
  let lastDate = null;

  thoughts.forEach((thought) => {
    const currentDate = new Date(thought.createdAt).toISOString().split('T')[0];
    if (currentDate !== lastDate) {
      grouped.push({ id: `header-${currentDate}`, isHeader: true, date: currentDate });
      lastDate = currentDate;
    }
    grouped.push(thought);
  });
  return grouped;
};

export default function RawThoughtsScreen() {
  const { colors } = useTheme();
  const [thoughts, setThoughts] = useState([]);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [editText, setEditText] = useState('');

  // Завантаження даних при фокусі екрану
  const loadData = async () => {
    const rawData = await DataService.getRawThoughts();
    // Сортуємо за часом (нові зверху) перед групуванням
    const sorted = rawData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setThoughts(groupThoughtsByDate(sorted));
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  // Збереження редагованого тексту
  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    await DataService.updateItem(selectedItem.id, { text: editText.trim() });
    setEditModalVisible(false);
    loadData();
  };

  // Обробка швидких дій із меню
  const handleQuickAction = async (action) => {
    setActionsModalVisible(false);
    if (action === 'archive') await DataService.archiveItem(selectedItem.id);
    else if (action === 'to_idea') await DataService.convertItem(selectedItem.id, ItemType.IDEA);
    else if (action === 'to_task') await DataService.convertItem(selectedItem.id, ItemType.TASK);
    else if (action === 'delete') { setDeleteModalVisible(true); return; }
    loadData();
  };

  // Рендеринг кожного елемента списку
  const renderItem = ({ item }) => {
    if (item.isHeader) {
      return (
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: colors.primary }]}>
            {formatDateHeader(item.date)}
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => {
          setSelectedItem(item);
          setEditText(item.text);
          setEditModalVisible(true);
        }}
        onLongPress={() => {
          setSelectedItem(item);
          setActionsModalVisible(true);
        }}
        delayLongPress={300}
        style={[styles.itemContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.textContainer}>
          <Text style={[styles.itemText, { color: colors.text }]}>{item.text}</Text>
          <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
            🕒 {new Date(item.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.border} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={thoughts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={thoughts.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Поки що порожньо</Text>
          </View>
        )}
      />

      {/* MODALS (EDIT, ACTIONS, DELETE) - залишаються такими ж, як у попередній відповіді */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Редагувати</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]} 
                  multiline autoFocus value={editText} onChangeText={setEditText} 
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalBtn} onPress={() => setEditModalVisible(false)}>
                    <Text style={{ color: colors.primary }}>Скасувати</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, borderRadius: 12 }]} onPress={handleSaveEdit}>
                    <Text style={{ color: '#fff' }}>Зберегти</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={actionsModalVisible} transparent animationType="slide" onRequestClose={() => setActionsModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setActionsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalView, styles.bottomSheet, { backgroundColor: colors.card }]}>
                <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('to_idea')}>
                  <Ionicons name="bulb-outline" size={22} color={colors.text} />
                  <Text style={[styles.menuText, { color: colors.text }]}>Зробити ідеєю</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('to_task')}>
                  <Ionicons name="checkbox-outline" size={22} color={colors.text} />
                  <Text style={[styles.menuText, { color: colors.text }]}>Зробити справою</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('archive')}>
                  <Ionicons name="archive-outline" size={22} color={colors.text} />
                  <Text style={[styles.menuText, { color: colors.text }]}>В архів</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('delete')}>
                  <Ionicons name="trash-outline" size={22} color={colors.error} />
                  <Text style={[styles.menuText, { color: colors.error }]}>Видалити</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalView, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Видалити?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setDeleteModalVisible(false)}><Text style={{ color: colors.primary }}>Ні</Text></TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: colors.error, borderRadius: 12 }]} 
                  onPress={async () => {
                    await DataService.deleteItem(selectedItem.id);
                    setDeleteModalVisible(false);
                    loadData();
                  }}
                >
                  <Text style={{ color: '#fff' }}>Так</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Загальні контейнери ---
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },

  // --- Заголовок списку (Header) ---
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // --- Елемент списку (Item Card) ---
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    lineHeight: 22,
  },
  itemTime: {
    fontSize: 12,
    marginTop: 6,
  },

  // --- Модальні вікна та Overlay ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '85%',
    borderRadius: 28,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  // --- Форми та Кнопки ---
  input: {
    minHeight: 100,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    textAlignVertical: 'top', // Важливо для Android
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 8,
  },

  // --- Bottom Sheet (Нижня панель) ---
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingBottom: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  // --- Меню ---
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
});