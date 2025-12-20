// src/data/DataService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ItemType, ItemStatus } from '../constants/types';

const STORAGE_KEY = '@mindflow_items'; 

// Допоміжна функція для генерації унікального ID
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

class DataService {
    // Внутрішня функція для отримання всіх елементів
    async getAllItems() {
        try {
            const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch(e) {
            console.error("Помилка читання даних: ", e);
            return [];
        }
    }

    // === ОТРИМАННЯ ДАНИХ ===

    async getRawThoughts() {
        const allItems = await this.getAllItems();
        return allItems.filter(item => item.type === ItemType.RAW && item.status === ItemStatus.ACTIVE);
    }

    async getTasks() {
        const allItems = await this.getAllItems();
        return allItems.filter(item => item.type === ItemType.TASK && item.status === ItemStatus.ACTIVE)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }

    async getIdeas() {
        const allItems = await this.getAllItems();
        return allItems.filter(item => item.type === ItemType.IDEA && item.status === ItemStatus.ACTIVE)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    async getArchived() {
        const allItems = await this.getAllItems();
        return allItems.filter(item => item.status === ItemStatus.ARCHIVED)
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

    // === СТВОРЕННЯ ДАНИХ (для прямого додавання Справи/Ідеї) ===
    async addTypedItem(type, updates = {}) {
        const newItem = {
            id: generateId(),
            type: type, // ItemType.TASK або ItemType.IDEA
            status: ItemStatus.ACTIVE,
            createdAt: new Date().toISOString(),
            // Використовуємо дані з updates, або значення за замовчуванням
            dueDate: updates.dueDate || null, 
            isCompleted: updates.isCompleted || false,
            tag: updates.tag || null,
            text: updates.text || '',
        };
        await this._saveItem(newItem);
        return newItem;
    }
    // === КІНЕЦЬ СТВОРЕННЯ ДАНИХ ===

    // === ОНОВЛЕННЯ ТА ВИДАЛЕННЯ ===

    async updateItem(id, updates) {
        const allItems = await this.getAllItems();
        const updatedItems = allItems.map(item => {
            if (item.id === id) {
                return { ...item, ...updates };
            }
            return item;
        });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
    }

    async archiveItem(id) {
        await this.updateItem(id, { status: ItemStatus.ARCHIVED });
    }

    async deleteItem(id) {
        const allItems = await this.getAllItems();
        const updatedItems = allItems.filter(item => item.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
    }

    // === СЛУЖБОВІ ФУНКЦІЇ (ДЛЯ Settings) ===

    async clearAllData() {
        await AsyncStorage.removeItem(STORAGE_KEY);
    }

    async importData(dataString) {
        try {
            const data = JSON.parse(dataString);
            if (Array.isArray(data)) {
                await AsyncStorage.setItem(STORAGE_KEY, dataString);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Помилка імпорту даних: ", e);
            return false;
        }
    }

    async exportData() {
        return await AsyncStorage.getItem(STORAGE_KEY);
    }

    // === ВНУТРІШНЯ ФУНКЦІЯ ===
    async _saveItem(newItem) {
        const currentItems = await this.getAllItems();
        const updatedItems = [newItem, ...currentItems]; // Додаємо новий елемент на початок
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
    }
}

export default new DataService();