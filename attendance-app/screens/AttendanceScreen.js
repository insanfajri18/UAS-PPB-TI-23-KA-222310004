// screens/AttendanceScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, SafeAreaView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { COLORS } from '../styles/theme';

export default function AttendanceScreen({ route }) {
  const { username } = route.params;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendanceData = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "attendance"),
        where("dosenId", "==", username),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      
      const groupedBySession = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        const sessionId = data.sessionId;

        // Skip jika data tidak memiliki sessionId
        if (!sessionId) return acc;

        if (!acc[sessionId]) {
          acc[sessionId] = {
            id: sessionId,
            courseName: data.courseName || 'Nama Mata Kuliah Tidak Ada',
            timestamp: data.timestamp,
            present: [],
            absent: []
          };
        }

        if (data.status === 'hadir') {
          acc[sessionId].present.push(data.namaLengkap || data.userId);
        } else {
          acc[sessionId].absent.push(data.userId);
        }
        return acc;
      }, {});

      setSessions(Object.values(groupedBySession));
    } catch (error) {
      console.error("Error fetching attendance: ", error);
      Alert.alert("Error", "Gagal memuat data absensi.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAttendanceData(); }, [username]));

  // --- FUNGSI RENDERITEM YANG DIPERBAIKI ---
  const renderItem = ({ item }) => {
    // Pengaman: Jika item.present atau item.absent tidak ada, gunakan array kosong
    const presentList = item.present || [];
    const absentList = item.absent || [];

    return (
      <View style={styles.card}>
        <Text style={styles.courseText}>{item.courseName}</Text>
        <Text style={styles.dateText}>
          {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' }) : 'No date'}
        </Text>
        
        <View style={styles.studentList}>
          <Text style={styles.studentHeader}>Hadir ({presentList.length})</Text>
          {presentList.map((student, index) => <Text key={`${student}-${index}`} style={styles.studentNamePresent}>- {student}</Text>)}
        </View>

        {absentList.length > 0 && (
          <View style={styles.studentList}>
            <Text style={styles.studentHeader}>Tidak Hadir ({absentList.length})</Text>
            {absentList.map((student, index) => <Text key={`${student}-${index}`} style={styles.studentNameAbsent}>- {student}</Text>)}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Absensi Kelas</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada data absensi.</Text>}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#8300EF', padding: 20, paddingTop: 50, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginBottom: 15, elevation: 3 },
  courseText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dateText: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 15 },
  studentList: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10, marginTop: 10 },
  studentHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  studentNamePresent: { fontSize: 15, color: 'green' },
  studentNameAbsent: { fontSize: 15, color: 'red' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
});