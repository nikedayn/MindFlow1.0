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
  useWindowDimensions,
  TouchableWithoutFeedback 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TabView, TabBar } from 'react-native-tab-view'; 

import DataService from '../data/DataService';
import { ItemType, ItemStatus } from '../constants/types';
import { useTheme } from '../context/ThemeContext';

const LibraryItem = ({ item, type, onToggleComplete, onPressItem, onLongPressItem, colors }) => (
  <TouchableOpacity 
    style={[styles.itemContainer, { backgroundColor: colors.surface, borderColor: colors.border }]} 
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
          color={item.isCompleted ? colors.primary : colors.textSecondary} 
        />
      </TouchableOpacity>
    )}
    <View style={styles.textContainer}>
      <Text style={[styles.itemText, { color: colors.text }, (item.isCompleted && type === 'tasks') && styles.completedText]}>
        {item.text}
      </Text>
      <View style={styles.metaContainer}>
        {item.tag && (
          <View style={[styles.tagBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>#{item.tag}</Text>
          </View>
        )}
        {item.dueDate && type === 'tasks' && (
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            📅 {new Date(item.dueDate).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.border} />
  </TouchableOpacity>
);

const LibraryTab = ({ routeKey, data, refreshAll }) => {
  const { colors } = useTheme();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [editText, setEditText] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [hasDueDate, setHasDueDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      text: editText,
      tag: editTag.trim() || null,
      dueDate: (selectedItem.type === ItemType.TASK && hasDueDate) ? editDate.toISOString() : null
    };
    await DataService.updateItem(selectedItem.id, updates);
    setEditModalVisible(false);
    refreshAll(); // Оновлюємо глобально
  };

  const handleQuickAction = async (action) => {
    setActionsModalVisible(false);
    if (action === 'archive') {
      await DataService.archiveItem(selectedItem.id);
    } else if (action === 'restore') {
      await DataService.updateItem(selectedItem.id, { status: ItemStatus.ACTIVE });
    } else if (action === 'convert') {
      const newType = selectedItem.type === ItemType.TASK ? ItemType.IDEA : ItemType.TASK;
      await DataService.convertItem(selectedItem.id, newType, { dueDate: null });
    } else if (action === 'delete') { 
      setDeleteModalVisible(true); 
      return; 
    }
    refreshAll(); // Оновлюємо глобально для всіх вкладок
  };

  return (
    <View style={[styles.sceneContainer, { backgroundColor: colors.background }]}>
      <FlatList 
        data={data} 
        keyExtractor={item => item.id} 
        renderItem={({ item }) => (
          <LibraryItem 
            item={item} 
            type={routeKey} 
            colors={colors}
            onPressItem={openEdit} 
            onLongPressItem={(i) => {setSelectedItem(i); setActionsModalVisible(true);}} 
            onToggleComplete={async (i) => { 
              await DataService.updateItem(i.id, { isCompleted: !i.isCompleted }); 
              refreshAll(); 
            }} 
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyTitle, {color: colors.text}]}>Поки що порожньо</Text>
          </View>
        )}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : { paddingVertical: 12 }} 
      />

      {/* Редагування */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Редагувати</Text>
                <TextInput style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]} multiline value={editText} onChangeText={setEditText} />
                <TextInput style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, marginTop: 12, minHeight: 45 }]} placeholder="Тег" value={editTag} onChangeText={setEditTag} />
                
                {selectedItem?.type === ItemType.TASK && (
                  <View style={{marginTop: 16}}>
                    <TouchableOpacity style={[styles.dateToggle, { backgroundColor: colors.surfaceVariant }]} onPress={() => setHasDueDate(!hasDueDate)}>
                      <Text style={{color: colors.text}}>{hasDueDate ? `📅 ${editDate.toLocaleDateString()}` : "Без терміну"}</Text>
                      <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    {hasDueDate && <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{marginTop: 8}}><Text style={{color: colors.primary, textAlign: 'center'}}>Змінити дату</Text></TouchableOpacity>}
                  </View>
                )}

                {showDatePicker && <DateTimePicker value={editDate} mode="date" onChange={(e, d) => { setShowDatePicker(false); if(d) setEditDate(d); }} />}

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalBtn} onPress={() => setEditModalVisible(false)}><Text style={{ color: colors.primary }}>Скасувати</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleSaveEdit}><Text style={{ color: '#fff' }}>Зберегти</Text></TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Швидкі дії */}
      <Modal visible={actionsModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setActionsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalView, styles.bottomSheet, { backgroundColor: colors.card }]}>
                <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction(routeKey === 'archive' ? 'restore' : 'archive')}>
                  <Ionicons name={routeKey === 'archive' ? "refresh-outline" : "archive-outline"} size={22} color={colors.text} />
                  <Text style={[styles.menuText, { color: colors.text }]}>{routeKey === 'archive' ? 'Відновити' : 'В архів'}</Text>
                </TouchableOpacity>
                {routeKey !== 'archive' && (
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('convert')}>
                    <Ionicons name={selectedItem?.type === ItemType.TASK ? "bulb-outline" : "checkbox-outline"} size={22} color={colors.text} />
                    <Text style={[styles.menuText, { color: colors.text }]}>{selectedItem?.type === ItemType.TASK ? 'Зробити ідеєю' : 'Зробити справою'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('delete')}>
                  <Ionicons name="trash-outline" size={22} color={colors.error} />
                  <Text style={[styles.menuText, { color: colors.error }]}>Видалити назавжди</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Підтвердження видалення */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalView, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Видалити запис?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setDeleteModalVisible(false)}><Text style={{ color: colors.primary }}>Ні</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.error }]} onPress={async () => {
                  await DataService.deleteItem(selectedItem.id);
                  setDeleteModalVisible(false);
                  refreshAll();
                }}><Text style={{ color: '#fff' }}>Так, видалити</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default function MyLibraryScreen() {
  const layout = useWindowDimensions();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'tasks', title: 'Справи' }, 
    { key: 'ideas', title: 'Ідеї' }, 
    { key: 'archive', title: 'Архів' }
  ]);

  // Спільний стан для всіх вкладок
  const [allData, setAllData] = useState({ tasks: [], ideas: [], archive: [] });

  const loadAllData = useCallback(async () => {
    const t = await DataService.getTasks();
    const i = await DataService.getIdeas();
    const a = await DataService.getArchived();
    setAllData({ tasks: t, ideas: i, archive: a });
  }, []);

  // Оновлюємо при кожному вході на екран
  useFocusEffect(useCallback(() => { loadAllData(); }, [loadAllData]));

  const renderScene = ({ route }) => {
    return <LibraryTab 
      routeKey={route.key} 
      data={allData[route.key]} 
      refreshAll={loadAllData} 
    />;
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <TabBar 
          {...props} 
          indicatorStyle={{ backgroundColor: colors.primary, height: 3 }} 
          style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 0 }} 
          activeColor={colors.primary} 
          inactiveColor={colors.textSecondary} 
          labelStyle={{ fontWeight: '700', textTransform: 'none' }} 
        />
      )}
    />
  );
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  // ==========================================
  // LAYOUT & SCREENS
  // ==========================================
  sceneContainer: {
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

  // ==========================================
  // LIST ITEMS (TASKS/CARDS)
  // ==========================================
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },

  // --- Meta Info (Tags & Dates) ---
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
  },
  dateToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },

  // ==========================================
  // MODALS & OVERLAYS
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalView: {
    width: '85%',
    padding: 24,
    borderRadius: 28,
    elevation: 6, // Тінь для Android
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },

  // --- Bottom Sheet Specific ---
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

  // ==========================================
  // INPUTS & BUTTONS
  // ==========================================
  input: {
    minHeight: 80,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    marginLeft: 8,
  },

  // ==========================================
  // MENU ITEMS
  // ==========================================
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