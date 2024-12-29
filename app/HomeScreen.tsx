import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import record from '@/functions/record';
import transcribe from '@/functions/transcribe';
import getAudio from '@/functions/toSpeech';
import Bot from '../components/Bot';
import BotRecording from '../components/BotRecording';
import BotSpeaking from '../components/BotSpeaking';
import { supabase } from '../constants/Supabase';
import AsyncStorage from '@react-native-async-storage/async-storage'


const PRIMARYCOLOR = '#000000';
const SECONDARYCOLOR = '#FFFFFF';
const ACCENTCOLOR = '#35A2C1';
const PRIMARYBORDERRADIUS = 10;
const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;
const tabWidth = windowWidth * 0.8;
const tabItemWidth = tabWidth / 3;


export default function HomeScreen({navigation}:any) {
  const [loading,setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('Home');
  
  const isFocused = useIsFocused();
  const [recording, setRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tasks_completed, setTasksCompleted] = useState(0);
  const [targetTasks] = useState(100);
  const [dailyActivitySteps, setDailyActivitySteps] = useState(13453);
  const [dailyTargetSteps] = useState(30000);
  const [score, setScore] = useState({});
  const [email,setEmail] = useState("");
  const [username, setUsername] = useState("");

  const audioRecorder = useRef(new Audio.Recording());
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(tabItemWidth)).current;
  

  useEffect(() => {
    if (isFocused) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isFocused, fadeAnim]);

  useEffect(() => {
    // Fetch email from Async Storage
    const fetchEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail) {
          setEmail(storedEmail);
        } else {
          console.error('No email found in Async Storage');
        }
      } catch (error) {
        console.error('Error fetching email from Async Storage:', error);
      }
    };

    fetchEmail();
  }, []);

  useEffect(() => {
    if (email) {
      const fetchUserData = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('avg_scores, username, tasks_completed')
            .eq('email', email)
            .single();

          if (error) {
            console.error('Error fetching user data:', error.message);
            return;
          }

          setTasksCompleted(data.tasks_completed || 0);
          setUsername(data.username);
          setScore(data.avg_scores);
        } catch (err) {
          console.error('Unexpected error:', err);
        }
      };

      fetchUserData();
    }
  }, [email]);

  const startRecording = async () => {
    setRecording(true);
    await record(audioRecorder);
  };

  const stopRecording = async () => {
    setRecording(false);
    setLoading(true);
    try {
      const speechTranscription = await transcribe(audioRecorder);
      if (speechTranscription) {
        const response = await fetch('http://192.168.192.222:8000/resp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: speechTranscription,
            email: "dummyuser@example.com"
          })
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const responseText = data.response;

        await playResponse(responseText);
      }
    } catch (err) {
      console.log("ERROR: ", err);
    }
    finally{
      setLoading(false)
    }
  };

  const playResponse = async (text: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      setIsPlaying(true);
      const sound = await getAudio(text);
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const DATA = [
    {
      id: 1,
      name: "Content",
      backgroundColor: "#FF6B6B",
      icon: "book-outline",
      value: score.content || 0,
    },
    {
      id: 2,
      name: "Fluency",
      backgroundColor: "#4ECDC4",
      icon: "speedometer-outline",
      value: score.fluency || 0,
    },
    {
      id: 3,
      name: "Expression",
      backgroundColor: "#FFD93D",
      icon: "happy-outline",
      value: score.expression || 0,
    },
  ];

  const renderPerformanceItem = ({ item }) => (
    <View style={[styles.performanceItem, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.iconContainer}>
        <Ionicons name={item.icon} size={30} color="#FFF" />
      </View>
      <Text style={styles.performanceValue}>{item.value}/10</Text>
      <Text style={styles.performanceLabel}>{item.name}</Text>
    </View>
  );

  const handleTabPress = (tabName: string, index: number) => {
      setActiveTab(tabName);
  
      Animated.spring(indicatorAnim, {
        toValue: index * tabItemWidth,
        useNativeDriver: true,
      }).start();
  
      if (tabName === 'Home') {
        navigation.navigate('Home');
      } else if (tabName === 'Tasks') {
        navigation.navigate('Tasks');
      }
      else if (tabName === 'Profile'){
      navigation.navigate('Profile')
    }
    };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.topView}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeMessage}>
              {"Hello, \n" + username}
            </Text>
            <Text style={styles.publicSpeakingText}>
            Master the art of impactful eloquence.!
            </Text>

          </View>
        </View>

        <View style={styles.bottomView}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Tasks</Text>
              <Text style={styles.statValue}>{tasks_completed}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Target</Text>
              <Text style={styles.statValue}>{targetTasks}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{(score.content + score.expression + score.fluency)/3}</Text>
            </View>
            
          </View>

          <Text style={styles.sectionTitle}>Your Performance</Text>
          <FlatList
            data={DATA}
            renderItem={renderPerformanceItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.performanceList}
          />
        </View>
      </Animated.ScrollView>

      <View style={styles.floatingNavContainer}>
        {['home', 'list', 'person'].map((icon, index) => (
          <TouchableOpacity
            key={icon}
            style={styles.floatingNavItem}
            onPress={() => handleTabPress(icon === 'home' ? 'Home' : icon === 'list' ? 'Tasks' : 'Profile', index)}
          >
            <Ionicons 
              name={icon}
              size={25} 
              color={index === 0 ? ACCENTCOLOR : "#BDBEC1"} 
            />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onLongPress={startRecording}
        onPressOut={stopRecording}
        style={styles.botButton}
      >
        {recording ? (
          <BotRecording />
        ) : isPlaying ? (
          <BotSpeaking />
        ) : (
          <Bot />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SECONDARYCOLOR,
  },
  container: {
    flex: 1,
  },
  topView: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 100,
    backgroundColor: PRIMARYCOLOR,
  },
  welcomeContainer: {
    flex: 1, // Makes the container fill the available space
    justifyContent: 'center', // Vertically center the content
    alignItems: 'flex-start', // Align items to the left
    paddingLeft: 5, // Add padding for better spacing from the left edge
  },
  
  welcomeMessage: {
    color: SECONDARYCOLOR,
    fontSize: 32, // Prominent size for the welcome message
    fontWeight: 'bold',
    transform: [{ translateY: 25 }], // Move the text 5px down
  },
  
  publicSpeakingText: {
    color: 'rgba(255, 255, 255, 0.45)', // Subtle contrast for supporting text
    fontSize: 18,
    fontWeight: 'normal',
    marginTop: 25, // Add spacing between the texts
  },
  
  
  
  
  bottomView: {
    flex: 1,
    backgroundColor: SECONDARYCOLOR,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 100, 
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: SECONDARYCOLOR,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    elevation: 5,
    shadowColor: PRIMARYCOLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PRIMARYCOLOR,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARYCOLOR,
    marginBottom: 15,
  },
  performanceList: {
    paddingBottom: 15,
  },
  performanceItem: {
    width: windowWidth -277,
    borderRadius: 15,
    padding: 8,
    alignItems: 'center',
    marginRight: 7,
    elevation: 5,
    shadowColor: PRIMARYCOLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: SECONDARYCOLOR,
    marginVertical: 5,
  },
  performanceLabel: {
    fontSize: 14,
    color: SECONDARYCOLOR,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  botButton: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: PRIMARYCOLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});