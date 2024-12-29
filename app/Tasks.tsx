import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { supabase } from '../constants/Supabase';
import record from '@/functions/record';
import transcribe from '@/functions/transcribe';
import getAudio from '@/functions/toSpeech';
import Bot from '../components/TaskBot';
import BotRecording from '../components/TaskRecording';
import BotSpeaking from '../components/TaskSpeaking';
import Markdown from 'react-native-markdown-display';

const PRIMARYCOLOR = '#000000';
const SECONDARYCOLOR = '#FFFFFF';
const ACCENTCOLOR = '#35A2C1';

const windowWidth = Dimensions.get('window').width;
const tabWidth = windowWidth * 0.8;
const tabHeight = 70;
const tabOffset = (windowWidth - tabWidth) / 2;
const tabItemWidth = tabWidth / 3;

interface Task {
  task_id: number;
  user_id: number;
  task: string;
  completed: boolean;
  score: Record<string, any> | null;
}

export default function Tasks({navigation} : any) {
  const isFocused = useIsFocused();
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState('Tasks');

  const audioRecorder = useRef(new Audio.Recording());
  const soundRef = useRef<Audio.Sound | null>(null);
  const indicatorAnim = useRef(new Animated.Value(tabItemWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      setActiveTab('Tasks');
      Animated.spring(indicatorAnim, {
        toValue: 1 * tabItemWidth,
        useNativeDriver: true,
      }).start();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isFocused, indicatorAnim, fadeAnim]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          console.error('Error fetching Tasks:', error.message);
          return;
        }

        setTasks(data as Task[]);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchTasks();
  }, [userId]);

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
    } finally {
      setLoading(false);
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

  const renderTasks = ({ item }: { item: Task }) => {
    const trimmedTask =
      item.task.split(' ').slice(0, 5).join(' ') +
      (item.task.split(' ').length > 5 ? '...' : '');

    return (
      <TouchableOpacity
        style={styles.taskContainer}
        onPress={() => {
          navigation.navigate('ViewTask', { taskId: item.task_id });
        }}
      >
        <Markdown style={markdownStyles}>{trimmedTask}</Markdown>
        <View style={styles.taskStatusContainer}>
          <Text style={[styles.taskStatus, item.completed ? styles.completed : styles.pending]}>
            {item.completed ? 'Completed' : 'Pending'}
          </Text>
        </View>
        {item.score && (
          <Text style={styles.taskScore}>Content: {item.score.content}, Fluency: {item.score.fluency}, Expression: {item.score.expression}</Text>
        )}
      </TouchableOpacity>
    );
  };

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
    } else if (tabName === 'Profile'){
      navigation.navigate('Profile')
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.topView}>
          <Text style={styles.header}>Tasks</Text>
        </View>

        <View style={styles.bottomView}>
          <FlatList
            data={tasks}
            renderItem={renderTasks}
            keyExtractor={(item) => item.task_id.toString()}
            style={styles.taskList}
          />
        </View>

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
                color={activeTab === (icon === 'home' ? 'Home' : icon === 'list' ? 'Tasks' : 'Profile') ? ACCENTCOLOR : "#BDBEC1"} 
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
      </Animated.View>
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
    paddingBottom: 54,
    backgroundColor: PRIMARYCOLOR,
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
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SECONDARYCOLOR,
    marginBottom: 20,
  },
  taskList: {
    marginBottom: 100,
  },
  taskContainer: {
    backgroundColor: SECONDARYCOLOR,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: PRIMARYCOLOR,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskStatusContainer: {
    marginTop: 5,
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  completed: {
    color: 'green',
  },
  pending: {
    color: ACCENTCOLOR,
  },
  taskScore: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
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
    left: 280,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: PRIMARYCOLOR,
    fontSize: 18,
    fontWeight: '600',
  },
  paragraph: {
    marginVertical: 0,
  },
});

