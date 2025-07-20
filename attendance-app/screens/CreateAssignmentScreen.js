import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS } from '../styles/theme';

export default function CreateAssignmentScreen({ route, navigation }) {
  const { username, namaLengkap } = route.params;

  // State untuk form
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [details, setDetails] = useState('');
  const [link, setLink] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  
  // State untuk date/time picker
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || deadline;
    setShowPicker(Platform.OS === 'ios');
    setDeadline(currentDate);
  };

  const showMode = (currentMode) => {
    setShowPicker(true);
    setPickerMode(currentMode);
  };

  const handleSaveAssignment = async () => {
    if (!selectedClass || !selectedCourse || !details) {
      Alert.alert('Input Tidak Lengkap', 'Harap isi semua field yang wajib diisi (Class, Course, dan Detail).');
      return;
    }
    
    try {
      await addDoc(collection(db, "assignments"), {
        creatorId: username,
        className: selectedClass,
        courseName: selectedCourse,
        details: details,
        link: link || '',
        deadline: Timestamp.fromDate(deadline),
        createdAt: Timestamp.now()
      });
      Alert.alert('Sukses', 'Assignment berhasil dibuat.');
      navigation.goBack(); 
    } catch (error) {
      console.error("Error creating assignment: ", error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan assignment.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignment</Text>
        <TouchableOpacity onPress={handleSaveAssignment}>
          <Icon name="check-square" size={26} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{namaLengkap}</Text>
        </View>
        <Text style={styles.formTitle}>CREATE ASSIGNMENT</Text>
        <Text style={styles.label}>Class</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedClass}
            onValueChange={(itemValue) => setSelectedClass(itemValue)}
          >
            <Picker.Item label="-- Pilih Kelas --" value="" />
            <Picker.Item label="TI-23-KA" value="TI-23-KA" />
            <Picker.Item label="TI-23-PA" value="TI-23-PA" />
          </Picker>
        </View>
        <Text style={styles.label}>Course</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCourse}
            onValueChange={(itemValue) => setSelectedCourse(itemValue)}
          >
            <Picker.Item label="-- Pilih Mata Kuliah --" value="" />
            <Picker.Item label="Pemrograman Perangkat Bergerak" value="Pemrograman Perangkat Bergerak" />
            <Picker.Item label="Pengolahan Citra" value="Pengolahan Citra" />
          </Picker>
        </View>
        <Text style={styles.label}>Assignment detail *</Text>
        <TextInput
          style={styles.inputMultiline}
          placeholder="Input assignment detail"
          multiline
          numberOfLines={4}
          value={details}
          onChangeText={setDetails}
        />
        <Text style={styles.label}>Assignment link</Text>
        <TextInput
          style={styles.input}
          placeholder="Input assignment link"
          value={link}
          onChangeText={setLink}
        />
        <Text style={styles.label}>Deadline</Text>
        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => showMode('date')} style={styles.datePickerButton}>
            <Icon name="calendar" size={20} color="#555" />
            <Text style={styles.datePickerText}>{deadline.toLocaleDateString('id-ID')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showMode('time')} style={styles.datePickerButton}>
            <Icon name="clock" size={20} color="#555" />
            <Text style={styles.datePickerText}>{deadline.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={deadline}
            mode={pickerMode}
            is24Hour={true}
            display="default"
            onChange={handleDateChange}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#8300EF', padding: 20, paddingTop: 50 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    scrollContainer: { padding: 20 },
    userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    userRole: { fontSize: 16, color: '#666' },
    formTitle: { fontSize: 20, fontWeight: 'bold', color: '#8300EF', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
    label: { fontSize: 16, color: '#555', marginBottom: 8, fontWeight: '500' },
    pickerContainer: { backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginBottom: 15 },
    input: { backgroundColor: 'white', borderRadius: 10, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd', marginBottom: 15 },
    inputMultiline: { height: 100, textAlignVertical: 'top', backgroundColor: 'white', borderRadius: 10, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd', marginBottom: 15 },
    dateContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', width: '48%' },
    datePickerText: { marginLeft: 10, fontSize: 16, color: '#333' },
});
