import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
  SafeAreaView,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../constants/Supabase';

const PRIMARYCOLOR = '#000000';
const SECONDARYCOLOR = '#FFFFFF';
const ACCENTCOLOR = '#35A2C1';
const windowWidth = Dimensions.get('window').width;
const tabItemWidth = (windowWidth * 0.8) / 3;

export default function ProfileScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState('Profile');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail) {
          setEmail(storedEmail);
          const { data, error } = await supabase
            .from('users')
            .select('username, tasks_completed')
            .eq('email', storedEmail)
            .single();

          if (error) {
            console.error('Error fetching user details:', error.message);
            return;
          }

          setUsername(data.username);
          setTasksCompleted(data.tasks_completed || 0);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchUserDetails();
  }, []);

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ username: tempUsername })
        .eq('email', email);

      if (error) {
        Alert.alert('Error', 'Failed to update username.');
        return;
      }

      setUsername(tempUsername);
      setIsEditing(false);
    } catch (error) {
      console.error('Unexpected error while updating username:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.from('users').delete().eq('email', email);

      if (error) {
        Alert.alert('Error', 'Failed to delete account.');
        return;
      }

      await AsyncStorage.removeItem('userEmail');
      setDeleteModalVisible(false);
      navigation.replace('Login');
    } catch (error) {
      console.error('Unexpected error while deleting account:', error);
    }
  };

  const handleTabPress = (tabName: string, index: number) => {
    setActiveTab(tabName);

    Animated.spring(indicatorAnim, {
      toValue: index * tabItemWidth,
      useNativeDriver: true,
    }).start();

    navigation.navigate(tabName);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userEmail'); // Clear stored email
          navigation.replace('Login'); // Navigate to the Login screen
        },
      },
    ]);
  };

  
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Profile Photo */}
        <View style={styles.profilePhotoContainer}>
          <Image
            source={{ uri: `https://robohash.org/${email}.png` }}
            style={styles.profilePhoto}
          />
        </View>

        {/* Username */}
        <View style={styles.usernameContainer}>
          {isEditing ? (
            <>
              <TextInput
                style={styles.editUsernameInput}
                value={tempUsername}
                onChangeText={setTempUsername}
                autoFocus
              />
              <TouchableOpacity onPress={handleSaveEdit}>
                <Ionicons name="checkmark" size={25} color={ACCENTCOLOR} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.username}>{username}</Text>
              <TouchableOpacity onPress={() => {
                setTempUsername(username);
                setIsEditing(true);
              }}>
                <Ionicons name="pencil" size={25} color={ACCENTCOLOR} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Email */}
        <Text style={styles.email}>{email}</Text>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statLabel}>Tasks Completed</Text>
          <Text style={styles.statValue}>{tasksCompleted}</Text>
        </View>

        {/* Logout and Delete Account */}
        <View style={styles.profileOptions}>
          <TouchableOpacity
            style={[styles.optionButton, styles.logoutButton]}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={styles.optionButtonText}>Delete Account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton} onPress={handleLogout}>
            <Text style={styles.optionButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Floating Navigation */}
        <View style={styles.floatingNavContainer}>
          {['home', 'list', 'person'].map((icon, index) => (
            <TouchableOpacity
              key={icon}
              style={styles.floatingNavItem}
              onPress={() =>
                handleTabPress(
                  icon === 'home' ? 'Home' : icon === 'list' ? 'Tasks' : 'Profile',
                  index
                )
              }
            >
              <Ionicons
                name={icon}
                size={25}
                color={
                  activeTab === (icon === 'home' ? 'Home' : icon === 'list' ? 'Tasks' : 'Profile')
                    ? ACCENTCOLOR
                    : '#BDBEC1'
                }
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Delete Account Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Are you sure you want to delete your account?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteAccount}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: SECONDARYCOLOR,
      paddingTop:50
    },
    container: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
    },
    profilePhotoContainer: {
      marginTop: 20,
      marginBottom: 20,
    },
    profilePhoto: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: ACCENTCOLOR,
    },
    usernameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    username: {
      fontSize: 24,
      fontWeight: 'bold',
      color: PRIMARYCOLOR,
      marginRight: 10,
    },
    editUsernameInput: {
      fontSize: 24,
      fontWeight: 'bold',
      color: PRIMARYCOLOR,
      borderBottomWidth: 1,
      borderBottomColor: ACCENTCOLOR,
      marginRight: 10,
      padding: 2,
    },
    email: {
      fontSize: 16,
      color: '#666',
      marginBottom: 20,
    },
    statsCard: {
      width: '100%',
      padding: 20,
      borderRadius: 15,
      backgroundColor: '#F8F8F8',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      alignItems: 'center',
      marginBottom: 20,
    },
    statLabel: {
      fontSize: 16,
      color: '#666',
      marginBottom: 5,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: PRIMARYCOLOR,
    },
    profileOptions: {
      marginTop: 20,
      width: '100%',
    },
    optionButton: {
      padding: 15,
      backgroundColor: ACCENTCOLOR,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 10,
    },
    optionButtonText: {
      fontSize: 16,
      color: SECONDARYCOLOR,
      fontWeight: 'bold',
    },
    logoutButton: {
      backgroundColor: '#FFD2D2',
    },
    floatingNavContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      paddingVertical: 15,
      borderRadius: 30,
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      elevation: 5,
      shadowColor: PRIMARYCOLOR,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    floatingNavItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      width: '80%',
      backgroundColor: SECONDARYCOLOR,
      borderRadius: 10,
      padding: 20,
      alignItems: 'center',
    },
    modalText: {
      fontSize: 18,
      color: PRIMARYCOLOR,
      marginBottom: 20,
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    cancelText: {
      fontSize: 16,
      color: '#666',
    },
    deleteText: {
      fontSize: 16,
      color: 'red',
      fontWeight: 'bold',
    },
  });