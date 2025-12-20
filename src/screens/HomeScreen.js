// src/screens/HomeScreen.js
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
import DataService from '../data/DataService';
import { ItemType } from '../constants/types';
import { useTheme } from '../context/ThemeContext'; // Використання контексту теми

import AdaptiveIcon from '../../assets/adaptive-icon.png';

export default function HomeScreen({ navigation }) {
  const [thought, setThought] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const { colors } = useTheme(); // Отримуємо динамічні кольори теми

  const finishAction = () => {
    setThought('');
    Keyboard.dismiss();
    setSuccessModalVisible(true);
  };

  // 1. Коротке натискання — зберігає у "Миттєві думки"
  const handleReleaseRaw = async () => {
    if (thought.trim().length === 0) return;
    try {
      await DataService.addRawThought(thought.trim());
      finishAction();
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося зберегти.");
    }
  };

  // 2. Довге натискання — відкриває меню вибору
  const handleLongPress = () => {
    if (thought.trim().length === 0) return;
    Keyboard.dismiss();
    setActionMenuVisible(true);
  };

  const saveAsTyped = async (type) => {
    try {
      setActionMenuVisible(false);
      await DataService.addTypedItem(type, { text: thought.trim() });
      finishAction();
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося зберегти.");
    }
  };

  return (
    // Базовий View з фоном теми для усунення білих спалахів
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={styles.container}>
        
        {/* МОДАЛ УСПІХУ (Закривається жестом Назад) */}
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

        {/* МЕНЮ ВИБОРУ (Long Press) - Закривається жестом Назад або тапом по фону */}
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

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : null} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.contentContainer}>
              
              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image source={AdaptiveIcon} style={styles.logoImage} resizeMode="contain" />
                  <Text style={[styles.appName, { color: colors.text }]}>MindFlow</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <Ionicons name="settings-outline" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* MAIN CONTENT */}
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

              {/* FOOTER */}
              <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('RawThoughts')}>
                  <Ionicons name="list-outline" size={24} color={colors.primary} />
                  <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Миттєві думки</Text>
                </TouchableOpacity>
                <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MyLibrary')}>
                  <Ionicons name="library-outline" size={24} color={colors.primary} />
                  <Text style={[styles.navButtonText, { color: colors.textSecondary }]}>Моя бібліотека</Text>
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32 },
  appName: { fontSize: 22, fontWeight: '600', marginLeft: 10 },
  mainContent: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 20 },
  slogan: { fontSize: 32, fontWeight: '300', marginBottom: 8, textAlign: 'center' },
  subtext: { fontSize: 16, marginBottom: 32, textAlign: 'center' },
  inputWrapper: { width: '100%', borderRadius: 28, padding: 16, height: 140, marginBottom: 24, borderWidth: 1 },
  input: { fontSize: 16, textAlignVertical: 'top', height: '100%' },
  releaseButton: { paddingVertical: 16, paddingHorizontal: 48, borderRadius: 100, elevation: 2 },
  releaseButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  hintText: { fontSize: 12, marginTop: 8 },
  footer: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, justifyContent: 'space-around', alignItems: 'center' },
  navButton: { alignItems: 'center', padding: 8 },
  navButtonText: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  verticalDivider: { width: 1, height: '60%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', borderRadius: 28, padding: 24, alignItems: 'center', elevation: 5 },
  bottomSheet: { width: '100%', position: 'absolute', bottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  menuHeader: { fontSize: 14, fontWeight: '600', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 15 },
  menuText: { fontSize: 16, marginLeft: 15, fontWeight: '500' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, marginBottom: 8, fontWeight: '500' },
  modalText: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  modalConfirmBtn: { paddingVertical: 12, borderRadius: 100, width: '100%', alignItems: 'center' },
  modalConfirmBtnText: { color: '#FFF', fontWeight: '600' },
});