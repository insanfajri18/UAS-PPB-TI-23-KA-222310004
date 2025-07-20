import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, SafeAreaView, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../styles/theme';

export default function HistoryScreen({ route }) {
  const username = route.params?.username;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("userId", "==", username),
        orderBy("timestamp", "desc")
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceData = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const courseIds = [...new Set(attendanceData.map(item => item.courseId))];
      
      if (courseIds.length > 0) {
        const coursesQuery = query(collection(db, "courses"), where("__name__", "in", courseIds));
        const coursesSnapshot = await getDocs(coursesQuery);
        const coursesMap = coursesSnapshot.docs.reduce((map, doc) => {
          map[doc.id] = doc.data().name;
          return map;
        }, {});
        
        const combinedHistory = attendanceData.map(item => ({
          ...item,
          courseName: coursesMap[item.courseId] || item.courseId, // Tampilkan nama, atau ID jika nama tidak ditemukan
        }));
        setHistory(combinedHistory);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      Alert.alert("Error", "Gagal memuat riwayat.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchHistory(); }, [username]));

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.courseText}>Mata Kuliah: {item.courseName}</Text>
      <Text style={styles.dateText}>
        Waktu: {new Date(item.timestamp.seconds * 1000).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Absensi</Text>
      </View>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={history}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada riwayat absensi.</Text>}
            contentContainerStyle={{ padding: 20 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  header: { backgroundColor: '#8300EF', padding: 20, paddingTop: 40, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  content: { flex: 1 },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginBottom: 15, elevation: 3 },
  courseText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dateText: { fontSize: 14, color: '#666', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
});
