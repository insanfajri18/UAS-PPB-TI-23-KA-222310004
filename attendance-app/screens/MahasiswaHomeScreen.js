import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, StatusBar, BackHandler } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { collection, query, where, getDocs, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Icon from 'react-native-vector-icons/Feather';

export default function MahasiswaHomeScreen({ route, navigation }) {
  const { username } = route.params || {};
  const [fullName, setFullName] = useState('');
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  const showLogoutConfirmation = () => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      { text: "Ya, Keluar", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }
    ]);
  };

  useEffect(() => {
    const backAction = () => {
      if (isFocused) { showLogoutConfirmation(); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [isFocused, navigation]);

  const fetchUserData = async () => {
    if (!username) return;
    try {
      const userQuery = query(collection(db, "users"), where("username", "==", username));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        setFullName(userSnapshot.docs[0].data().namaLengkap || username);
      }
    } catch (e) { console.error("Gagal fetch user data: ", e); }
  };

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, []);

  useEffect(() => {
    if (isFocused) {
      setScanned(false);
      fetchUserData();
    }
  }, [isFocused, username]);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || !username) return;
    setScanned(true);
    const sessionId = data;
    try {
      const sessionDocRef = doc(db, "live_sessions", sessionId);
      const sessionDoc = await getDoc(sessionDocRef);
      const now = Timestamp.now();
      if (!sessionDoc.exists() || !sessionDoc.data().active || now.toMillis() > sessionDoc.data().expiresAt.toMillis()) {
        Alert.alert("Gagal", "Sesi QR Code tidak valid atau sudah kedaluwarsa.");
        setTimeout(() => setScanned(false), 3000); return;
      }
      const sessionData = sessionDoc.data();
      const courseId = sessionData.courseId;
      const courseName = sessionData.courseName;
      const dosenId = sessionData.dosenId;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", username), where("courseId", "==", courseId), where("timestamp", ">=", Timestamp.fromDate(startOfDay)), where("timestamp", "<=", Timestamp.fromDate(endOfDay)));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      if (!attendanceSnapshot.empty) {
        Alert.alert("Sudah Absen", `Anda sudah absen untuk mata kuliah ${courseName} hari ini.`);
        setTimeout(() => setScanned(false), 3000); return;
      }

      await addDoc(collection(db, "attendance"), {
        userId: username,
        namaLengkap: fullName || username,
        courseId: courseId,
        courseName: courseName,
        dosenId: dosenId,
        sessionId: sessionId,
        timestamp: new Date(),
        status: 'hadir'
      });
      
      Alert.alert("Sukses!", `Berhasil absen untuk mata kuliah: ${courseName}`);
    } catch (error) {
      Alert.alert("Error", "Terjadi masalah saat validasi absensi.");
      console.error("Attendance validation error:", error);
    } finally {
      setTimeout(() => setScanned(false), 3000);
    }
  };

  const handleUploadPress = () => alert('Fitur Upload QR belum tersedia.');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={'#8300EF'} />
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.welcomeTitle}>Welcome, {fullName || username}</Text>
          <Text style={styles.roleText}>Mahasiswa</Text>
        </View>
        <TouchableOpacity onPress={showLogoutConfirmation} style={styles.logoutButton}>
          <Icon name="log-out" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.cameraCard}>
          {hasPermission && isFocused ? (
            <CameraView onBarcodeScanned={handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} style={styles.camera} />
          ) : (
            <View style={styles.permissionTextContainer}><Text style={styles.permissionText}>{hasPermission === null ? 'Meminta izin kamera...' : 'Akses kamera ditolak.'}</Text></View>
          )}
          <View style={styles.cardOverlay}><Text style={styles.cardTitle}>Scan QR</Text></View>
        </View>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
          <Icon name="upload" size={22} color='white' />
          <Text style={styles.uploadButtonText}>Upload QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f0f0' },
    header: { 
      backgroundColor: '#8300EF', 
      height: 240, 
      borderBottomLeftRadius: 40, 
      borderBottomRightRadius: 40, 
      justifyContent: 'center',
      position: 'relative',
    },
    headerTitleContainer: {
      alignItems: 'center',
      marginHorizontal: 60, 
    },
    logoutButton: { 
      position: 'absolute', 
      right: 20, 
      top: 60,
      padding: 10 
    },
    content: { 
      flex: 1, 
      alignItems: 'center', 
      marginTop: -70,
    },
    welcomeTitle: { 
      fontSize: 24, 
      fontWeight: 'bold', 
      color: 'white', 
      textAlign: 'center' 
    },
    roleText: { 
      fontSize: 16, 
      color: 'white', 
      opacity: 0.8, 
      marginTop: 5, 
      textTransform: 'capitalize' 
    },
    cameraCard: { width: '85%', height: 350, backgroundColor: 'black', borderRadius: 20, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8, overflow: 'hidden' },
    camera: { flex: 1 },
    permissionTextContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    permissionText: { color: 'white', fontSize: 16 },
    cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', padding: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 10 },
    uploadButton: { 
      flexDirection: 'row', 
      backgroundColor: '#5E00AB', 
      width: '85%', 
      paddingVertical: 18, 
      borderRadius: 15, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginTop: 30, 
      borderWidth: 1, 
      borderColor: 'white' 
    },
    uploadButtonText: { 
      color: 'white', 
      fontSize: 16, 
      fontWeight: 'bold', 
      marginLeft: 10 
    },
});
