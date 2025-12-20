// src/screens/MyLibraryScreen.js
import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TabView, TabBar } from 'react-native-tab-view';
import DataService from '../data/DataService';
import { useTheme } from '../context/ThemeContext';

const LibraryTab = ({ routeKey, refreshCounter, onDataChange }) => {
  const { colors } = useTheme();
  const [data, setData] = useState([]);

  const loadData = useCallback(async () => {
    let result = [];
    if (routeKey === 'tasks') result = await DataService.getTasks();
    else if (routeKey === 'ideas') result = await DataService.getIdeas();
    else if (routeKey === 'archive') result = await DataService.getArchived();
    setData(result);
  }, [routeKey]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const renderEmpty = () => {
    const config = {
        tasks: { icon: 'checkbox-outline', title: 'Немає справ', sub: 'Ваші завдання з’являться тут.' },
        ideas: { icon: 'bulb-outline', title: 'Жодної ідеї', sub: 'Зберігайте сюди все, що надихає.' },
        archive: { icon: 'archive-outline', title: 'Архів порожній', sub: 'Тут будуть заархівовані думки.' }
    }[routeKey];

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name={config.icon} size={80} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{config.title}</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{config.sub}</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : { padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, {backgroundColor: colors.surface, borderColor: colors.border}]}>
            <View style={{flex: 1}}>
                <Text style={[styles.itemText, {color: colors.text}, item.isCompleted && {textDecorationLine: 'line-through', opacity: 0.5}]}>{item.text}</Text>
                {item.tag && <Text style={{color: colors.primary, fontSize: 12, marginTop: 4}}>#{item.tag}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        )}
      />
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
    { key: 'archive', title: 'Архів' },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      renderTabBar={props => (
        <TabBar
          {...props}
          indicatorStyle={{ backgroundColor: colors.primary, height: 3 }}
          style={{ backgroundColor: colors.background, elevation: 0, borderBottomWidth: 1, borderBottomColor: colors.border }}
          activeColor={colors.primary}
          inactiveColor={colors.textSecondary}
          labelStyle={{ fontWeight: '700', textTransform: 'none' }}
        />
      )}
      renderScene={({ route }) => <LibraryTab routeKey={route.key} />}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  item: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  itemText: { fontSize: 16 }
});