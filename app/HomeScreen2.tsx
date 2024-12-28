import React from 'react';
import { COLORS, FONTS, GlobalStyles } from '../constants/Colors';
import {StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated, Platform, SafeAreaView, ImageBackground,ScrollView} from 'react-native'; 
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
import {useState,useEffect,useRef} from 'react';
import { InfoBox } from '@/components/InfoBox';
import { TabBarButton } from '@/components/TabBarButton';

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

export default function HomeScreen({ navigation }) {
  // ... (keep existing state and logic)
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
    <SafeAreaView style={GlobalStyles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome, <Text style={styles.boldText}>{username}</Text></Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={32} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Task Progress</Text>
          <AnimatedCircularProgress
            size={200}
            width={15}
            fill={progressFill}
            tintColor={COLORS.primary}
            backgroundColor={COLORS.border}
            rotation={180}
            lineCap="round"
            arcSweepAngle={180}
          >
            {() => (
              <View style={styles.progressTextContainer}>
                <Text style={styles.progressText}>{tasks_completed}</Text>
                <Text style={styles.targetText}>/ {targetTasks}</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        <View style={styles.infoContainer}>
          <InfoBox icon="📝" value={score.content} label="Content" />
          <InfoBox icon="🗣️" value={score.fluency} label="Fluency" />
          <InfoBox icon="🎭" value={score.expression} label="Expression" />
        </View>

        <View style={styles.activityContainer}>
          <Text style={styles.activityTitle}>Daily Activity</Text>
          <Text style={styles.activitySteps}>
            <Text style={styles.boldText}>{dailyActivitySteps}</Text> / {dailyTargetSteps} steps
          </Text>
          <TouchableOpacity style={styles.boostButton} onPress={handleBoostLimit}>
            <Text style={styles.boostText}>Boost Limit</Text>
            <Ionicons name="rocket" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.tabBarContainer}>
        <LinearGradient
          colors={[COLORS.background, 'rgba(255,255,255,0.8)']}
          style={styles.tabBarGradient}
        >
          <TabBarButton icon="home" label="Home" isActive={activeTab === 'Home'} onPress={() => handleTabPress('Home', 0)} />
          <TabBarButton icon="list" label="Tasks" isActive={activeTab === 'Tasks'} onPress={() => handleTabPress('Tasks', 1)} />
          <TabBarButton icon="person" label="Profile" isActive={activeTab === 'Profile'} onPress={() => handleTabPress('Profile', 2)} />
        </LinearGradient>
      </View>

      <TouchableOpacity
        onLongPress={startRecording}
        onPressOut={stopRecording}
        style={styles.botContainer}
      >
        <ChatBot isRecording={recording} isSpeaking={isPlaying} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    ...GlobalStyles.heading,
  },
  boldText: {
    ...GlobalStyles.boldText,
  },
  summaryContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: {
    ...GlobalStyles.subheading,
    marginBottom: 16,
  },
  progressTextContainer: {
    alignItems: 'center',
    marginTop: -20,
  },
  progressText: {
    ...GlobalStyles.boldText,
    fontSize: 36,
  },
  targetText: {
    ...GlobalStyles.text,
    fontSize: 18,
    color: COLORS.textTertiary,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityTitle: {
    ...GlobalStyles.subheading,
  },
  activitySteps: {
    ...GlobalStyles.text,
    fontSize: 16,
    marginBottom: 8,
  },
  boostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.buttonBackground,
    padding: 12,
    borderRadius: 8,
  },
  boostText: {
    ...GlobalStyles.boldText,
    marginRight: 8,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  tabBarGradient: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 30,
    padding: 8,
  },
  botContainer: {
    position: 'absolute',
    left: 16,
    bottom: 80,
    zIndex: 1000,
  },
});

