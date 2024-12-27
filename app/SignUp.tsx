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

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const navigation = useNavigation();

  const handleSignup = async () => {
    if (!username || !email || !password || !repeatPassword) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }

    if (password !== repeatPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    try {
      const { data, error } = await supabase.from('users').insert([
        {
          username: username,
          email: email,
          password: password, // Storing plaintext password (not recommended)
        },
      ]);

      if (error) {
        Alert.alert('Error', error.message || 'Signup failed!');
      } else {
        await AsyncStorage.setItem('userEmail', email); // Save email in AsyncStorage
        Alert.alert('Success', 'Account created successfully!');
        navigation.navigate('Home');
        setUsername('');
        setEmail('');
        setPassword('');
        setRepeatPassword('');
      }
    } catch (err) {
      console.error('Signup error:', err);
      Alert.alert('Error', 'An unexpected error occurred!');
    }
  };

  return (
    <View style={styles.container}>
      {/* Dark Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>Create your account</Text>
      </View>

      {/* Input Fields */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
        />

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

        <TextInput
          style={styles.input}
          placeholder="Repeat Password"
          placeholderTextColor="#888"
          value={repeatPassword}
          onChangeText={setRepeatPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        <Text style={styles.signupButtonText}>Register</Text>
      </TouchableOpacity>

      <View style={styles.loginLinkContainer}>
        <Text style={styles.loginLinkText}>I have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/Login')}>
          <Text style={[styles.loginLinkText, styles.loginLink]}>Log in</Text>
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
    paddingTop: StatusBar.currentHeight + 20, // Account for status bar height
    paddingHorizontal: 20,
    paddingBottom: 80, // Increased padding to bring the section more down
    alignItems: 'flex-start', // Align header content to the left
    borderBottomLeftRadius: 10, // Added border radius
    borderBottomRightRadius:10, // Added border radius
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
    paddingTop: 60, // Adjusted padding to add space between header and input fields
    paddingBottom: 20,
  },
  input: {
    height: 50,
    backgroundColor: '#FCFCFC',
    borderRadius: 20, // Added border radius to inputs
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#181D31', // Added border color
  },
  signupButton: {
    width: '88%',
    height: 50,
    backgroundColor: '#181D31', // Changed button color to black theme
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 10, // Added border radius to button
    marginBottom: 20,
  },
  signupButtonText: {
    color: '#fff', // Changed text color to white
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    color: '#000',
    fontSize: 14,
  },
  loginLink: {
    fontWeight: 'bold',
    color: '#181D31', // Changed link color to match theme
  },
});