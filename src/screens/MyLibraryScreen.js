// src/screens/MyLibraryScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Platform,
  useWindowDimensions 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TabView, TabBar } from 'react-native-tab-view'; 

import DataService from '../data/DataService';
import { ItemType } from '../constants/types';

// === КОМПОНЕНТ ЕЛЕМЕНТА СПИСКУ ===
const LibraryItem = ({ item, type, onToggleComplete, onPressItem, onLongPressItem }) => (
  <TouchableOpacity 
    style={styles.itemContainer} 
    onPress={() => onPressItem(item)} 
    onLongPress={() => onLongPressItem(item)}
    activeOpacity={0.7}
    delayLongPress={300}
  >
    {type === 'tasks' && (
      <TouchableOpacity onPress={() => onToggleComplete(item)} style={styles.checkboxContainer}>
        <Ionicons 
          name={item.isCompleted ? "checkmark-circle" : "ellipse-outline"} 
          size={26} 
          color={item.isCompleted ? "#6750A4" : "#49454F"} 
        />
      </TouchableOpacity>
    )}
    <View style={styles.textContainer}>
      <Text style={[styles.itemText, (item.isCompleted && type === 'tasks') && styles.completedText]}>
        {item.text}
      </Text>
      <View style={styles.metaContainer}>
        {item.tag && <View style={styles.tagBadge}><Text style={styles.tagText}>#{item.tag}</Text></View>}
        {item.dueDate && <Text style={styles.dateText}>📅 {new Date(item.dueDate).toLocaleDateString()}</Text>}
      </View>
    </View>
  </TouchableOpacity>
);

const LibraryTab = ({ routeKey, onDataChange, refreshCounter }) => {
  const [data, setData] = useState([]);
  
  // Модальні вікна
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Дані редагування
  const [editText, setEditText] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadData = useCallback(async () => {
    let result = [];
    if (routeKey === 'tasks') result = await DataService.getTasks();
    else if (routeKey === 'ideas') result = await DataService.getIdeas();
    else if (routeKey === 'archive') result = await DataService.getArchived();
    setData(result);
  }, [routeKey]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));
  useEffect(() => { if (refreshCounter > 0) loadData(); }, [refreshCounter, loadData]);

  // Сценарій 1: Натискання (Редагування)
  const handlePressItem = (item) => {
    setSelectedItem(item);
    setEditText(item.text);
    setEditTag(item.tag || '');
    setEditDate(item.dueDate ? new Date(item.dueDate) : new Date());
    setEditModalVisible(true);
  };

  // Сценарій 2: Затискання (Швидкі дії)
  const handleLongPressItem = (item) => {
    setSelectedItem(item);
    setActionsModalVisible(true);
  };

  const saveEdit = async () => {
    const updates = { text: editText, tag: editTag.trim() || null };
    if (selectedItem.type === ItemType.TASK) updates.dueDate = editDate.toISOString();
    await DataService.updateItem(selectedItem.id, updates);
    setEditModalVisible(false);
    onDataChange();
  };

  const handleQuickAction = async (action) => {
    setActionsModalVisible(false);
    if (action === 'archive') {
      await DataService.archiveItem(selectedItem.id);
    } else if (action === 'restore') {
      await DataService.updateItem(selectedItem.id, { status: 'active' });
    } else if (action === 'convert') {
      const newType = selectedItem.type === ItemType.TASK ? ItemType.IDEA : ItemType.TASK;
      await DataService.convertItem(selectedItem.id, newType, {
        dueDate: newType === ItemType.TASK ? new Date().toISOString() : null
      });
    } else if (action === 'delete') {
      setDeleteModalVisible(true);
      return;
    }
    onDataChange();
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
            onToggleComplete={async (i) => { 
              await DataService.updateItem(i.id, { isCompleted: !i.isCompleted }); 
              onDataChange(); 
            }}
            onPressItem={handlePressItem}
            onLongPressItem={handleLongPressItem}
          />
        )}
        ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Порожньо</Text></View>}
        contentContainerStyle={{ paddingVertical: 12 }}
      />

      {/* MODAL 1: РЕДАГУВАННЯ */}
      <Modal animationType="fade" transparent={true} visible={editModalVisible} onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Редагувати</Text>
            <TextInput style={[styles.input, styles.textArea]} multiline value={editText} onChangeText={setEditText} />
            <TextInput style={[styles.input, {marginTop: 12}]} placeholder="Тег" value={editTag} onChangeText={setEditTag} placeholderTextColor="#938F99" />
            
            {selectedItem?.type === ItemType.TASK && (
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Text style={{color: '#1C1B1F'}}>{editDate.toLocaleDateString()}</Text>
                <Ionicons name="calendar-outline" size={20} color="#49454F" />
              </TouchableOpacity>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={saveEdit}>
                <Text style={styles.saveBtnText}>Зберегти</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ШВИДКІ ДІЇ (MATERIAL YOU MENU) */}
      <Modal animationType="slide" transparent={true} visible={actionsModalVisible} onRequestClose={() => setActionsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, styles.bottomSheet]}>
            <View style={styles.dragHandle} />
            <Text style={styles.menuTitle}>{selectedItem?.text.substring(0, 30)}...</Text>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction(routeKey === 'archive' ? 'restore' : 'archive')}>
              <Ionicons name={routeKey === 'archive' ? "refresh-outline" : "archive-outline"} size={22} color="#1C1B1F" />
              <Text style={styles.menuText}>{routeKey === 'archive' ? 'Відновити з архіву' : 'Перемістити в архів'}</Text>
            </TouchableOpacity>

            {routeKey !== 'archive' && (
              <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('convert')}>
                <Ionicons name={selectedItem?.type === ItemType.TASK ? "bulb-outline" : "checkbox-outline"} size={22} color="#1C1B1F" />
                <Text style={styles.menuText}>{selectedItem?.type === ItemType.TASK ? 'Зробити ідеєю' : 'Зробити справою'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('delete')}>
              <Ionicons name="trash-outline" size={22} color="#B3261E" />
              <Text style={[styles.menuText, {color: '#B3261E'}]}>Видалити назавжди</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalBtn, styles.closeMenuBtn]} onPress={() => setActionsModalVisible(false)}>
              <Text style={styles.saveBtnText}>Закрити</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ */}
      <Modal animationType="fade" transparent={true} visible={deleteModalVisible} onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Видалити запис?</Text>
            <Text style={styles.modalText}>Цю дію неможливо скасувати.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Скасувати</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#B3261E'}]} onPress={async () => { await DataService.deleteItem(selectedItem.id); setDeleteModalVisible(false); onDataChange(); }}>
                <Text style={styles.saveBtnText}>Видалити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function MyLibraryScreen() {
  const layout = useWindowDimensions();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'tasks', title: 'Справи' },
    { key: 'ideas', title: 'Ідеї' },
    { key: 'archive', title: 'Архів' },
  ]);

  const renderScene = ({ route }) => (
    <LibraryTab routeKey={route.key} onDataChange={() => setRefreshCounter(p => p+1)} refreshCounter={refreshCounter} />
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <TabBar {...props}
          indicatorStyle={{ backgroundColor: '#6750A4', height: 3, borderRadius: 3 }}
          style={{ backgroundColor: '#FEF7FF', elevation: 0, borderBottomWidth: 1, borderBottomColor: '#ECE6F0' }}
          activeColor="#6750A4"
          inactiveColor="#49454F"
          labelStyle={{ fontWeight: '600', textTransform: 'none' }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  sceneContainer: { flex: 1, backgroundColor: '#FEF7FF' },
  itemContainer: { 
    backgroundColor: '#FFF', padding: 16, marginHorizontal: 16, marginVertical: 4,   
    borderRadius: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ECE6F0'
  },
  checkboxContainer: { marginRight: 12 },
  textContainer: { flex: 1 },
  itemText: { fontSize: 16, color: '#1C1B1F' },
  completedText: { textDecorationLine: 'line-through', color: '#938F99' },
  metaContainer: { flexDirection: 'row', marginTop: 8, alignItems: 'center' },
  tagBadge: { backgroundColor: '#EADDFF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 12 },
  tagText: { fontSize: 12, color: '#21005D', fontWeight: '500' },
  dateText: { fontSize: 12, color: '#49454F' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#938F99', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', backgroundColor: '#F7F2FA', borderRadius: 28, padding: 24, elevation: 6 },
  bottomSheet: { width: '100%', position: 'absolute', bottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#CAC4D0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  
  modalTitle: { fontSize: 24, color: '#1C1B1F', marginBottom: 16, fontWeight: '400' },
  modalText: { fontSize: 16, color: '#49454F', marginBottom: 24 },
  menuTitle: { fontSize: 14, color: '#49454F', marginBottom: 16, fontWeight: '500' },
  
  input: { backgroundColor: '#ECE6F0', borderRadius: 4, borderBottomWidth: 1, borderBottomColor: '#49454F', padding: 12, fontSize: 16, color: '#1C1B1F' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  dateBtn: { padding: 12, backgroundColor: '#ECE6F0', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100, marginLeft: 8 },
  saveBtn: { backgroundColor: '#6750A4' },
  closeMenuBtn: { backgroundColor: '#6750A4', marginTop: 16, width: '100%', marginLeft: 0 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#ECE6F0' },
  menuText: { fontSize: 16, color: '#1C1B1F', marginLeft: 16 },
  
  saveBtnText: { color: '#FFF', fontWeight: '500' },
  cancelBtnText: { color: '#6750A4', fontWeight: '500' },
});