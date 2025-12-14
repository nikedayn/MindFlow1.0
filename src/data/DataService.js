// src/data/DataService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemType, ItemStatus } from '../constants/types';

const STORAGE_KEY = '@mindflow_data';

// Допоміжна функція для генерації унікального ID
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

class DataService {
  
  // === ОТРИМАННЯ ДАНИХ ===

  // Отримати всі дані (масив об'єктів)
  async getAllItems() {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("Помилка при зчитуванні даних:", e);
      return [];
    }
  }

  // Отримати "Сирі думки" (відсортовані: найновіші зверху)
  async getRawThoughts() {
    const allItems = await this.getAllItems();
    return allItems
      .filter(item => item.type === ItemType.RAW && item.status === ItemStatus.ACTIVE)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Отримати "Справи" (Tasks)
  async getTasks() {
    const allItems = await this.getAllItems();
    return allItems
      .filter(item => item.type === ItemType.TASK && item.status === ItemStatus.ACTIVE)
      // Можна додати сортування за датою виконання
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Отримати "Ідеї" (Ideas)
  async getIdeas() {
    const allItems = await this.getAllItems();
    return allItems
      .filter(item => item.type === ItemType.IDEA && item.status === ItemStatus.ACTIVE)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Отримати "Архів"
  async getArchived() {
    const allItems = await this.getAllItems();
    return allItems
      .filter(item => item.status === ItemStatus.ARCHIVED)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // === СТВОРЕННЯ ДАНИХ ===

  // Додати нову "Сиру думку"
  async addRawThought(text) {
    const newItem = {
      id: generateId(),
      text: text,
      type: ItemType.RAW,
      status: ItemStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      dueDate: null,
      isCompleted: false,
      tag: null,
    };
    await this._saveItem(newItem);
    return newItem;
  }

  // Перетворити думку на Справу або Ідею
  async convertItem(id, newType, updates = {}) {
    const allItems = await this.getAllItems();
    const updatedItems = allItems.map(item => {
      if (item.id === id) {
        return { 
          ...item, 
          type: newType, 
          status: ItemStatus.ACTIVE, // Повертаємо в активні, якщо була в архіві
          ...updates // Наприклад: { dueDate: '...', tag: '...' }
        };
      }
      return item;
    });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  }

  // === ОНОВЛЕННЯ ТА ВИДАЛЕННЯ ===

  // Оновити будь-які поля запису (наприклад, поставити галочку "виконано")
  async updateItem(id, updates) {
    const allItems = await this.getAllItems();
    const updatedItems = allItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  }

  // Архівувати запис
  async archiveItem(id) {
    await this.updateItem(id, { status: ItemStatus.ARCHIVED });
  }

  // Видалити запис назавжди
  async deleteItem(id) {
    const allItems = await this.getAllItems();
    const filteredItems = allItems.filter(item => item.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredItems));
  }

  // === СЛУЖБОВІ ФУНКЦІЇ (ДЛЯ Settings) ===

  // Видалити ВСІ дані
  async clearAllData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch(e) {
      console.error("Помилка при очищенні даних:", e);
    }
  }

  // Імпорт даних (перезаписує поточні)
  async importData(jsonData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, jsonData);
    } catch(e) {
      console.error("Помилка при імпорті:", e);
    }
  }

  // === ВНУТРІШНЯ ФУНКЦІЯ ===
  async _saveItem(newItem) {
    const currentItems = await this.getAllItems();
    const updatedItems = [newItem, ...currentItems]; // Додаємо новий елемент на початок
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
  }
}

export default new DataService();