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
  Image // Додаємо компонент Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DataService from '../data/DataService';

// Імпортуємо адаптивну іконку
import AdaptiveIcon from '../../assets/adaptive-icon.png';

export default function HomeScreen({ navigation }) {
  const [thought, setThought] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleRelease = async () => {
    if (thought.trim().length === 0) return;

    try {
      await DataService.addRawThought(thought.trim());
      setThought('');
      Keyboard.dismiss();
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Помилка", "Не вдалося зберегти думку.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={32} color="#6750A4" />
            </View>
            <Text style={styles.modalTitle}>Відпущено</Text>
            <Text style={styles.modalText}>Думку збережено. Розум вільний.</Text>
            <TouchableOpacity style={styles.modalConfirmBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalConfirmBtnText}>Зрозуміло</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentContainer}>
            
            {/* === HEADER === */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                {/* Замінюємо Ionicons на Image */}
                <Image 
                  source={AdaptiveIcon} 
                  style={styles.logoImage} 
                  resizeMode="contain" 
                />
                <Text style={styles.appName}>MindFlow</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Ionicons name="settings-outline" size={28} color="#49454F" />
              </TouchableOpacity>
            </View>

            {/* === CENTRAL CONTENT === */}
            <View style={styles.mainContent}>
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
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

                <TouchableOpacity style={styles.releaseButton} onPress={handleRelease}>
                  <Text style={styles.releaseButtonText}>Відпустити</Text>
                  <Ionicons name="send" size={20} color="#FFF" style={{marginLeft: 8}} />
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* === FOOTER === */}
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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 15 
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32 }, // Стиль для логотипу
  appName: { fontSize: 22, fontWeight: '600', color: '#1C1B1F', marginLeft: 10 },
  mainContent: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 30,
    paddingVertical: 20
  },
  slogan: { fontSize: 32, fontWeight: '300', color: '#1C1B1F', marginBottom: 8, textAlign: 'center' },
  subtext: { fontSize: 16, color: '#49454F', marginBottom: 32, textAlign: 'center' },
  inputWrapper: {
    width: '100%',
    backgroundColor: '#ECE6F0',
    borderRadius: 28,
    padding: 16,
    height: 140, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#CAC4D0',
  },
  input: { fontSize: 16, color: '#1C1B1F', textAlignVertical: 'top', height: '100%' },
  releaseButton: { 
    backgroundColor: '#6750A4', 
    flexDirection: 'row', 
    paddingVertical: 16, 
    paddingHorizontal: 32, 
    borderRadius: 100, 
    alignItems: 'center', 
    elevation: 2 
  },
  releaseButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  footer: { 
    flexDirection: 'row', 
    backgroundColor: '#F7F2FA', 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#CAC4D0', 
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  navButton: { alignItems: 'center', padding: 8 },
  navButtonText: { fontSize: 12, color: '#49454F', marginTop: 4, fontWeight: '500' },
  verticalDivider: { width: 1, height: '60%', backgroundColor: '#CAC4D0' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '80%', backgroundColor: '#F7F2FA', borderRadius: 28, padding: 24, alignItems: 'center', elevation: 5 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EADDFF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 24, color: '#1C1B1F', marginBottom: 8 },
  modalText: { fontSize: 16, color: '#49454F', textAlign: 'center', marginBottom: 24 },
  modalConfirmBtn: { backgroundColor: '#6750A4', paddingVertical: 12, borderRadius: 100, width: '100%', alignItems: 'center' },
  modalConfirmBtnText: { color: '#FFF', fontWeight: '600' },
});