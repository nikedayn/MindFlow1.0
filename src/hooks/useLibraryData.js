// src/hooks/useLibraryData.js
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import DataService from '../data/DataService';

export const useLibraryData = (searchQuery) => {
  const [allData, setAllData] = useState({ tasks: [], ideas: [] });

  const loadAllData = useCallback(async () => {
    const [t, i] = await Promise.all([
      DataService.getTasks(),
      DataService.getIdeas()
    ]);
    setAllData({ tasks: t, ideas: i });
  }, []);

  useFocusEffect(useCallback(() => { loadAllData(); }, [loadAllData]));

  const getFilteredData = useCallback((type) => {
    const data = allData[type] || [];
    if (!searchQuery) return data;
    
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(item => 
      item.text.toLowerCase().includes(lowerQuery) || 
      item.tag?.toLowerCase().includes(lowerQuery)
    );
  }, [allData, searchQuery]);

  return { getFilteredData, refreshAll: loadAllData };
};