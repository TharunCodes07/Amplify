import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Button } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { supabase } from '../../constants/Supabase';

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

export default function ViewTask({ route }: ViewTaskProps) {
  const [task, setTask] = useState<Task | null>(null);
  const { taskId } = route.params;
  const [videoUrl, setVideoUrl] = useState<string>(`generated_video.mp4`);
  const [completed, setCompleted] = useState<boolean>(true);

  const player = useVideoPlayer(videoUrl, player => {
    player.loop = false;
    player.play()
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('task, completed')
          .eq('task_id', taskId)
          .single();

        if (error) {
          console.error('Error fetching task:', error.message);
          return;
        }

        if (data.completed) {
          setCompleted(true);
        }
        setTask(data.task);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchTask();
  }, [taskId]);

  const review = async () => {
    try {
      const response = await fetch('http://192.168.192.222:8000/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: task?.task, video: `${taskId}` }),
      });

      if (response.ok) {
        const data = await response.json();
        setVideoUrl(`generated_video.mp4`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View>
          {task ? (
            <View>
              <Text style={styles.taskText}>{task}</Text>
              <Text style={styles.status}>
                Status: {completed ? 'Completed' : 'Pending'}
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#000" />
          )}{!completed && (
          <TouchableOpacity onPress={review} style={styles.reviewButton}>
            <Text style={styles.buttonText}>Review your video</Text>
          </TouchableOpacity>)}

          {completed && (
            <View>
              <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
              />
              <View style={styles.controlsContainer}>
                <Button
                  title={isPlaying ? 'Pause' : 'Play'}
                  onPress={() => {
                    if (isPlaying) {
                      player.pause();
                    } else {
                      player.play();
                    }
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  taskText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  status: {
    fontSize: 16,
    marginTop: 10,
    color: '#555',
  },
  reviewButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#6200EE',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  video: {
    width: '100%',
    height: 200,
    marginTop: 20,
  },
  controlsContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
});
