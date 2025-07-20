// screens/QRGeneratorScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import QRCode from 'react-native-qrcode-svg';
import { collection, addDoc, getDocs, query, where, onSnapshot, Timestamp, writeBatch, doc, getDoc, limit } from 'firebase/firestore'; // Import 'limit'
import { db } from '../firebase';

export default function QRGeneratorScreen({ route }) {
  const { username, activeSessionId } = route.params;
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionId, setSessionId] = useState(activeSessionId || null);
  const [presentStudents, setPresentStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(!!activeSessionId);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isSessionDataLoaded, setIsSessionDataLoaded] = useState(false);

  const loadExistingSession = async (existingSessionId) => {
    try {
      const sessionDocRef = doc(db, "live_sessions", existingSessionId);
      const sessionDoc = await getDoc(sessionDocRef);
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        const now = Timestamp.now();
        const expiration = sessionData.expiresAt;
        const remainingTime = Math.max(0, expiration.seconds - now.seconds);
        setSessionId(existingSessionId);
        setSelectedCourse(sessionData.courseId);
        setTimeLeft(remainingTime);
        setSessionEnded(remainingTime <= 0);
      } else {
        Alert.alert("Error", "Sesi aktif tidak ditemukan lagi.");
        setSessionId(null);
      }
    } catch (error) {
      console.error("Gagal memuat sesi: ", error);
      Alert.alert("Error", "Gagal memuat sesi yang sedang berjalan.");
    } finally {
      setIsLoading(false);
      setIsSessionDataLoaded(true);
    }
  };

  useEffect(() => {
    if (activeSessionId) {
      loadExistingSession(activeSessionId);
    } else {
      setIsSessionDataLoaded(true);
    }
    const fetchCourses = async () => {
      const q = query(collection(db, "courses"), where("dosenId", "==", username));
      const snapshot = await getDocs(q);
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchCourses();
  }, [username, activeSessionId]);

  const generateQRSession = async () => {
    if (!selectedCourse) {
      Alert.alert("Error", "Silakan pilih mata kuliah terlebih dahulu.");
      return;
    }

    // --- PERUBAHAN 1: PENGECEKAN PRESENSI YANG SUDAH ADA ---
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const attendanceCheckQuery = query(
        collection(db, "attendance"),
        where("courseId", "==", selectedCourse),
        where("timestamp", ">=", startOfDay),
        where("timestamp", "<=", endOfDay),
        limit(1) // Cukup cek 1 dokumen saja untuk efisiensi
      );

      const attendanceSnapshot = await getDocs(attendanceCheckQuery);
      if (!attendanceSnapshot.empty) {
        Alert.alert("Gagal Membuat Sesi", "Presensi untuk mata kuliah ini sudah dibuat hari ini. Silakan coba lagi besok.");
        return;
      }
    } catch(error) {
      console.error("Error checking existing attendance: ", error);
      Alert.alert("Error", "Gagal memverifikasi data presensi sebelumnya.");
      return;
    }
    // --- AKHIR PERUBAHAN 1 ---

    const courseData = courses.find(c => c.id === selectedCourse);
    if (!courseData || !courseData.name || !courseData.className) {
        Alert.alert("Data Tidak Lengkap", "Data mata kuliah yang dipilih tidak lengkap.");
        return;
    }
    setIsLoading(true);
    try {
      // --- PERUBAHAN 2: UBAH DURASI WAKTU JADI 20 DETIK ---
      const expirationTime = new Date(new Date().getTime() + 20 * 1000); // 20 detik
      const sessionDocRef = await addDoc(collection(db, "live_sessions"), {
        dosenId: username,
        courseId: selectedCourse,
        courseName: courseData.name,
        className: courseData.className,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(expirationTime),
        active: true,
      });
      setSessionId(sessionDocRef.id);
      setTimeLeft(20); // Atur countdown ke 20 detik
      setSessionEnded(false);
      // --- AKHIR PERUBAHAN 2 ---
    } catch (error) {
      Alert.alert("Error", "Gagal membuat sesi QR Code.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isSessionDataLoaded) return;

    if (timeLeft === 0 && sessionId && !sessionEnded) {
      setSessionEnded(true);
      finalizeAttendance(sessionId);
    }
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, sessionId, sessionEnded, isSessionDataLoaded]);

  useEffect(() => {
    if (!sessionId) return;
    const q = query(collection(db, "attendance"), where("sessionId", "==", sessionId), where("status", "==", "hadir"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData = querySnapshot.docs.map(doc => ({
        id: doc.data().userId,
        name: doc.data().namaLengkap || doc.data().userId,
      }));
      setPresentStudents(studentsData);
    });
    return () => unsubscribe();
  }, [sessionId]);

  const finalizeAttendance = async (currentSessionId) => {
    Alert.alert("Sesi Selesai", "Waktu habis. Memproses data...");
    try {
      const sessionDocRef = doc(db, "live_sessions", currentSessionId);
      const sessionDoc = await getDoc(sessionDocRef);
      if (!sessionDoc.exists()) throw new Error("Sesi tidak ditemukan.");
      
      const sessionData = sessionDoc.data();
      const { className, courseId, courseName } = sessionData;
      if (!className) throw new Error("Data kelas tidak ditemukan dalam sesi.");

      const studentsInClassQuery = query(collection(db, "users"), where("className", "==", className), where("role", "==", "mahasiswa"));
      const allStudentsSnapshot = await getDocs(studentsInClassQuery);
      const allStudentUsernames = allStudentsSnapshot.docs.map(doc => doc.data().username);
      
      const presentUsernames = presentStudents.map(student => student.id);
      const absentUsernames = allStudentUsernames.filter(name => !presentUsernames.includes(name));
      
      const batch = writeBatch(db);
      const now = new Date();
      absentUsernames.forEach(studentUsername => {
        const newAttendanceRef = doc(collection(db, "attendance"));
        batch.set(newAttendanceRef, {
          userId: studentUsername, courseId, courseName, dosenId: username,
          sessionId: currentSessionId, timestamp: now, status: 'tidak hadir'
        });
      });
      await batch.commit();
      
      if(absentUsernames.length > 0) {
        Alert.alert("Proses Selesai", `${absentUsernames.length} mahasiswa ditandai tidak hadir.`);
      } else {
        Alert.alert("Proses Selesai", "Semua mahasiswa yang terdaftar telah hadir.");
      }
    } catch (error) {
      console.error("Finalize attendance error: ", error);
      Alert.alert("Error", `Gagal memproses data: ${error.message}`);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={'#5E00AB'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>QR Untuk Absensi</Text></View>
      {!sessionId ? (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Pilih Mata Kuliah</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedCourse} onValueChange={(itemValue) => setSelectedCourse(itemValue)}>
              <Picker.Item label="-- Pilih --" value="" />
              {courses.map(course => <Picker.Item key={course.id} label={`${course.name} (${course.className})`} value={course.id} />)}
            </Picker>
          </View>
          <TouchableOpacity style={styles.button} onPress={generateQRSession}>
            <Text style={styles.buttonText}>Generate QR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.qrContainer}>
          <Text style={styles.timerText}>{timeLeft > 0 ? `Sisa Waktu: ${formatTime(timeLeft)}` : "Waktu Habis!"}</Text>
          <View style={styles.qrCodeWrapper}><QRCode value={sessionId} size={250} /></View>
          <Text style={styles.sessionInfo}>Mata Kuliah: {courses.find(c => c.id === selectedCourse)?.name}</Text>
          <FlatList
            data={presentStudents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Text style={styles.studentItem}>- {item.name}</Text>}
            ListHeaderComponent={<Text style={styles.studentListHeader}>Mahasiswa Hadir: {presentStudents.length}</Text>}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada yang absen.</Text>}
            style={{width: '100%'}}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    header: { backgroundColor: '#8300EF', padding: 20, paddingTop: 50, alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
    formContainer: { 
      padding: 20 
    },
    label: { fontSize: 16, fontWeight: '500', marginBottom: 10 },
    pickerContainer: { backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', marginBottom: 20 },
    button: { backgroundColor:'#8300EF', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    qrContainer: { flex: 1, alignItems: 'center', padding: 20 },
    timerText: { fontSize: 18, marginBottom: 15, color: 'red', fontWeight: 'bold' },
    qrCodeWrapper: { padding: 10, backgroundColor: 'white', borderRadius: 10, elevation: 5 },
    sessionInfo: { fontSize: 16, fontWeight: 'bold', marginVertical: 20 },
    studentListHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start'},
    studentItem: { fontSize: 16, paddingVertical: 5, alignSelf: 'flex-start' },
    emptyText: { color: '#888', fontStyle: 'italic', alignSelf: 'flex-start' },
});