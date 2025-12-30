// src/screens/MyLibraryScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, TextInput, TouchableOpacity, useWindowDimensions, StyleSheet, 
  Text, FlatList, Modal, TouchableWithoutFeedback, Keyboard 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TabView, TabBar } from 'react-native-tab-view';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../context/ThemeContext';
import { useLibraryData } from '../hooks/useLibraryData';
import { LibraryItem } from '../components/LibraryItem';
import DataService from '../data/DataService';
import { ItemType, ItemStatus } from '../constants/types';

export default function MyLibraryScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const layout = useWindowDimensions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [index, setIndex] = useState(0);

  // Стан для модалок
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  
  // Стан для полів редагування
  const [editText, setEditText] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [hasDueDate, setHasDueDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { getFilteredData, refreshAll } = useLibraryData(searchQuery);

  // Налаштування Header (Пошук зліва)
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => isSearchActive ? (
        <TextInput 
          style={[styles.headerSearchInput, { color: colors.text }]}
          placeholder="Пошук..." 
          placeholderTextColor={colors.outline}
          autoFocus 
          value={searchQuery}
          onChangeText={setSearchQuery} 
        />
      ) : <Text style={[styles.headerTitleText, { color: colors.text }]}>Бібліотека</Text>,
      headerRight: () => (
        <TouchableOpacity onPress={() => {
          if (isSearchActive) setSearchQuery('');
          setIsSearchActive(!isSearchActive);
        }} style={{ marginRight: 15 }}>
          <Ionicons name={isSearchActive ? "close-outline" : "search-outline"} size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [isSearchActive, searchQuery, colors, navigation]);

  const openEdit = (item) => {
    setSelectedItem(item);
    setEditText(item.text);
    setEditTag(item.tag || '');
    setEditDate(item.dueDate ? new Date(item.dueDate) : new Date());
    setHasDueDate(!!item.dueDate);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    const updates = {
      text: editText.trim(),
      tag: editTag.trim() || null,
      dueDate: (selectedItem.type === ItemType.TASK && hasDueDate) ? editDate.toISOString() : null
    };
    await DataService.updateItem(selectedItem.id, updates);
    setEditModalVisible(false);
    refreshAll();
  };

  const handleAction = async (action) => {
    setActionsModalVisible(false);
    if (action === 'archive') {
      await DataService.archiveItem(selectedItem.id);
    } else if (action === 'delete') {
      await DataService.deleteItem(selectedItem.id);
    } else if (action === 'convert') {
      const newType = selectedItem.type === ItemType.TASK ? ItemType.IDEA : ItemType.TASK;
      await DataService.convertItem(selectedItem.id, newType, { 
        dueDate: newType === ItemType.IDEA ? null : selectedItem.dueDate 
      });
    }
    refreshAll();
  };

  const renderScene = ({ route }) => (
    <FlatList 
      data={getFilteredData(route.key)}
      keyExtractor={item => item.id}
      contentContainerStyle={{ paddingVertical: 12, paddingBottom: 100 }}
      renderItem={({ item }) => (
        <LibraryItem 
          item={item} 
          type={route.key} 
          colors={colors}
          onPressItem={openEdit}
          onLongPressItem={(i) => { setSelectedItem(i); setActionsModalVisible(true); }}
          onToggleComplete={async (i) => { 
            await DataService.updateItem(i.id, { isCompleted: !i.isCompleted });
            refreshAll(); 
          }}
        />
      )}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={80} color={colors.border} />
          <Text style={[styles.emptyTitle, {color: colors.textSecondary}]}>
            {searchQuery ? "Нічого не знайдено" : "Тут порожньо"}
          </Text>
        </View>
      )}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TabView
        navigationState={{ 
          index, 
          routes: [
            { key: 'tasks', title: 'Справи', icon: 'checkbox-outline' }, 
            { key: 'ideas', title: 'Ідеї', icon: 'bulb-outline' }
          ] 
        }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar 
            {...props} 
            indicatorStyle={{ backgroundColor: colors.primary, height: 3 }} 
            style={{ 
              backgroundColor: colors.background, 
              borderBottomWidth: 1, 
              borderBottomColor: colors.border,
              elevation: 0,
              shadowOpacity: 0
            }} 
            activeColor={colors.primary}
            inactiveColor={colors.textSecondary}
            renderLabel={({ route, focused, color }) => (
              <View style={styles.tabLabelContainer}>
                <Ionicons name={route.icon} size={18} color={color} />
                <Text style={[styles.tabLabelText, { color }]}>
                  {route.title}
                </Text>
              </View>
            )}
          />
        )}
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setIsSearchActive(!isSearchActive)}
        onLongPress={() => { setSearchQuery(''); setIsSearchActive(false); Keyboard.dismiss(); }}
      >
        <Ionicons name={isSearchActive ? "search" : "search-outline"} size={28} color="#FFF" />
      </TouchableOpacity>

      {/* МОДАЛКА РЕДАГУВАННЯ */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Редагувати</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]} 
                  multiline value={editText} onChangeText={setEditText} 
                />
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, marginTop: 12, minHeight: 45 }]} 
                  placeholder="Тег" placeholderTextColor={colors.outline} value={editTag} onChangeText={setEditTag} 
                />
                
                {selectedItem?.type === ItemType.TASK && (
                  <View style={{marginTop: 16}}>
                    <TouchableOpacity style={[styles.dateToggle, { backgroundColor: colors.surfaceVariant }]} onPress={() => setHasDueDate(!hasDueDate)}>
                      <Text style={{color: colors.text}}>{hasDueDate ? `📅 ${editDate.toLocaleDateString()}` : "Без терміну"}</Text>
                      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    {hasDueDate && (
                      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{marginTop: 8}}>
                        <Text style={{color: colors.primary, textAlign: 'center'}}>Змінити дату</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {showDatePicker && <DateTimePicker value={editDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setEditDate(d); }} />}

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalBtn} onPress={() => setEditModalVisible(false)}>
                    <Text style={{ color: colors.primary }}>Скасувати</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary, borderRadius: 12 }]} onPress={handleSaveEdit}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Зберегти</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* МЕНЮ ШВИДКИХ ДІЙ */}
      <Modal visible={actionsModalVisible} transparent animationType="slide" onRequestClose={() => setActionsModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setActionsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
              
              <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('archive')}>
                <Ionicons name="archive-outline" size={24} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>В архів</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('convert')}>
                <Ionicons 
                  name={selectedItem?.type === ItemType.TASK ? "bulb-outline" : "checkbox-outline"} 
                  size={24} color={colors.text} 
                />
                <Text style={[styles.menuText, { color: colors.text }]}>
                  {selectedItem?.type === ItemType.TASK ? 'Зробити ідеєю' : 'Зробити справою'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('delete')}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
                <Text style={[styles.menuText, { color: colors.error }]}>Видалити</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSearchInput: { fontSize: 18, width: '100%' },
  headerTitleText: { fontSize: 20, fontWeight: 'bold' },
  tabLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  tabLabelText: { fontWeight: '700', marginLeft: 8, textTransform: 'none' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 16, marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', padding: 24, borderRadius: 28, elevation: 6 },
  modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', paddingBottom: 40, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  input: { minHeight: 80, padding: 12, borderRadius: 12, fontSize: 16, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, marginLeft: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  menuText: { fontSize: 16, fontWeight: '500', marginLeft: 16 },
  dateToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12 },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', elevation: 10, zIndex: 999,
  }
});