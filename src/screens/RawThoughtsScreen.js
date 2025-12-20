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
  Animated,
  TouchableWithoutFeedback
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import DataService from '../data/DataService';
import { ItemType } from '../constants/types';
import { useTheme } from '../context/ThemeContext'; // Імпорт теми

// ... (formatDateHeader та groupThoughtsByDate залишаються без змін)
const formatDateHeader = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const options = { month: 'long', day: 'numeric' };
  return date.toLocaleDateString('uk-UA', options);
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

export default function RawThoughtsScreen() {
  const { colors, isDark } = useTheme();
  const [thoughts, setThoughts] = useState([]);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [targetType, setTargetType] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTag, setEditTag] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [hasDueDate, setHasDueDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    const rawData = await DataService.getRawThoughts();
    setThoughts(groupThoughtsByDate(rawData));
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={80} color={colors.border} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Поки що тут нічого немає</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Ваші миттєві думки з'являться тут після того, як ви відпустите їх на головному екрані.
      </Text>
    </View>
  );

  const ThoughtItem = ({ item, onSwipeLeft, onSwipeRight }) => {
    return (
      <Swipeable 
        renderRightActions={() => (
            <View style={styles.rightActions}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FFB870'}]} onPress={() => onSwipeRight('archive', item)}>
                    <Ionicons name="archive-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: colors.error}]} onPress={() => onSwipeRight('delete', item)}>
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
        )}
        renderLeftActions={() => (
            <View style={styles.leftActions}>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#D0BCFF'}]} onPress={() => onSwipeLeft('idea', item)}>
                    <Ionicons name="bulb-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#B4E09E'}]} onPress={() => onSwipeLeft('task', item)}>
                    <Ionicons name="checkbox-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
        )}
      >
        <View style={[styles.itemContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.itemText, { color: colors.text }]}>{item.text}</Text>
          <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
            {new Date(item.createdAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={thoughts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyComponent}
        renderItem={({ item }) => item.isHeader ? 
          <View style={styles.headerGap}><Text style={[styles.dateHeaderText, {color: colors.primary}]}>{formatDateHeader(item.date)}</Text></View> : 
          <ThoughtItem item={item} onSwipeRight={(a, i) => { setSelectedItem(i); a === 'archive' ? DataService.archiveItem(i.id).then(loadData) : setDeleteModalVisible(true); }} 
                       onSwipeLeft={(t, i) => { setSelectedItem(i); setTargetType(t); setEditText(i.text); setConvertModalVisible(true); }} />
        }
        contentContainerStyle={thoughts.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
      />

      {/* MODAL CONVERT & DELETE (кольори адаптовані як у Settings) */}
      <Modal visible={convertModalVisible} transparent animationType="slide">
          <TouchableWithoutFeedback onPress={() => setConvertModalVisible(false)}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalView, {backgroundColor: colors.card, width: '100%', position: 'absolute', bottom: 0, borderRadius: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28}]}>
                    <Text style={[styles.modalTitle, {color: colors.text}]}>{targetType === 'task' ? 'Нова справа' : 'Нова ідея'}</Text>
                    <TextInput style={[styles.input, {backgroundColor: colors.surfaceVariant, color: colors.text}]} multiline value={editText} onChangeText={setEditText} />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.modalBtn} onPress={() => setConvertModalVisible(false)}><Text style={{color: colors.primary}}>Скасувати</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.modalBtn, {backgroundColor: colors.primary}]} onPress={async () => { await DataService.convertItem(selectedItem.id, targetType === 'task' ? ItemType.TASK : ItemType.IDEA, {text: editText}); setConvertModalVisible(false); loadData(); }}><Text style={{color: '#fff'}}>Зберегти</Text></TouchableOpacity>
                    </View>
                </View>
            </View>
          </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGap: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  dateHeaderText: { fontSize: 14, fontWeight: '700' },
  itemContainer: { marginHorizontal: 16, marginVertical: 4, padding: 16, borderRadius: 16, borderWidth: 1 },
  itemText: { fontSize: 16, lineHeight: 24 },
  itemDate: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 20, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  rightActions: { flexDirection: 'row', width: 120, paddingVertical: 4, paddingRight: 16 },
  leftActions: { flexDirection: 'row', width: 120, paddingVertical: 4, paddingLeft: 16 },
  actionBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 16, marginHorizontal: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalView: { padding: 24, elevation: 5 },
  modalTitle: { fontSize: 22, fontWeight: '600', marginBottom: 16 },
  input: { borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  modalBtn: { padding: 12, borderRadius: 100, marginLeft: 8, paddingHorizontal: 20 }
});