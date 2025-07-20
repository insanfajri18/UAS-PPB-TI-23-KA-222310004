// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import semua screen
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import DosenHomeScreen from './screens/DosenHomeScreen';
import MahasiswaHomeScreen from './screens/MahasiswaHomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import CreateAssignmentScreen from './screens/CreateAssignmentScreen';
import QRGeneratorScreen from './screens/QRGeneratorScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import SpecialAttendanceScreen from './screens/SpecialAttendanceScreen'; // <-- IMPORT BARU

import { COLORS } from './styles/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DosenTabNavigator({ route }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Schedule') iconName = 'calendar';
          else if (route.name === 'Attendance') iconName = 'check-square';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5E00AB',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white', borderTopWidth: 0, elevation: 10,
          height: 60 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 5,
        },
      })}
    >
      <Tab.Screen name="Schedule" component={DosenHomeScreen} initialParams={route.params} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} initialParams={route.params} />
    </Tab.Navigator>
  );
}

function MahasiswaTabNavigator({ route }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Scan QR') iconName = 'maximize';
          else if (route.name === 'History') iconName = 'clock';
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5E00AB',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white', borderTopWidth: 0, elevation: 10,
          height: 60 + insets.bottom, paddingBottom: insets.bottom, paddingTop: 5,
        },
      })}
    >
      <Tab.Screen name="Scan QR" component={MahasiswaHomeScreen} initialParams={route.params} />
      <Tab.Screen name="History" component={HistoryScreen} initialParams={route.params} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DosenApp" component={DosenTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="MahasiswaApp" component={MahasiswaTabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="CreateAssignment" component={CreateAssignmentScreen} options={{ headerShown: false }} />
        <Stack.Screen name="QRGenerator" component={QRGeneratorScreen} options={{ title: 'Generate QR Absensi', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: 'white' }} />
        {/* RUTE BARU UNTUK ABSENSI KHUSUS */}
        <Stack.Screen name="SpecialAttendance" component={SpecialAttendanceScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}