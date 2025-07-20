import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';

export default function SpecialAttendanceScreen({ route, navigation }) {
  const { username, namaLengkap } = route.params;

  const [allCourses, setAllCourses] = useState([]); 
  const [filteredCourses, setFilteredCourses] = useState([]); 
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(''); // 'izin' atau 'sakit'
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const availableClasses = ["TI-23-KA", "TI-23-PA"];
  const fetchDosenCourses = async () => {
    try {
      const q = query(collection(db, "courses"), where("dosenId", "==", username));
      const snapshot = await getDocs(q);
      const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllCourses(fetchedCourses); 
    } catch (error) {
      console.error("Error fetching courses: ", error);
      Alert.alert("Error", "Gagal memuat daftar mata kuliah.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsInClass = async (className) => {
    if (!className) {
      setStudentsInClass([]);
      setSelectedStudent('');
      return;
    }
    setFetchingStudents(true);
    try {
      const q = query(
        collection(db, "users"),
        where("className", "==", className),
        where("role", "==", "mahasiswa")
      );
      const snapshot = await getDocs(q);
      setStudentsInClass(snapshot.docs.map(doc => ({
        id: doc.id,
        username: doc.data().username,
        namaLengkap: doc.data().namaLengkap || doc.data().username
      })));
    } catch (error) {
      console.error("Error fetching students: ", error);
      Alert.alert("Error", "Gagal memuat daftar mahasiswa.");
    } finally {
      setFetchingStudents(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchDosenCourses();
  }, [username]));

  useEffect(() => {
    fetchStudentsInClass(selectedClass);
  }, [selectedClass]);
  
  useEffect(() => {
    if (selectedClass) {
      const filtered = allCourses.filter(course => course.className === selectedClass);
      setFilteredCourses(filtered);
      if (!filtered.some(course => course.id === selectedCourse)) {
        setSelectedCourse('');
      }
    } else {
      setFilteredCourses([]); 
      setSelectedCourse('');
    }
  }, [selectedClass, allCourses]);

  const handleSaveAttendance = async () => {
    if (!selectedClass || !selectedCourse || !selectedStudent || !attendanceStatus) {
      Alert.alert('Input Tidak Lengkap', 'Harap isi semua field yang wajib diisi (Kelas, Mata Kuliah, Mahasiswa, dan Status).');
      return;
    }

    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      const attendanceCheckQuery = query(
        collection(db, "attendance"),
        where("userId", "==", selectedStudent),
        where("courseId", "==", selectedCourse),
        where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
        where("timestamp", "<=", Timestamp.fromDate(endOfDay))
      );
      const attendanceSnapshot = await getDocs(attendanceCheckQuery);

      if (!attendanceSnapshot.empty) {
        Alert.alert("Sudah Absen", `Mahasiswa ${selectedStudent} sudah memiliki catatan absensi untuk mata kuliah ${selectedCourse} hari ini.`);
        return;
      }

      const courseData = allCourses.find(c => c.id === selectedCourse); 
      const studentData = studentsInClass.find(s => s.username === selectedStudent);

      await addDoc(collection(db, "attendance"), {
        userId: selectedStudent,
        namaLengkap: studentData?.namaLengkap || selectedStudent,
        courseId: selectedCourse,
        courseName: courseData?.name || selectedCourse,
        dosenId: username,
        sessionId: null, // Tidak ada sesi QR untuk absensi khusus
        timestamp: Timestamp.now(),
        status: attendanceStatus, // 'izin' atau 'sakit'
        notes: notes || '',
      });
      Alert.alert('Sukses', `Absensi (${attendanceStatus}) berhasil dicatat untuk ${studentData?.namaLengkap || selectedStudent}.`);
      setSelectedClass('');
      setSelectedCourse('');
      setSelectedStudent('');
      setAttendanceStatus('');
      setNotes('');
      setStudentsInClass([]);
    } catch (error) {
      console.error("Error saving special attendance: ", error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan absensi khusus.');
    }
  };

  const handleSaveQRPlaceholder = () => {
    Alert.alert("Fitur Segera Tersedia", "Fitur untuk menyimpan QR untuk kasus izin/sakit akan segera ditambahkan.");
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8300EF" />
        <Text style={{ marginTop: 10 }}>Memuat data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Absensi Khusus</Text>
        <TouchableOpacity onPress={handleSaveAttendance}>
          <Icon name="save" size={26} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Dosen: {namaLengkap}</Text>
        </View>

        <Text style={styles.formTitle}>ABSENSI IZIN / SAKIT</Text>
        <Text style={styles.label}>Pilih Kelas *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedClass}
            onValueChange={(itemValue) => setSelectedClass(itemValue)}
          >
            <Picker.Item label="-- Pilih Kelas --" value="" />
            {availableClasses.map((cl, index) => (
              <Picker.Item key={index} label={cl} value={cl} />
            ))}
          </Picker>
        </View>
            
        <Text style={styles.label}>Pilih Mata Kuliah *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCourse}
            onValueChange={(itemValue) => setSelectedCourse(itemValue)}
            enabled={filteredCourses.length > 0} 
          >
            <Picker.Item label={filteredCourses.length > 0 ? "-- Pilih Mata Kuliah --" : "Pilih kelas terlebih dahulu"} value="" />
            {filteredCourses.map(course => ( 
              <Picker.Item key={course.id} label={`${course.name} (${course.className})`} value={course.id} />
            ))}
          </Picker>
        </View>
              
        <Text style={styles.label}>Pilih Mahasiswa *</Text>
        <View style={styles.pickerContainer}>
          {fetchingStudents ? (
            <ActivityIndicator size="small" color="#8300EF" style={{ padding: 15 }} />
          ) : (
            <Picker
              selectedValue={selectedStudent}
              onValueChange={(itemValue) => setSelectedStudent(itemValue)}
              enabled={studentsInClass.length > 0}
            >
              <Picker.Item label={studentsInClass.length > 0 ? "-- Pilih Mahasiswa --" : "Pilih kelas terlebih dahulu"} value="" />
              {studentsInClass.map(student => (
                <Picker.Item key={student.username} label={student.namaLengkap} value={student.username} />
              ))}
            </Picker>
          )}
        </View>
            
        <Text style={styles.label}>Status Absensi *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={attendanceStatus}
            onValueChange={(itemValue) => setAttendanceStatus(itemValue)}
          >
            <Picker.Item label="-- Pilih Status --" value="" />
            <Picker.Item label="Izin" value="izin" />
            <Picker.Item label="Sakit" value="sakit" />
          </Picker>
        </View>

        <Text style={styles.label}>Keterangan (Opsional)</Text>
        <TextInput
          style={styles.inputMultiline}
          placeholder="Misalnya: Demam tinggi, Ada urusan keluarga"
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity style={styles.saveQrButton} onPress={handleSaveQRPlaceholder}>
          <Icon name="download" size={20} color="white" />
          <Text style={styles.saveQrButtonText}>Save QR (Fitur Segera Ditambahkan)</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#8300EF', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  scrollContainer: { padding: 20 },
  userInfo: { marginBottom: 20 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#8300EF', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  label: { fontSize: 16, color: '#555', marginBottom: 8, fontWeight: '500' },
  pickerContainer: { backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginBottom: 15, overflow: 'hidden' },
  inputMultiline: { height: 80, textAlignVertical: 'top', backgroundColor: 'white', borderRadius: 10, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd', marginBottom: 15 },
  saveQrButton: { flexDirection: 'row', backgroundColor: '#5E00AB', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 3 },
  saveQrButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});
