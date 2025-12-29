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
  Alert,
  Modal,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ItemType } from '../constants/types';
import { useTheme } from '../context/ThemeContext';
import DataService from '../data/DataService';
import AdaptiveIcon from '../../assets/adaptive-icon.png';

export default function HomeScreen({ navigation }) {
  // СТЕЙТИ
  const [thought, setThought] = useState(''); // Поле вводу думки
  const [successModalVisible, setSuccessModalVisible] = useState(false); // Відображення модального вікна успіху
  const [actionMenuVisible, setActionMenuVisible] = useState(false); // Відображення меню дій для довгого натискання
  const { colors } = useTheme(); // Тема додатку

  // Завершальна дія після збереження думки
  const finishAction = () => {
    setThought(''); // Очищення поля вводу
    Keyboard.dismiss(); // Ховаємо клавіатуру
    setSuccessModalVisible(true); // Показуємо модальне вікно успіху
  };

  // Обробник для кнопки "Відпустити"
  const handleReleaseRaw = async () => {
    if (thought.trim().length === 0) return; // Ігноруємо порожні думки
    try {
      await DataService.addRawThought(thought.trim()); // Збереження сирої думки
      finishAction();
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося зберегти.");
    }
  };

  // Обробник для довгого натискання на кнопку "Відпустити"
  const handleLongPress = () => {
    if (thought.trim().length === 0) return;
    Keyboard.dismiss();
    setActionMenuVisible(true);
  };

  // Збереження думки як типізованого елемента
  const saveAsTyped = async (type) => {
    try {
      setActionMenuVisible(false);
      await DataService.addTypedItem(type, { text: thought.trim() });
      finishAction();
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося зберегти.");
    }
  };

  // ГОЛОВНИЙ РЕНДЕР
  return (
    // Зовнішній View з colors.background ПРИБИРАЄ спалахи та затемнення
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={styles.container}>
        
        {/* MODAL SUCCESS */}
        <Modal 
          animationType="fade" 
          transparent 
          visible={successModalVisible}
          onRequestClose={() => setSuccessModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setSuccessModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="checkmark" size={32} color={colors.primary} />
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Відпущено</Text>
                  <Text style={[styles.modalText, { color: colors.textSecondary }]}>Думку збережено. Розум вільний.</Text>
                  <TouchableOpacity 
                    style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]} 
                    onPress={() => setSuccessModalVisible(false)}
                  >
                    <Text style={styles.modalConfirmBtnText}>Зрозуміло</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* MODAL ACTION MENU */}
        <Modal 
          animationType="slide" 
          transparent 
          visible={actionMenuVisible}
          onRequestClose={() => setActionMenuVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setActionMenuVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalView, styles.bottomSheet, { backgroundColor: colors.card }]}>
                  <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                  <Text style={[styles.menuHeader, { color: colors.textSecondary }]}>Спеціальне збереження:</Text>
                  
                  <TouchableOpacity style={styles.menuItem} onPress={() => saveAsTyped(ItemType.TASK)}>
                    <Ionicons name="checkbox-outline" size={24} color={colors.primary} />
                    <Text style={[styles.menuText, { color: colors.text }]}>Перетворити на справу</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem} onPress={() => saveAsTyped(ItemType.IDEA)}>
                    <Ionicons name="bulb-outline" size={24} color={colors.primary} />
                    <Text style={[styles.menuText, { color: colors.text }]}>Зберегти як ідею</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.modalConfirmBtn, { marginTop: 20, backgroundColor: colors.surfaceVariant }]} 
                    onPress={() => setActionMenuVisible(false)}
                  >
                    <Text style={[styles.modalConfirmBtnText, { color: colors.primary }]}>Скасувати</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : null} 
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.contentContainer}>
              
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image source={AdaptiveIcon} style={styles.logoImage} resizeMode="contain" />
                  <Text style={[styles.appName, { color: colors.text }]}>MindFlow</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <Ionicons name="settings-outline" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.mainContent}>
                <ScrollView 
                  contentContainerStyle={styles.scrollContent} 
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={[styles.slogan, { color: colors.text }]}>Просто дихай</Text>
                  <Text style={[styles.subtext, { color: colors.textSecondary }]}>Ти не повинен все пам'ятати зараз</Text>

                  <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Що у вас на думці?"
                      placeholderTextColor={colors.outline}
                      multiline
                      value={thought}
                      onChangeText={setThought}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.releaseButton, { backgroundColor: colors.primary }]} 
                    onPress={handleReleaseRaw}
                    onLongPress={handleLongPress}
                    delayLongPress={400}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.releaseButtonText}>Відпустити</Text>
                  </TouchableOpacity>
                  <Text style={[styles.hintText, { color: colors.outline }]}>Затисніть для вибору куди зберегти</Text>
                </ScrollView>
              </View>

              <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('RawThoughts')}>
                  <Ionicons name="list-outline" size={24} color={colors.primary} />
                  <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Думки</Text>
                </TouchableOpacity>
                
                <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MyLibrary')}>
                  <Ionicons name="library-outline" size={24} color={colors.primary} />
                  <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Бібліотека</Text>
                </TouchableOpacity>

                <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Archive')}>
                  <Ionicons name="archive-outline" size={24} color={colors.primary} />
                  <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Архів</Text>
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// СТИЛІ
const styles = StyleSheet.create({
  // ==========================================
  // ОСНОВНІ КОНТЕЙНЕРИ (Layout)
  // ==========================================
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  // ==========================================
  // ВЕРХНЯ ПАНЕЛЬ (Header)
  // ==========================================
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 10,
  },

  // ==========================================
  // ГОЛОВНИЙ ТЕКСТ ТА ФОРМА (Main UI)
  // ==========================================
  slogan: {
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputWrapper: {
    width: '100%',
    height: 140,
    padding: 16,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 24,
  },
  input: {
    height: '100%',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  releaseButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 100,
    elevation: 2,
  },
  releaseButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    marginTop: 8,
  },

  // ==========================================
  // НИЖНЯ НАВІГАЦІЯ (Footer / Tab Bar)
  // ==========================================
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
  },
  navButtonText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: '60%',
  },

  // ==========================================
  // МОДАЛЬНІ ВІКНА ТА МЕНЮ (Overlays)
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
    alignItems: 'center',
    elevation: 5,
  },
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
    marginBottom: 20,
  },

  // --- Елементи всередині модалок ---
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalConfirmBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 100,
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },

  // --- Елементи меню ---
  menuHeader: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100, // Вище футера
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});