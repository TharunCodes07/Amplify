import React, { useState, useEffect, useRef } from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated, Platform, SafeAreaView, ImageBackground} from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';;
import { Audio } from 'expo-av';
import record from '@/functions/record';
import transcribe from '@/functions/transcribe';
import getAudio from '@/functions/toSpeech';
import Bot from '../components/Bot';
import BotRecording from '../components/BotRecording';
import BotSpeaking from '../components/BotSpeaking';
import { supabase } from '../constants/Supabase';


interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;
const statusBarHeight = Platform.OS === 'ios' ? 40 : 20;
const bottomPadding = Platform.OS === 'ios' ? 34 : 20;
const tabWidth = windowWidth * 0.8;
const tabHeight =  70; // Reduced size to 3/4th
const tabOffset = (windowWidth - tabWidth) / 2;
const tabItemWidth = tabWidth / 3;


export default function HomeScreen({ navigation }:any) {
  const isFocused = useIsFocused();
  const targetTasks = 100;
  const [dailyActivitySteps, setDailyActivitySteps] = useState(13453);
  const dailyTargetSteps = 30000;

  const whiteBgAnim = useRef(new Animated.Value(0)).current;
  const blackBgAnim = useRef(new Animated.Value(0)).current;
  const jiggleAnim = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [progressFill, setProgressFill] = useState(0);


  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRecorder = useRef<Audio.Recording>(new Audio.Recording());
  const [transcription, setTranscription] = useState<string>("");
  // const [chats, setChats] = useState<ChatMessage[]>([]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [email, setEmail] = useState<string>("dummyuser@example.com");
  const [score, setScore] = useState<{}>({});
  const [tasks_completed, setTasksCompleted] = useState<number>(0);
  const [username, setUsername] = useState<string>("");


  useEffect(() => {
    if (isFocused) {
      setActiveTab('Home');
      Animated.spring(indicatorAnim, {
        toValue: 0 * tabItemWidth, // Set to 'Home' tab index
        useNativeDriver: true,
      }).start();
    }
  }, [isFocused]);
  

  useEffect(() => {
    const fetchUsernameByEmail = async  () => {
        try {
          const { data, error } = await supabase
            .from('users') 
            .select('avg_scores , username, tasks_completed')
            .eq('email', email) 
            .single();
          if (error) {
            console.error('Error fetching username:', error.message);
            return;
          }
          setTasksCompleted(data.tasks_completed || 0);
          setUsername(data.username);
          setScore(data.avg_scores);
        } catch (err) {
          console.error('Unexpected error:', err);
        } finally {
          setLoading(false);
        }
    }
    fetchUsernameByEmail();
  },[]);
  // useEffect(() => {
  //   const initializeChat = async () => {
  //     setLoading(true);
  //     try {
  //       const resp = await fetch('http://192.168.192.222:8000/resp', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify({
  //           query: "",
  //           email:"dummyuser@example.com"
  //         }) 
  //       });

  //       if (!resp.ok) {
  //         throw new Error('Network response was not ok'); 
  //       }
  //       const data = await resp.json();
  //       const responseText = data.response;

        
  //       setChats(prevChats => [...prevChats, {
  //         role: 'assistant',
  //         content: responseText
  //       }]);

  //       await playResponse(responseText);

  //     } catch (error) {
  //       console.error('Error initializing chat:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   initializeChat();
  // }, []);

  const startRecording = async () => {
    setRecording(true);
    await record(audioRecorder);
  }
  
  const stopRecording = async () => {
    setRecording(false);
    setLoading(true);
    try {
      const speechTranscription = await transcribe(audioRecorder);
      setTranscription(speechTranscription as string);

      if (speechTranscription) {
        
        
        const response = await fetch('http://192.168.192.222:8000/resp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: speechTranscription,
            email:"dummyuser@example.com"
            
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
    } finally {
      setLoading(false);
    }
  }

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


  // Floating Tab Bar State and Animation
  const [activeTab, setActiveTab] = useState('Home');
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const calculatedProgress = (tasks_completed / targetTasks) * 100;

    if (isFocused && activeTab === 'Home') {
      progressAnimation.setValue(0);
      whiteBgAnim.setValue(0);
      blackBgAnim.setValue(0);
      jiggleAnim.setValue(0);

      Animated.timing(progressAnimation, {
        toValue: calculatedProgress,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      Animated.timing(whiteBgAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.delay(200),
        Animated.timing(blackBgAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(jiggleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(jiggleAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }

    const progressListener = progressAnimation.addListener(({ value }) => {
      setProgressFill(value);
    });

    return () => {
      progressAnimation.removeListener(progressListener);
    };
  }, [tasks_completed]);

  const handleBoostLimit = () => {
    // Handle boost limit logic
  };

  const whiteBgAnimationStyle = {
    transform: [
      {
        translateY: whiteBgAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [windowHeight, 0],
        }),
      },
      {
        translateY: jiggleAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -5, 0],
        }),
      },
    ],
  };

  const blackBgAnimationStyle = {
    transform: [
      {
        translateY: blackBgAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-windowHeight, 0],
        }),
      },
      {
        translateY: jiggleAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 5, 0],
        }),
      },
    ],
  };

  // Floating Tab Bar Logic
  const handleTabPress = (tabName: string, index: number) => {
    setActiveTab(tabName);
    Animated.spring(indicatorAnim, {
      toValue: index * tabItemWidth,
      useNativeDriver: true,
    }).start();
  
    // Navigate to the corresponding screen
    if (tabName === 'Home') {
      navigation.navigate('Home');
    } else if (tabName === 'Tasks') {
      navigation.navigate('Tasks');
    }
  };
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, { paddingTop: statusBarHeight }]}>
        <Animated.View style={[styles.blackBackground, blackBgAnimationStyle]}>
          <ImageBackground
            source={require('../assets/images/2.webp')}
            style={styles.imageBackground}
            resizeMode="cover"
          >
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary Challenge</Text>
              <AnimatedCircularProgress
                size={windowWidth * 0.6}
                width={20}
                fill={progressFill}
                tintColor="#90EE90"
                backgroundColor="#3d3d3d"
                rotation={-90}
                lineCap="round"
                arcSweepAngle={180}
              >
                {() => (
                  <View style={styles.progressTextContainer}>
                    <Text style={styles.stepsText}>{tasks_completed}</Text>
                    <Text style={styles.targetText}>Tasks of {targetTasks}</Text>
                  </View>
                )}
              </AnimatedCircularProgress>
            </View>
          </ImageBackground>
        </Animated.View>

        <Animated.View style={[styles.whiteBackground, whiteBgAnimationStyle]}>
          <View style={styles.infoContainer}>
            <View style={[styles.infoBox, { backgroundColor: '#ADD8E6' }]}>
              <Text style={styles.infoIcon}>👟</Text>
              <Text style={styles.infoValue}>{score.content}</Text>
              <Text style={styles.infoLabel}>Content</Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: '#E0B0FF' }]}>
              <Text style={styles.infoIcon}>🚶</Text>
              <Text style={styles.infoValue}>{score.fluency}</Text>
              <Text style={styles.infoLabel}>Fluency</Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: '#FFFF66' }]}>
              <Text style={styles.infoIcon}>🔥</Text>
              <Text style={styles.infoValue}>{score.expression}</Text>
              <Text style={styles.infoLabel}>Expression</Text>
            </View>
          </View>
          <View style={styles.dailyActivityContainer}>
            <Text style={styles.dailyActivityTitle}>
              Your in-app daily activity
            </Text>
            <Text style={styles.dailyActivityStepsText}>
              {dailyActivitySteps} / {dailyTargetSteps} steps
            </Text>
            <TouchableOpacity
              style={styles.boostButton}
              onPress={handleBoostLimit}
            >
              <Text style={styles.boostIcon}>🚀</Text>
              <Text style={styles.boostText}>Boost limit</Text>
              <Text style={styles.boostArrow}>>></Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Floating Tab Bar */}
        <View style={styles.tabBarContainer}>
          <Animated.View
            style={[
              styles.indicator,
              {
                transform: [
                  {
                    translateX: indicatorAnim,
                  },
                ],
              },
            ]}
          />

          {['Home', 'Tasks', 'Profile'].map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab, index)}
            >
              <Ionicons
                name={
                  tab === 'Home'
                    ? 'home'
                    : tab === 'Profile'
                    ? 'person'
                    : 'list'
                }
                size={24}
                color={activeTab === tab ? '#000' : '#fff'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View>
          <TouchableOpacity
            onLongPress={startRecording}
            onPressOut={stopRecording}
            style={styles.botContainer}
          >
            {recording ? (
              <BotRecording />
            ) : isPlaying ? (
              <BotSpeaking />
            ) : (
              <Bot />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    // backgroundColor: '#121212', // Set a background color for the safe area
  },
  container: {
    flex: 1,
  },
  blackBackground: {
    height: windowHeight * 0.5, // Adjust height as needed
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    // paddingTop: statusBarHeight, // Add padding to avoid status bar overlap
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  summaryContainer: {
    alignItems: 'center',
    marginTop: 25,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 50,
  },
  progressTextContainer: {
    alignItems: 'center',
  },
  stepsText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  targetText: {
    color: '#fff',
    fontSize: 18,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 35,
    paddingHorizontal: 20,
  },
  infoBox: {
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    width: windowWidth * 0.28,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  infoValue: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoLabel: {
    color: '#000',
    fontSize: 14,
  },
  dailyActivityContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  dailyActivityTitle: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dailyActivityStepsText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },
  boostIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  boostText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  boostArrow: {
    marginLeft: 'auto',
    color: '#000',
    fontSize: 18,
  },
  // Floating Tab Bar Styles
  tabBarContainer: {
    position: 'absolute',
    bottom: 15,
    left: tabOffset,
    width: tabWidth,
    height: tabHeight,
    backgroundColor: '#121212',
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  indicator: {
    position: 'absolute',
    bottom: 17,
    left: 9,
    width: tabItemWidth - 17,
    height: 50 * 0.75,
    backgroundColor: '#fff',
    borderRadius: 25,
    zIndex: -1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    marginTop: 5,
    fontSize: 12 * 0.75, // Reduced font size proportionally
    fontWeight: 'bold',
  },
  botContainer: {
    position: 'absolute',
    bottom: 70,
    left: 30,
    // Adjust as needed to center the bot
  },
});