// src/screens/RawThoughtsScreen.js
import React, { useState, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import DataService from '../data/DataService';
import { ItemType } from '../constants/types';
import { useTheme } from '../context/ThemeContext';

export default function RawThoughtsScreen() {
  const { colors } = useTheme();
  const [thoughts, setThoughts] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editText, setEditText] = useState('');

  const loadData = async () => {
    const rawData = await DataService.getRawThoughts();
    setThoughts(rawData);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const handleUpdate = async () => {
    if (!editText.trim()) return;
    await DataService.updateItem(selectedItem.id, { text: editText.trim() });
    setEditModalVisible(false);
    loadData();
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={80} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Поки що тут нічого немає</Text>
    </View>
  );

  const ThoughtItem = ({ item }) => {
    const swipeableRef = useRef(null);

    const closeSwipe = () => swipeableRef.current?.close();

    const renderRightActions = () => (
      <View style={styles.rightActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#FFB870' }]} 
          onPress={() => { closeSwipe(); DataService.archiveItem(item.id).then(loadData); }}
        >
          <Ionicons name="archive-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.error }]} 
          onPress={() => { closeSwipe(); DataService.deleteItem(item.id).then(loadData); }}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );

    const renderLeftActions = () => (
      <View style={styles.leftActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#D0BCFF' }]} 
          onPress={() => { closeSwipe(); DataService.convertItem(item.id, ItemType.IDEA).then(loadData); }}
        >
          <Ionicons name="bulb-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: '#B4E09E' }]} 
          onPress={() => { closeSwipe(); DataService.convertItem(item.id, ItemType.TASK).then(loadData); }}
        >
          <Ionicons name="checkbox-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );

    return (
      <Swipeable
        ref={swipeableRef}
        friction={1} // Менше тертя — легше відкривати
        overshootLeft={false}
        overshootRight={false}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
      >
        <TouchableOpacity 
          activeOpacity={0.6}
          onPress={() => {
            setSelectedItem(item);
            setEditText(item.text);
            setEditModalVisible(true);
          }}
          style={[styles.itemContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text style={[styles.itemText, { color: colors.text }]}>{item.text}</Text>
          <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={thoughts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        renderItem={({ item }) => <ThoughtItem item={item} />}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      <Modal visible={editModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Редагувати</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]} 
                  multiline 
                  autoFocus
                  value={editText} 
                  onChangeText={setEditText} 
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalBtn} onPress={() => setEditModalVisible(false)}>
                    <Text style={{ color: colors.primary }}>Скасувати</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalBtn, { backgroundColor: colors.primary, borderRadius: 12 }]} 
                    onPress={handleUpdate}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Зберегти</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  itemContainer: { 
    padding: 16, 
    marginHorizontal: 16, 
    marginVertical: 4, 
    borderRadius: 16, 
    borderWidth: 1,
    elevation: 2, // Додаємо тінь для Android, щоб бачити межі
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemText: { fontSize: 16, lineHeight: 24 },
  itemDate: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  rightActions: { 
    flexDirection: 'row', 
    width: 140, 
    marginVertical: 4, 
    paddingRight: 16 
  },
  leftActions: { 
    flexDirection: 'row', 
    width: 140, 
    marginVertical: 4, 
    paddingLeft: 16 
  },
  actionBtn: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 16, 
    marginHorizontal: 4 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalView: { 
    width: '85%', 
    borderRadius: 28, 
    padding: 24 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 16 
  },
  input: { 
    borderRadius: 12, 
    padding: 12, 
    minHeight: 100, 
    textAlignVertical: 'top', 
    fontSize: 16 
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 20 
  },
  modalBtn: { 
    padding: 12, 
    paddingHorizontal: 20, 
    marginLeft: 8 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 100 
  },
  emptyTitle: { 
    fontSize: 18, 
    marginTop: 16, 
    fontWeight: '600' 
  },
});