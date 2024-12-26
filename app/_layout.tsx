import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './HomeScreen';
import Tasks from './Tasks';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import ViewTask from './(viewTask)/[taskId]';

const Stack = createStackNavigator();
// SplashScreen.preventAutoHideAsync();


export default function App() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
    
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{headerShown:false}}/>
        <Stack.Screen name="Tasks" component={Tasks} options={{headerShown:false}}/>
        <Stack.Screen name="(viewTask)/[viewTask]" component={ViewTask}/>
      </Stack.Navigator>
      <StatusBar style="auto" />
      </ThemeProvider>
    
  );
}
