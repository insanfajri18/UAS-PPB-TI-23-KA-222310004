import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, SafeAreaView } from 'react-native';
import { CameraView, Camera } from "expo-camera";
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from '../styles/theme';

export default function QRScannerScreen({ route }) {
  const { username } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      const q = query(collection(db, "qrcodes"), where("code", "==", data));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert("Gagal", "QR Code tidak valid atau sudah kedaluwarsa.");
      } else {
        const qrDoc = snapshot.docs[0];
        const qrData = qrDoc.data();

        await addDoc(collection(db, "attendance"), {
          userId: username,
          courseId: qrData.courseId,
          timestamp: new Date()
        });
        Alert.alert("Sukses!", `Anda berhasil absen untuk mata kuliah: ${qrData.courseId}`);
      }
    } catch (error) {
        Alert.alert("Error", "Terjadi masalah saat mencatat kehadiran.");
        console.error("Attendance error:", error);
    }

    setTimeout(() => setScanned(false), 3000);
  };

  if (hasPermission === null) return <Text style={globalStyles.bodyText}>Meminta izin kamera...</Text>;
  if (hasPermission === false) return <Text style={globalStyles.bodyText}>Akses kamera ditolak.</Text>;

  return (
    <View style={globalStyles.cameraContainer}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={globalStyles.qrMarker} />
      <Text style={{color: COLORS.white, marginTop: 20, fontSize: 18}}>Arahkan kamera ke QR Code</Text>
    </View>
  );
}
