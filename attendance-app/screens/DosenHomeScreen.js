import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, StatusBar, BackHandler, ActivityIndicator, FlatList, SafeAreaView } from 'react-native';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Icon from 'react-native-vector-icons/Feather';

export default function DosenHomeScreen({ route, navigation }) {
  const { username } = route.params || {};
  const [fullName, setFullName] = useState('...');
  const [userRole, setUserRole] = useState('...'); 
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const isFocused = useIsFocused();

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

  const checkActiveSession = async () => {
    if(!username) return;
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, "live_sessions"), 
        where("dosenId", "==", username), 
        where("expiresAt", ">", now)
      );
      const sessionSnapshot = await getDocs(q);
      if (!sessionSnapshot.empty) {
        const sessionDoc = sessionSnapshot.docs[0];
        setActiveSessionId(sessionDoc.id);
      } else {
        setActiveSessionId(null);
      }
    } catch (error) {
      console.error("Gagal memeriksa sesi aktif: ", error);
      setActiveSessionId(null);
    }
  };

  const fetchData = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const userQuery = query(collection(db, "users"), where("username", "==", username));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        setFullName(userData.namaLengkap || username);
        setUserRole(userData.role || 'N/A');
      }
      const assignmentQuery = query(collection(db, "assignments"), where("creatorId", "==", username), orderBy("createdAt", "desc"));
      const assignmentSnapshot = await getDocs(assignmentQuery);
      setAssignments(assignmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error("Gagal fetch data: ", e);
      Alert.alert("Error", "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };
  
  useFocusEffect(useCallback(() => {
    checkActiveSession();
    fetchData();
  }, [username]));
  
  const handleDeleteAssignment = (assignmentId) => {
    Alert.alert(
      "Hapus Assignment",
      "Apakah Anda yakin ingin menghapus tugas ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Ya, Hapus", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "assignments", assignmentId));
              Alert.alert("Sukses", "Assignment berhasil dihapus.");
              fetchData();
            } catch (error) {
              Alert.alert("Error", "Gagal menghapus assignment.");
            }
          }
        }
      ]
    );
  };

  const renderAssignmentItem = ({ item }) => (
    <View style={styles.card}>
        <View style={{flex: 1, marginRight: 10}}>
            <Text style={styles.cardCourse}>{item.courseName}</Text>
            <Text style={styles.cardClass}>{item.className}</Text>
            <Text style={styles.cardDetail} numberOfLines={2}>{item.details}</Text>
        </View>
        <View style={{alignItems: 'flex-end', justifyContent: 'space-between'}}>
            <TouchableOpacity onPress={() => handleDeleteAssignment(item.id)}>
              <Icon name="trash-2" size={22} color="#ff3b30" />
            </TouchableOpacity>
            <View style={{alignItems: 'flex-end', marginTop: 10}}>
              <Text style={styles.cardDeadlineLabel}>Deadline</Text>
              <Text style={styles.cardDeadline}>{new Date(item.deadline.seconds * 1000).toLocaleDateString('id-ID')}</Text>
              <Text style={styles.cardDeadline}>{new Date(item.deadline.seconds * 1000).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</Text>
            </View>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={'#8300EF'} />
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.welcomeTitle}>Welcome, {fullName}</Text>
            <Text style={styles.roleText}>{userRole}</Text>
        </View>
        <TouchableOpacity onPress={showLogoutConfirmation} style={styles.logoutButton}>
          <Icon name="log-out" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.dashboardContainer}>
        <TouchableOpacity 
          style={[styles.createButton, activeSessionId && styles.buttonDisabled]} 
          onPress={() => navigation.navigate('CreateAssignment', { username, namaLengkap: fullName })}
          disabled={!!activeSessionId}
        >
          <Icon name="plus" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Assignment</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.specialAttendanceButton, activeSessionId && styles.buttonDisabled]} 
          onPress={() => navigation.navigate('SpecialAttendance', { username, namaLengkap: fullName })}
          disabled={!!activeSessionId}
        >
          <Icon name="file-text" size={24} color="white" />
          <Text style={styles.specialAttendanceButtonText}>Absensi Izin/Sakit</Text>
        </TouchableOpacity>
        
        {loading ? (
          <ActivityIndicator size="large" color={'#5E00AB'} style={{marginTop: 50}}/>
        ) : (
          <FlatList
            data={assignments}
            renderItem={renderAssignmentItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada assignment yang dibuat.</Text>}
            contentContainerStyle={{paddingBottom: 100}}
          />
        )}
      </View>
       <TouchableOpacity 
          style={styles.generateQrButton}
          onPress={() => navigation.navigate('QRGenerator', { username, activeSessionId })}
        >
          <Text style={styles.generateQrText}>
            {activeSessionId ? 'Lihat Sesi QR Aktif' : 'Generate QR Absensi'}
          </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#8300EF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, paddingTop: 50 },
    headerTitleContainer: { flex: 1, alignItems: 'center', },
    welcomeTitle: { textAlign: 'center', color: 'white', fontSize: 22, fontWeight: 'bold' },
    roleText: { fontSize: 16, color: 'white', opacity: 0.8, marginTop: 5, textTransform: 'capitalize' },
    logoutButton: { position: 'absolute', right: 20, top: 45, padding: 10 },
    dashboardContainer: { flex: 1, backgroundColor: '#f0f0f0', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    createButton: { flexDirection: 'row', backgroundColor: '#5E00AB', padding: 15, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 3 }, // Changed marginBottom
    createButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
    
    specialAttendanceButton: {
      flexDirection: 'row', 
      backgroundColor: '#007BFF', 
      padding: 15, 
      borderRadius: 10, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginBottom: 20, 
      elevation: 3 
    },
    specialAttendanceButtonText: {
      color: 'white', 
      fontSize: 16, 
      fontWeight: 'bold', 
      marginLeft: 10
    },

    card: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 2 },
    cardCourse: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    cardClass: { fontSize: 14, color: '#666', marginTop: 2 },
    cardDetail: { fontSize: 14, color: '#888', marginTop: 8, flexShrink: 1 },
    cardDeadlineLabel: { fontSize: 12, color: '#aaa' },
    cardDeadline: { fontSize: 14, fontWeight: '500', color: '#5E00AB' },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
    generateQrButton: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#5E00AB', padding: 20, borderRadius: 15, alignItems: 'center', alignSelf: 'center', width: '90%'},
    generateQrText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#B0B0B0' },
});
