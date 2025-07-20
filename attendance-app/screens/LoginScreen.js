// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Icon from 'react-native-vector-icons/Feather';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const login = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Username dan password harus diisi.");
      return;
    }
    try {
      const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Login Gagal", "Username atau password salah.");
      } else {
        const userDoc = querySnapshot.docs[0];
        const user = userDoc.data();

        // Cek role pengguna dan arahkan ke navigasi yang sesuai
        if (user.role === 'dosen') {
          navigation.replace("DosenApp", { username: user.username, role: user.role });
        } else {
          navigation.replace("MahasiswaApp", { username: user.username, role: user.role });
        }
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi masalah saat login.");
      console.error("Login error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo-qr.png')}
                style={styles.logo}
              />
            </View>

            <Text style={styles.title}>LOGIN</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Input your username"
                placeholderTextColor="#999"
                onChangeText={setUsername}
                value={username}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Input your password"
                  placeholderTextColor="#999"
                  secureTextEntry={!isPasswordVisible}
                  onChangeText={setPassword}
                  value={password}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                  <Icon name={isPasswordVisible ? "eye-off" : "eye"} size={22} color="#555" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={login}>
              <Text style={styles.loginButtonText}>Login</Text>
              <Icon name="arrow-right" size={24} color="white" style={styles.arrowIcon} />
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  logoContainer: { alignItems: 'center', marginBottom: 30, },
  logo: { width: 120, height: 120, borderRadius: 20, },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 40, letterSpacing: 2, },
  inputContainer: { width: '100%', marginBottom: 20, },
  label: { fontSize: 16, color: '#555', marginBottom: 8, fontWeight: 'bold', },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 15, fontSize: 16, borderWidth: 1, borderColor: '#ddd', },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', },
  passwordInput: { flex: 1, padding: 15, fontSize: 16, },
  eyeIcon: { padding: 10, },
  loginButton: { backgroundColor: '#5E00AB', borderRadius: 10, paddingVertical: 18, marginTop: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%', },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', },
  arrowIcon: { position: 'absolute', right: 20, },
});