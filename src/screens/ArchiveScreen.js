// src/screens/ArchiveScreen.js
import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, TextInput, TouchableWithoutFeedback 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DataService from '../data/DataService';
import { ItemType, ItemStatus } from '../constants/types';
import { useTheme } from '../context/ThemeContext';

export default function ArchiveScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [editText, setEditText] = useState('');

  const loadArchive = async () => {
    const data = await DataService.getArchived();
    setItems(data);
  };

  useFocusEffect(useCallback(() => { loadArchive(); }, []));

  const handleQuickAction = async (action) => {
    setActionsModalVisible(false);
    if (action === 'restore') {
      await DataService.updateItem(selectedItem.id, { status: ItemStatus.ACTIVE });
    } else if (action === 'delete') {
      await DataService.deleteItem(selectedItem.id);
    }
    loadArchive();
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    await DataService.updateItem(selectedItem.id, { text: editText.trim() });
    setEditModalVisible(false);
    loadArchive();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => { setSelectedItem(item); setEditText(item.text); setEditModalVisible(true); }}
      onLongPress={() => { setSelectedItem(item); setActionsModalVisible(true); }}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.typeBadge}>
          <Ionicons 
            name={item.type === ItemType.TASK ? "checkbox-outline" : "bulb-outline"} 
            size={16} color={colors.primary} 
          />
          <Text style={[styles.typeText, { color: colors.primary }]}>
            {item.type === ItemType.TASK ? 'СПРАВА' : 'ІДЕЯ'}
          </Text>
        </View>
        {item.tag && (
          <View style={[styles.tagBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.tagText, { color: colors.primary }]}>#{item.tag}</Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.itemText, { color: colors.text }]}>{item.text}</Text>
      
      <View style={styles.itemFooter}>
         <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
           📦 Архівовано: {new Date(item.createdAt).toLocaleDateString()}
         </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="archive-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Архів порожній</Text>
          </View>
        )}
      />

      {/* МЕНЮ ДІЙ (Bottom Sheet) */}
      <Modal 
        visible={actionsModalVisible} 
        transparent 
        animationType="slide"
        onRequestClose={() => setActionsModalVisible(false)} // ЗАКРИТТЯ КНОПКОЮ НАЗАД
      >
        <TouchableWithoutFeedback onPress={() => setActionsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
                <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('restore')}>
                  <Ionicons name="refresh-outline" size={24} color={colors.text} />
                  <Text style={[styles.menuText, { color: colors.text }]}>Відновити з архіву</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => handleQuickAction('delete')}>
                  <Ionicons name="trash-outline" size={24} color={colors.error} />
                  <Text style={[styles.menuText, { color: colors.error }]}>Видалити назавжди</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* РЕДАГУВАННЯ */}
      <Modal 
        visible={editModalVisible} 
        transparent 
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)} // ЗАКРИТТЯ КНОПКОЮ НАЗАД
      >
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
                  <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalBtn}>
                    <Text style={{ color: colors.primary }}>Скасувати</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveEdit} style={[styles.modalBtn, { backgroundColor: colors.primary, borderRadius: 12 }]}>
                    <Text style={{ color: '#FFF' }}>Зберегти</Text>
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
  itemCard: { padding: 16, marginBottom: 12, borderRadius: 20, borderWidth: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '800', marginLeft: 6, letterSpacing: 0.5 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: '600' },
  itemText: { fontSize: 16, lineHeight: 24, marginBottom: 12 },
  itemFooter: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 8 },
  itemDate: { fontSize: 11, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, marginTop: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', padding: 24, borderRadius: 28, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 18, textAlign: 'center' },
  input: { minHeight: 120, padding: 16, borderRadius: 16, fontSize: 16, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 12, marginLeft: 10 },
  bottomSheet: { position: 'absolute', bottom: 0, width: '100%', padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40 },
  dragHandle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  menuText: { fontSize: 17, marginLeft: 16, fontWeight: '600' }
});