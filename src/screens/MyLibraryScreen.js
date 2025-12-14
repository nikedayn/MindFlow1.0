// src/screens/MyLibraryScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal,
  TextInput,
  Platform,
  useWindowDimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view'; // <--- НОВІ ІМПОРТИ

import DataService from '../data/DataService';
import { ItemType } from '../constants/types';

// =========================================================
// 1. КОМПОНЕНТ ОДНОГО ЕЛЕМЕНТА СПИСКУ (Той самий, що й був)
// =========================================================
const LibraryItem = ({ item, type, onSwipeLeft, onSwipeRight, onToggleComplete }) => {
  const renderRightActions = () => (
    <View style={styles.rightActionsContainer}>
      {type === 'archive' ? (
         <TouchableOpacity style={[styles.actionButton, styles.deleteBtn]} onPress={() => onSwipeRight('delete', item)}>
           <Ionicons name="trash-outline" size={24} color="#fff" />
           <Text style={styles.actionText}>Видалити</Text>
         </TouchableOpacity>
      ) : (
         <>
           <TouchableOpacity style={[styles.actionButton, styles.archiveBtn]} onPress={() => onSwipeRight('archive', item)}>
             <Ionicons name="archive-outline" size={24} color="#fff" />
             <Text style={styles.actionText}>Архів</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.actionButton, styles.deleteBtn]} onPress={() => onSwipeRight('delete', item)}>
             <Ionicons name="trash-outline" size={24} color="#fff" />
             <Text style={styles.actionText}>Видалити</Text>
           </TouchableOpacity>
         </>
      )}
    </View>
  );

  const renderLeftActions = () => {
    if (type === 'ideas') return null;
    return (
      <View style={styles.leftActionsContainer}>
        {type === 'archive' ? (
          <TouchableOpacity style={[styles.actionButton, styles.restoreBtn]} onPress={() => onSwipeLeft('restore', item)}>
            <Ionicons name="arrow-undo-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Повернути</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionButton, styles.editBtn]} onPress={() => onSwipeLeft('edit', item)}>
            <Ionicons name="create-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Редагувати</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} renderLeftActions={renderLeftActions}>
      <View style={styles.itemContainer}>
        {type === 'tasks' && (
          <TouchableOpacity onPress={() => onToggleComplete(item)} style={styles.checkboxContainer}>
            <Ionicons name={item.isCompleted ? "checkbox" : "square-outline"} size={28} color={item.isCompleted ? "#4CD964" : "#999"} />
          </TouchableOpacity>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.itemText, (item.isCompleted && type === 'tasks') && styles.completedText]}>
            {item.text}
          </Text>
          <View style={styles.metaContainer}>
             {item.tag && <Text style={styles.tagText}>#{item.tag}</Text>}
             {item.dueDate && <Text style={styles.dateText}>📅 {new Date(item.dueDate).toLocaleDateString()}</Text>}
          </View>
        </View>
      </View>
    </Swipeable>
  );
};

// =========================================================
// 2. КОМПОНЕНТ ВКЛАДКИ (СПИСОК)
// =========================================================
const LibraryTab = ({ routeKey }) => {
  const [data, setData] = useState([]);
  
  // Modal State (локальний для вкладки)
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Завантаження даних при фокусі
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [routeKey])
  );

  const loadData = async () => {
    let result = [];
    if (routeKey === 'tasks') result = await DataService.getTasks();
    else if (routeKey === 'ideas') result = await DataService.getIdeas();
    else if (routeKey === 'archive') result = await DataService.getArchived();
    setData(result);
  };

  const handleToggleComplete = async (item) => {
    await DataService.updateItem(item.id, { isCompleted: !item.isCompleted });
    loadData();
  };

  const handleSwipeRight = async (action, item) => {
    if (action === 'archive') await DataService.archiveItem(item.id);
    else if (action === 'delete') {
      Alert.alert("Видалити?", "Безповоротно.", [
        { text: "Скасувати", style: "cancel" },
        { text: "Видалити", style: "destructive", onPress: async () => {
            await DataService.deleteItem(item.id);
            loadData();
        }}
      ]);
      return;
    }
    loadData();
  };

  const handleSwipeLeft = async (action, item) => {
    if (action === 'restore') {
      await DataService.updateItem(item.id, { status: 'active' });
      loadData();
    } else if (action === 'edit') {
      setEditingItem(item);
      setEditText(item.text);
      setEditTag(item.tag || '');
      setEditDate(item.dueDate ? new Date(item.dueDate) : new Date());
      setEditModalVisible(true);
    }
  };

  const saveEdit = async () => {
    const updates = { text: editText, tag: editTag.trim() || null };
    if (editingItem.type === ItemType.TASK) updates.dueDate = editDate.toISOString();
    await DataService.updateItem(editingItem.id, updates);
    setEditModalVisible(false);
    loadData();
  };

  return (
    <View style={styles.sceneContainer}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <LibraryItem 
            item={item} 
            type={routeKey}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            onToggleComplete={handleToggleComplete}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Пусто</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Модальне вікно (вбудоване в кожну вкладку для простоти) */}
      <Modal animationType="slide" transparent={true} visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Редагування</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline value={editText} onChangeText={setEditText} />
            <TextInput style={styles.input} placeholder="Тег" value={editTag} onChangeText={setEditTag} />
            {editingItem?.type === ItemType.TASK && (
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text>{editDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar" size={20} />
              </TouchableOpacity>
            )}
            {showDatePicker && (
               <DateTimePicker value={editDate} mode="date" onChange={(e, d) => { setShowDatePicker(Platform.OS==='ios'); if(d) setEditDate(d); }} />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setEditModalVisible(false)}><Text>Скасувати</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={saveEdit}><Text style={{color:'#fff'}}>Зберегти</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// =========================================================
// 3. ГОЛОВНИЙ ЕКРАН (TabView)
// =========================================================
export default function MyLibraryScreen() {
  const layout = useWindowDimensions();

  // Налаштування вкладок
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'tasks', title: 'Справи' },
    { key: 'ideas', title: 'Ідеї' },
    { key: 'archive', title: 'Архів' },
  ]);

  // Рендер сцен (вкладок)
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'tasks': return <LibraryTab routeKey="tasks" />;
      case 'ideas': return <LibraryTab routeKey="ideas" />;
      case 'archive': return <LibraryTab routeKey="archive" />;
      default: return null;
    }
  };

  // Кастомізація верхньої панелі вкладок
  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#4A90E2', height: 3 }}
      style={{ backgroundColor: 'white' }}
      activeColor="#4A90E2"
      inactiveColor="#999"
      labelStyle={{ fontWeight: 'bold' }}
    />
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={renderTabBar}
    />
  );
}

const styles = StyleSheet.create({
  sceneContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  
  // Item Styles
  itemContainer: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', alignItems: 'center' },
  checkboxContainer: { marginRight: 15 },
  textContainer: { flex: 1 },
  itemText: { fontSize: 16, color: '#333' },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },
  metaContainer: { flexDirection: 'row', marginTop: 5, alignItems: 'center' },
  tagText: { fontSize: 12, color: '#4A90E2', marginRight: 10, fontWeight: '600' },
  dateText: { fontSize: 12, color: '#999' },
  
  // Swipe Actions
  rightActionsContainer: { flexDirection: 'row', width: 140 },
  leftActionsContainer: { flexDirection: 'row', width: 80 },
  actionButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  archiveBtn: { backgroundColor: '#FF9500' },
  deleteBtn: { backgroundColor: '#FF3B30' },
  editBtn: { backgroundColor: '#4A90E2' },
  restoreBtn: { backgroundColor: '#34C759' },
  actionText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 2 },

  // Empty
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', fontSize: 16 },

  // Modal (спрощені стилі)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '90%', backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, backgroundColor: '#f9f9f9', marginBottom: 10 },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  dateBtn: { padding: 10, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  cancelBtn: { backgroundColor: '#eee' },
  saveBtn: { backgroundColor: '#4A90E2' },
});