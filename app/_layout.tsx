import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './HomeScreen';
import Tasks from './Tasks';
import SignUp from './SignUp';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import ViewTask from './(viewTask)/[taskId]';
import Login from './Login';

const Stack = createStackNavigator();
SplashScreen.preventAutoHideAsync();

export default function App() {
  const colorScheme = useColorScheme();
  const [initialRoute, setInitialRoute] = useState('SignUp');
  const [isLoading, setIsLoading] = useState(true); 
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const userEmail = await AsyncStorage.getItem('userEmail');
        if (userEmail) {
          setInitialRoute('Home');
        }
      } catch (error) {
        console.error('Error checking logged-in user:', error);
      } finally {
        setIsLoading(false); // Set loading to false after checking
        SplashScreen.hideAsync(); // Hide splash screen after loading
      }
    };

    checkLoggedIn();
  }, []);

  if (isLoading) {
    return null; 
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tasks" component={Tasks} options={{ headerShown: false }} />
        <Stack.Screen name="ViewTask" component={ViewTask} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}