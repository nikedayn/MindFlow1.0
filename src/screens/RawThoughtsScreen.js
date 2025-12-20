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
  Platform,
  Animated
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import DataService from '../data/DataService';
import { ItemType } from '../constants/types';

// === ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ ДАТИ ===
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

const groupThoughtsByDate = (thoughts) => {
  const grouped = [];
  let lastDate = null;
  for (const thought of thoughts) {
    const currentDate = new Date(thought.createdAt).toISOString().split('T')[0];
    if (currentDate !== lastDate) {
      grouped.push({ id: 'header-' + currentDate, isHeader: true, date: currentDate });
      lastDate = currentDate;
    }
    grouped.push(thought);
  }
  return grouped;
};

const ThoughtItem = ({ item, onSwipeLeft, onSwipeRight }) => {
  const renderRightActions = (progress) => {
    // Кнопки почнуть з'являтися тільки після того, як свайп пройде 20% шляху
    const opacity = progress.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0, 1],
    });

    const scale = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.9, 1],
    });

    return (
      <View style={styles.rightActionsContainer}>
        <Animated.View style={{ flex: 1, flexDirection: 'row', opacity, transform: [{ scale }] }}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.archiveBtn]} 
            onPress={() => onSwipeRight('archive', item)}
          >
            <Ionicons name="archive-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteBtn]} 
            onPress={() => onSwipeRight('delete', item)}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (progress) => {
    const opacity = progress.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0, 1],
    });

    const scale = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.9, 1],
    });

    return (
      <View style={styles.leftActionsContainer}>
        <Animated.View style={{ flex: 1, flexDirection: 'row', opacity, transform: [{ scale }] }}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.ideaBtn]} 
            onPress={() => onSwipeLeft('idea', item)}
          >
            <Ionicons name="bulb-outline" size={22} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.taskBtn]} 
            onPress={() => onSwipeLeft('task', item)}
          >
            <Ionicons name="checkbox-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable 
      renderRightActions={renderRightActions} 
      renderLeftActions={renderLeftActions}
      friction={2} // Більше значення = важче "тягнути", прибирає дрижання
      overshootRight={false} // Забороняє кнопкам вилітати занадто далеко
      overshootLeft={false}
      dragOffsetFromStart={10} // Свайп почнеться тільки після зсуву на 10 пікселів
    >
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{item.text}</Text>
        <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
    </Swipeable>
  );
};

export default function RawThoughtsScreen() {
  const [thoughts, setThoughts] = useState([]);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [targetType, setTargetType] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTag, setEditTag] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [hasDueDate, setHasDueDate] = useState(false); // Перемикач дати
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    const rawData = await DataService.getRawThoughts();
    setThoughts(groupThoughtsByDate(rawData));
  };

  const handleSwipeRight = (action, item) => {
    setSelectedItem(item);
    if (action === 'archive') { DataService.archiveItem(item.id).then(loadData); }
    else { setDeleteModalVisible(true); }
  };

  const handleSwipeLeft = (type, item) => {
    setSelectedItem(item);
    setTargetType(type);
    setEditText(item.text);
    setEditTag('');
    setHasDueDate(false);
    setDueDate(new Date());
    setConvertModalVisible(true);
  };

  const handleConvert = async () => {
    if (!editText.trim()) return;
    const updates = { 
      text: editText, 
      tag: editTag.trim() || null,
      dueDate: (targetType === 'task' && hasDueDate) ? dueDate.toISOString() : null,
      isCompleted: false
    };
    await DataService.convertItem(selectedItem.id, targetType === 'task' ? ItemType.TASK : ItemType.IDEA, updates);
    setConvertModalVisible(false);
    loadData();
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={thoughts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => item.isHeader ? 
          <View style={styles.headerGap}><Text style={styles.dateHeaderText}>{formatDateHeader(item.date)}</Text></View> : 
          <ThoughtItem item={item} onSwipeRight={handleSwipeRight} onSwipeLeft={handleSwipeLeft} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <Modal animationType="fade" transparent visible={convertModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{targetType === 'task' ? 'Нова справа' : 'Нова ідея'}</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline value={editText} onChangeText={setEditText} />
            <TextInput style={[styles.input, {marginTop: 12}]} placeholder="Тег" value={editTag} onChangeText={setEditTag} placeholderTextColor="#938F99" />
            
            {targetType === 'task' && (
              <View style={{marginTop: 12}}>
                <TouchableOpacity style={styles.dateButton} onPress={() => setHasDueDate(!hasDueDate)}>
                  <Text style={{color: '#1C1B1F'}}>{hasDueDate ? `Дата: ${dueDate.toLocaleDateString()}` : "Без терміну"}</Text>
                  <Ionicons name={hasDueDate ? "calendar" : "calendar-outline"} size={20} color="#6750A4" />
                </TouchableOpacity>
                {hasDueDate && (
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{marginTop: 8}}><Text style={{color: '#6750A4', textAlign: 'center'}}>Змінити дату</Text></TouchableOpacity>
                )}
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker value={dueDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setDueDate(d); }} />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setConvertModalVisible(false)}><Text style={styles.cancelBtnText}>Скасувати</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleConvert}><Text style={styles.saveBtnText}>Зберегти</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={deleteModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Ionicons name="trash-outline" size={28} color="#B3261E" style={{alignSelf: 'center', marginBottom: 16}} />
            <Text style={styles.modalTitle}>Видалити?</Text>
            <Text style={styles.modalText}>Цю дію неможливо скасувати.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setDeleteModalVisible(false)}><Text style={styles.cancelBtnText}>Скасувати</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.deleteConfirmBtn]} onPress={async () => { await DataService.deleteItem(selectedItem.id); setDeleteModalVisible(false); loadData(); }}><Text style={styles.saveBtnText}>Видалити</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF7FF' },
  headerGap: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  dateHeaderText: { fontSize: 14, fontWeight: '500', color: '#6750A4' },
  itemContainer: { backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 4, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ECE6F0' },
  itemText: { fontSize: 16, color: '#1C1B1F', lineHeight: 24 },
  itemDate: { fontSize: 11, color: '#49454F', marginTop: 4, textAlign: 'right' },
  rightActionsContainer: { flexDirection: 'row', width: 140, paddingVertical: 4, paddingRight: 16 },
  leftActionsContainer: { flexDirection: 'row', width: 140, paddingVertical: 4, paddingLeft: 16 },
  actionButton: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginHorizontal: 4 },
  archiveBtn: { backgroundColor: '#FFB870' }, deleteBtn: { backgroundColor: '#F2B8B5' },
  ideaBtn: { backgroundColor: '#D0BCFF' }, taskBtn: { backgroundColor: '#B4E09E' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', backgroundColor: '#F7F2FA', borderRadius: 28, padding: 24, elevation: 6 },
  modalTitle: { fontSize: 24, color: '#1C1B1F', textAlign: 'center', marginBottom: 16 },
  modalText: { fontSize: 16, color: '#49454F', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#ECE6F0', borderRadius: 4, borderBottomWidth: 1, borderBottomColor: '#49454F', padding: 12, fontSize: 16, color: '#1C1B1F' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateButton: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#ECE6F0', borderRadius: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginLeft: 8 },
  saveBtn: { backgroundColor: '#6750A4' }, deleteConfirmBtn: { backgroundColor: '#B3261E' },
  saveBtnText: { color: '#FFF', fontWeight: '500' }, cancelBtnText: { color: '#6750A4', fontWeight: '500' },
});