import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../constants/Supabase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({navigation}:any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error) {
        Alert.alert('Error', error.message || 'Login failed!');
      } else {
        await AsyncStorage.setItem('userEmail', email);
        Alert.alert('Success', 'Logged in successfully!');
        navigation.navigate('Home');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      console.error('Login error:', err);
      Alert.alert('Error', 'An unexpected error occurred!');
    }
  };

  return (
    <View style={styles.container}>
      {/* Dark Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Sign in to your Account</Text>
        <Text style={styles.subtitle}>Sign in to your Account</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.signupLinkContainer}>
        <Text style={styles.signupLinkText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/SignUp')}>
          <Text style={[styles.signupLinkText, styles.signupLink]}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#181D31',
    paddingTop: StatusBar.currentHeight + 20,
    paddingHorizontal: 20,
    paddingBottom: 80,
    alignItems: 'flex-start',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 20,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  input: {
    height: 50,
    backgroundColor: '#FCFCFC',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#181D31',
  },
  loginButton: {
    width: '88%',
    height: 50,
    backgroundColor: '#181D31',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  signupLinkText: {
    color: '#000',
    fontSize: 14,
  },
  signupLink: {
    fontWeight: 'bold',
    color: '#181D31',
  },
});