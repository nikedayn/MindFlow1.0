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

import AdaptiveIcon from '../../assets/adaptive-icon.png';

export default function HomeScreen({ navigation }) {
  const [thought, setThought] = useState('');
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);

  // Функція для завершення дії
  const finishAction = () => {
    setThought('');
    Keyboard.dismiss();
    setSuccessModalVisible(true);
  };

  // 1. Коротке натискання - у "Сирі думки"
  const handleReleaseRaw = async () => {
    if (thought.trim().length === 0) return;
    try {
      await DataService.addRawThought(thought.trim());
      finishAction();
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося зберегти.");
    }
  };

  // 2. Довге натискання - меню вибору
  const handleLongPress = () => {
    if (thought.trim().length === 0) return;
    Keyboard.dismiss();
    setActionMenuVisible(true);
  };

  // Збереження як Справа або Ідея
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
              <View style={styles.modalView}>
                <View style={styles.iconCircle}>
                  <Ionicons name="checkmark" size={32} color="#6750A4" />
                </View>
                <Text style={styles.modalTitle}>Відпущено</Text>
                <Text style={styles.modalText}>Думку збережено. Розум вільний.</Text>
                <TouchableOpacity 
                  style={styles.modalConfirmBtn} 
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
              <View style={[styles.modalView, styles.bottomSheet]}>
                <View style={styles.dragHandle} />
                <Text style={styles.menuHeader}>Спеціальне збереження:</Text>
                
                <TouchableOpacity style={styles.menuItem} onPress={() => saveAsTyped(ItemType.TASK)}>
                  <Ionicons name="checkbox-outline" size={24} color="#6750A4" />
                  <Text style={styles.menuText}>Перетворити на справу</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => saveAsTyped(ItemType.IDEA)}>
                  <Ionicons name="bulb-outline" size={24} color="#6750A4" />
                  <Text style={styles.menuText}>Зберегти як ідею</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalConfirmBtn, {marginTop: 20, backgroundColor: '#ECE6F0'}]} 
                  onPress={() => setActionMenuVisible(false)}
                >
                  <Text style={[styles.modalConfirmBtnText, {color: '#6750A4'}]}>Скасувати</Text>
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
                <Text style={styles.appName}>MindFlow</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={28} color="#49454F" />
              </TouchableOpacity>
            </View>

            {/* MAIN CONTENT */}
            <View style={styles.mainContent}>
              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.slogan}>Просто дихай</Text>
                <Text style={styles.subtext}>Ти не повинен все пам'ятати зараз</Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Що у вас на думці?"
                    placeholderTextColor="#938F99"
                    multiline
                    value={thought}
                    onChangeText={setThought}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.releaseButton} 
                  onPress={handleReleaseRaw}
                  onLongPress={handleLongPress}
                  delayLongPress={400}
                  activeOpacity={0.7}
                >
                  <Text style={styles.releaseButtonText}>Відпустити</Text>
                </TouchableOpacity>
                <Text style={styles.hintText}>Затисніть для вибору куди зберегти</Text>
              </ScrollView>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('RawThoughts')}>
                <Ionicons name="list-outline" size={24} color="#6750A4" />
                <Text style={styles.navButtonText}>Сирі думки</Text>
              </TouchableOpacity>
              <View style={styles.verticalDivider} />
              <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MyLibrary')}>
                <Ionicons name="library-outline" size={24} color="#6750A4" />
                <Text style={styles.navButtonText}>Моя бібліотека</Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEF7FF' },
  contentContainer: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 15 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32 },
  appName: { fontSize: 22, fontWeight: '600', color: '#1C1B1F', marginLeft: 10 },
  mainContent: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  slogan: { fontSize: 32, fontWeight: '300', color: '#1C1B1F', marginBottom: 8, textAlign: 'center' },
  subtext: { fontSize: 16, color: '#49454F', marginBottom: 32, textAlign: 'center' },
  inputWrapper: { width: '100%', backgroundColor: '#ECE6F0', borderRadius: 28, padding: 16, height: 140, marginBottom: 24, borderWidth: 1, borderColor: '#CAC4D0' },
  input: { fontSize: 16, color: '#1C1B1F', textAlignVertical: 'top', height: '100%' },
  releaseButton: { backgroundColor: '#6750A4', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 100, elevation: 2 },
  releaseButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  hintText: { fontSize: 12, color: '#938F99', marginTop: 8 },
  footer: { flexDirection: 'row', backgroundColor: '#F7F2FA', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#CAC4D0', justifyContent: 'space-around', alignItems: 'center' },
  navButton: { alignItems: 'center', padding: 8 },
  navButtonText: { fontSize: 12, color: '#49454F', marginTop: 4, fontWeight: '500' },
  verticalDivider: { width: 1, height: '60%', backgroundColor: '#CAC4D0' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', backgroundColor: '#F7F2FA', borderRadius: 28, padding: 24, alignItems: 'center', elevation: 5 },
  bottomSheet: { width: '100%', position: 'absolute', bottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#CAC4D0', borderRadius: 2, marginBottom: 20 },
  menuHeader: { fontSize: 16, fontWeight: '600', color: '#49454F', marginBottom: 15 },
  menuItem: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ECE6F0' },
  menuText: { fontSize: 16, color: '#1C1B1F', marginLeft: 15 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EADDFF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, color: '#1C1B1F', marginBottom: 8 },
  modalText: { fontSize: 16, color: '#49454F', textAlign: 'center', marginBottom: 24 },
  modalConfirmBtn: { backgroundColor: '#6750A4', paddingVertical: 12, borderRadius: 100, width: '100%', alignItems: 'center' },
  modalConfirmBtnText: { color: '#FFF', fontWeight: '600' },
});