// screens/SplashScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const PRIMARY_COLOR = '#8300EF';
const BUTTON_COLOR = '#5E00AB';

const SplashScreen = ({ navigation }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

const handleStart = () => {
  navigation.navigate('Login'); 
};

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
      
      <Image 
        source={require('../assets/logo-qr.png')}
        style={styles.logo} 
      />

      <Text style={styles.title}>QR Attendance System</Text>

      {/* Container untuk Aksi (Loading atau Tombol)
        Sekarang menjadi bagian dari layout utama, bukan di bawah.
      */}
      <View style={styles.actionContainer}>
        {!isReady ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>Start</Text>
            <Icon name="arrow-right" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center', // Ini akan membuat semua elemen di tengah vertikal
    alignItems: 'center',     // Ini akan membuat semua elemen di tengah horizontal
    padding: 20,
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    marginBottom: 20, // Beri sedikit jarak bawah dari logo
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  // Style 'bottomContainer' DIHAPUS
  
  // Style BARU untuk membungkus tombol/loading
  actionContainer: {
    marginTop: 50, // Jarak dari judul ke tombol
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '90%', 
    flexDirection: 'row',
    backgroundColor: BUTTON_COLOR, 
    paddingVertical: 18, 
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between', 
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SplashScreen;