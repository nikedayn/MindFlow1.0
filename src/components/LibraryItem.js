// src/components/LibraryItem.js
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const LibraryItem = React.memo(({ item, type, onToggleComplete, onPressItem, onLongPressItem, colors }) => {
  const handleQuickAction = async (action) => {
    setActionsModalVisible(false);
    if (action === 'archive') {
      await DataService.archiveItem(selectedItem.id);
    } else if (action === 'delete') { 
      setDeleteModalVisible(true); 
      return; 
    } else if (action === 'convert') {
      // Визначаємо новий тип залежно від поточного
      const newType = selectedItem.type === ItemType.TASK ? ItemType.IDEA : ItemType.TASK;
      // При перетворенні на ідею зазвичай скидають дату (dueDate)
      await DataService.convertItem(selectedItem.id, newType, { dueDate: null });
    }
    refreshAll();
  };
  return (
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
});

const styles = StyleSheet.create({
  itemContainer: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, 
    marginHorizontal: 16, marginVertical: 4, borderRadius: 16, borderWidth: 1 
  },
  checkboxContainer: { marginRight: 12 },
  textContainer: { flex: 1 },
  itemText: { fontSize: 16, lineHeight: 22 },
  completedText: { textDecorationLine: 'line-through', opacity: 0.5 },
  metaContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 8 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginRight: 12 },
  tagText: { fontSize: 12, fontWeight: '600' },
  dateText: { fontSize: 12 },
});