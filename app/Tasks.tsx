import { FlatList, StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../constants/Supabase';
import { Ionicons } from '@expo/vector-icons';
import record from '@/functions/record';
import { Audio } from 'expo-av';
import transcribe from '@/functions/transcribe';
import getAudio from '@/functions/toSpeech';
import Bot from '../components/TaskBot';
import BotRecording from '../components/TaskRecording';
import BotSpeaking from '../components/TaskSpeaking';
// import {router} from 'expo-router';
import { useIsFocused } from '@react-navigation/native';



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

export default function Tasks({ navigation }: any) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRecorder = useRef<Audio.Recording>(new Audio.Recording());
  const [transcription, setTranscription] = useState<string>("");
  const soundRef = useRef<Audio.Sound | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState('Tasks');
  const indicatorAnim = useRef(new Animated.Value(tabItemWidth)).current;
  const isFocused = useIsFocused();


  useEffect(() => {
      if (isFocused) {
        setActiveTab('Tasks');
        Animated.spring(indicatorAnim, {
          toValue: 1 * tabItemWidth, // Set to 'Home' tab index
          useNativeDriver: true,
        }).start();
      }
    }, [isFocused]);

  const startRecording = async () => {
    setRecording(true);
    await record(audioRecorder);
  };

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

  const renderTasks = ({ item }: { item: Task }) => {
    const trimmedTask =
      item.task.split(' ').slice(0, 5).join(' ') +
      (item.task.split(' ').length > 5 ? '...' : '');


  
    return (
      <TouchableOpacity
        style={styles.taskContainer}
        onPress={() => {
          console.log(`/viewTask/${item.task_id}`)}}
      >
        <Text style={styles.taskTitle}>{trimmedTask}</Text>
        <View style={styles.taskStatusContainer}>
          <Text style={[styles.taskStatus, item.completed ? styles.completed : styles.pending]}>
            {item.completed ? 'Completed' : 'Pending'}
          </Text>
        </View>
        {item.score && (
          <Text style={styles.taskScore}>Score: {JSON.stringify(item.score)}</Text>
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
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tasks</Text>
      <FlatList
        data={tasks}
        renderItem={renderTasks}
        keyExtractor={(item) => item.task_id.toString()}
        style={styles.taskList}
      />

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

      {/* Bot Interaction */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40, // Add padding for status bar
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    marginLeft: 20,
    marginTop: 20,
  },
  taskList: {
    marginBottom: 100, // Add space for the floating tab bar
  },
  taskContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
    color: '#a9a9a9', // Slight gray
  },
  taskScore: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
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
  botContainer: {
    position: 'absolute',
    bottom: 50,
    left: windowWidth - 170,
  },
});