// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Стандартні іконки Expo
import DataService from '../data/DataService';

export default function HomeScreen({ navigation }) {
  const [thought, setThought] = useState('');

  // Обробка натискання кнопки "Відпусти"
  const handleRelease = async () => {
    if (thought.trim().length === 0) {
      return; 
    }

    try {
      // Виклик методу збереження
      await DataService.addRawThought(thought.trim());
      
      // Логування для перевірки (можна видалити пізніше)
      console.log('Думка збережена в БД');

      setThought('');
      Alert.alert("Успіх", "Думку відпущено в потік!"); 
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося зберегти думку.");
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.contentContainer}
      >
        
        {/* === HEADER === */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="water-outline" size={28} color="#4A90E2" />
            <Text style={styles.appName}>MindFlow</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* === CENTRAL CONTENT === */}
        <View style={styles.mainContent}>
          <Text style={styles.slogan}>Просто дихай</Text>
          <Text style={styles.subtext}>Ти не повинен все пам'ятати зараз</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Що в тебе на думці?"
              placeholderTextColor="#999"
              multiline
              value={thought}
              onChangeText={setThought}
            />
          </View>

          <TouchableOpacity style={styles.releaseButton} onPress={handleRelease}>
            <Text style={styles.releaseButtonText}>Відпусти</Text>
          </TouchableOpacity>
        </View>

        {/* === FOOTER NAVIGATION === */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigation.navigate('RawThoughts')}
          >
            <Ionicons name="list-outline" size={24} color="#4A90E2" />
            <Text style={styles.navButtonText}>Сирі думки</Text>
          </TouchableOpacity>

          <View style={styles.verticalDivider} />

          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigation.navigate('MyLibrary')}
          >
            <Ionicons name="library-outline" size={24} color="#4A90E2" />
            <Text style={styles.navButtonText}>Моя бібліотека</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Світлий, спокійний фон
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  // Main Content Styles
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  slogan: {
    fontSize: 32,
    fontWeight: '300', // Тонкий шрифт для "легкості"
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    fontSize: 18,
    minHeight: 120,
    textAlignVertical: 'top', // Для Android, щоб текст починався зверху
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // Тінь для Android
  },
  releaseButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  releaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Footer Styles
  footer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  navButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  verticalDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E0E0E0',
  },
});