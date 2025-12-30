// src/screens/ArchiveScreen.js
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, 
  TextInput, TouchableWithoutFeedback, Keyboard, ScrollView 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import DataService from '../data/DataService';
import { ItemType, ItemStatus } from '../constants/types';
import { useTheme } from '../context/ThemeContext';

export default function ArchiveScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTag, setEditTag] = useState('');

  // 1. ПОШУК У HEADER (Зліва)
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        isSearchActive ? (
          <TextInput
            style={[styles.headerSearchInput, { color: colors.text }]}
            placeholder="Пошук..."
            placeholderTextColor={colors.outline}
            autoFocus
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        ) : <Text style={[styles.headerTitleText, { color: colors.text }]}>Архів</Text>
      ),
      headerRight: () => (
        isSearchActive && (
          <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} style={{ marginRight: 15 }}>
            <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )
      )
    });
  }, [isSearchActive, searchQuery, colors]);

  const loadData = async () => {
    const data = await DataService.getArchived();
    setItems(data);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const typeMatch = filterType === 'ALL' || item.type === filterType;
      const searchLower = searchQuery.toLowerCase();
      const textMatch = item.text.toLowerCase().includes(searchLower);
      const tagMatch = item.tag ? item.tag.toLowerCase().includes(searchLower) : false;
      return typeMatch && (textMatch || tagMatch);
    });
  }, [items, searchQuery, filterType]);

  const handleSaveEdit = async () => {
    await DataService.updateItem(selectedItem.id, { text: editText.trim(), tag: editTag.trim() || null });
    setEditModalVisible(false);
    loadData();
  };

  const handleAction = async (action) => {
    setActionsModalVisible(false);
    if (action === 'restore') {
      await DataService.updateItem(selectedItem.id, { status: ItemStatus.ACTIVE });
    } else if (action === 'delete') {
      await DataService.deleteItem(selectedItem.id);
    }
    loadData();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => { 
                setSelectedItem(item); 
                setEditText(item.text); 
                setEditTag(item.tag || '');
                setEditModalVisible(true); 
            }}
            onLongPress={() => { setSelectedItem(item); setActionsModalVisible(true); }}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              <View style={[styles.typeBadge, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name={item.type === ItemType.TASK ? "checkbox-outline" : "bulb-outline"} size={14} color={colors.primary} />
                <Text style={[styles.typeText, { color: colors.primary }]}>{item.type === ItemType.TASK ? 'СПРАВА' : 'ІДЕЯ'}</Text>
              </View>
              {item.tag && (
                <View style={[styles.tagBadge, { backgroundColor: colors.surfaceVariant }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{item.tag}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.itemText, { color: colors.text }]}>{item.text}</Text>
            <Text style={[styles.itemDate, { color: colors.textSecondary }]}>🕒 {new Date(item.createdAt).toLocaleDateString('uk-UA')}</Text>
          </TouchableOpacity>
        )}
      />

      {/* FAB: Клік - Пошук, Затискання - Фільтр */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setIsSearchActive(!isSearchActive)}
        onLongPress={() => setFilterModalVisible(true)}
        delayLongPress={400}
      >
        <Ionicons name={isSearchActive ? "search" : "options-outline"} size={28} color="#FFF" />
      </TouchableOpacity>

      {/* МОДАЛКА РЕДАГУВАННЯ */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Редагувати</Text>
                <TextInput style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text }]} multiline value={editText} onChangeText={setEditText} autoFocus />
                <TextInput style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.text, marginTop: 10, minHeight: 45 }]} placeholder="Тег" value={editTag} onChangeText={setEditTag} />
                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalBtn}><Text style={{ color: colors.primary }}>Скасувати</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveEdit} style={[styles.modalBtn, { backgroundColor: colors.primary, borderRadius: 12 }]}><Text style={{ color: '#fff' }}>Зберегти</Text></TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* МЕНЮ ДІЙ (Bottom Sheet) */}
      <Modal visible={actionsModalVisible} transparent animationType="slide" onRequestClose={() => setActionsModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setActionsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('restore')}>
                <Ionicons name="refresh-outline" size={24} color={colors.text} />
                <Text style={[styles.menuText, { color: colors.text }]}>Відновити запис</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => handleAction('delete')}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
                <Text style={[styles.menuText, { color: colors.error }]}>Видалити назавжди</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ФІЛЬТР ПО ТИПУ */}
      <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 20 }]}>Показувати в архіві:</Text>
              {[{l: 'Всі', v: 'ALL'}, {l: 'Справи', v: 'task'}, {l: 'Ідеї', v: 'idea'}].map((f) => (
                <TouchableOpacity key={f.v} style={styles.menuItem} onPress={() => { setFilterType(f.v); setFilterModalVisible(false); }}>
                  <Ionicons name={filterType === f.v ? "radio-button-on" : "radio-button-off"} size={22} color={colors.primary} />
                  <Text style={[styles.menuText, { color: colors.text }]}>{f.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSearchInput: { fontSize: 18, width: '100%', marginLeft: -10 },
  headerTitleText: { fontSize: 20, fontWeight: 'bold' },
  itemCard: { padding: 16, marginBottom: 12, marginHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '600' },
  itemText: { fontSize: 16, lineHeight: 24, marginBottom: 8 },
  itemDate: { fontSize: 11 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10, zIndex: 99 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', padding: 24, borderRadius: 28 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  input: { minHeight: 100, padding: 12, borderRadius: 12, textAlignVertical: 'top', fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, marginLeft: 10 },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  dragHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  menuText: { fontSize: 16, marginLeft: 15, fontWeight: '500' }
});