import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../constants/Supabase';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import Markdown from 'react-native-markdown-display';
import AsyncStorage from '@react-native-async-storage/async-storage'


interface Task {
  task: string;
  status: string;
}

interface ViewTaskProps {
  route: {
    params: {
      taskId: string;
    };
  };
}

const API_BASE_URL = 'http://192.168.192.222:8000';
const UPLOAD_TIMEOUT = 30000; // 30 seconds

export default function ViewTask({ route }: ViewTaskProps) {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [completed, setCompleted] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email,setEmail] = useState("");
  

  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = true;
    if (completed) player.play();
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });


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
    const fetchTask = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('task, completed, host_url')
          .eq('task_id', taskId)
          .single();

        if (error) {
          console.error('Error fetching task:', error.message);
          return;
        }

        setTask({
          task: data.task,
          status: data.completed ? 'Completed' : 'Pending',
        });
        setCompleted(data.completed);
        setVideoUrl(data.host_url || '');
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('Error', 'Failed to fetch task details');
      }
    };

    fetchTask();
  }, [taskId]);

  const selectAndUploadVideo = async () => {
    try {
      setUploading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setUploading(false);
        return;
      }

      const asset = result.assets[0];

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: 'video/mp4',
        name: asset.name || 'video.mp4',
      } as any);

      formData.append('task_id', taskId);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/upload_video/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setVideoUrl(`${API_BASE_URL}/video/${taskId}.mp4?t=${Date.now()}`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Upload timed out. Please try again.');
      } else {
        setError(error.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const review = async () => {
    if (!task?.task) {
      Alert.alert('Error', 'No task content to review');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task: task?.task, task_id: String(taskId) , user_email: email}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate review');
      }

      const data = await response.json();
      if (data.status === 'success') {
        setVideoUrl(data.url);
        setCompleted(true);
      } else {
        throw new Error('Video generation failed');
      }
    } catch (error) {
      setError(error.message || 'An error occurred');
      Alert.alert('Error', 'Failed to generate review video');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {task ? (
          <View style={styles.taskContainer}>
            <Text style={styles.taskTitle}>Task Details</Text>
            <Markdown style={markdownStyles}>{task.task}</Markdown>
            <Text style={styles.status}>
              Status: <Text style={styles.statusValue}>{completed ? 'Completed' : 'Pending'}</Text>
            </Text>
          </View>
        ) : (
          <ActivityIndicator size="large" color="#000" />
        )}

        {!completed && !videoUrl && (
          <TouchableOpacity
            onPress={selectAndUploadVideo}
            style={[styles.button, styles.uploadButton, uploading && styles.buttonDisabled]}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              {uploading ? 'Uploading...' : 'Select & Upload Video'}
            </Text>
          </TouchableOpacity>
        )}

        {uploading && <ActivityIndicator style={styles.loader} size="large" color="#000" />}

        {!completed && videoUrl && (
          <TouchableOpacity
            onPress={review}
            style={[styles.button, styles.reviewButton, isGenerating && styles.buttonDisabled]}
            disabled={isGenerating}
          >
            <Text style={styles.buttonText}>
              {isGenerating ? 'Generating...' : 'Review Video'}
            </Text>
          </TouchableOpacity>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {completed && videoUrl && (
          <View style={styles.videoContainer}>
            <Text style={styles.videoTitle}>Your Video</Text>
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10
  },
  content: {
    padding: 20,
  },
  taskContainer: {
    marginBottom: 30,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  status: {
    fontSize: 16,
    marginTop: 15,
    color: '#666',
  },
  statusValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    marginTop: 20,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadButton: {
    backgroundColor: '#4a90e2',
  },
  reviewButton: {
    backgroundColor: '#50c878',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: '#ff3b30',
    marginTop: 10,
    textAlign: 'center',
  },
  videoContainer: {
    marginTop: 30,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

const markdownStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:"",
  },
  body: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginVertical: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  paragraph: {
    marginVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listItemContent: {
    flex: 1,
    marginLeft: 10,
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: '#4a90e2',
    textDecorationLine: 'underline',
  },
});

