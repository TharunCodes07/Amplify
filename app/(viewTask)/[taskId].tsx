import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableNativeFeedbackComponent, TouchableOpacity } from 'react-native';
import { supabase } from '../../constants/Supabase';
import { marked } from 'marked';
import { Renderer } from 'marked';

// Type for the task object from Supabase
interface Task {
  task: string;
}

// Create a custom renderer for marked
const renderer = new Renderer();

// Override the default handling of bold text (**)
renderer.strong = (text: string) => `<bold>${text}</bold>`;

// Function to convert Markdown to formatted React Native Text components
const markdownToTextComponents = (markdown: string): JSX.Element[] | null => {
  if (!markdown) {
    return null;
  }

  // Convert Markdown to HTML using marked and the custom renderer
  const html = marked(markdown, { renderer });

  // Split the HTML into parts based on the <bold> tags
  const parts = html.split(/(<bold>.*?<\/bold>)/g);

  return parts.map((part, index) => {
    if (part.startsWith('<bold>')) {
      // Remove the <bold> tags and render as bold text
      return (
        <Text key={index} style={styles.boldText}>
          {part.replace(/<\/?bold>/g, '')}
        </Text>
      );
    } else {
      // Render as regular text
      return (
        <Text key={index} style={styles.text}>
          {part}
        </Text>
      );
    }
  });
};

interface ViewTaskProps {
  route: {
    params: {
      taskId: string;
    };
  };
}

export default function ViewTask({ route }: ViewTaskProps) {
  const [text, setText] = useState<string | null>('abc');
  const [task, setTask] = useState<string | null>(null);
  const { taskId } = route.params;
  const [video, setVideo] = useState<string | null>('abc');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data, error } = await supabase
          .from<Task>('tasks') // Specify the type here
          .select('task')
          .eq('task_id', taskId)
          .single();

        if (error) {
          console.error('Error fetching task:', error.message);
          return;
        }

        setTask(data?.task || '');
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchTask();
  }, [taskId]);

  const review = async () => {
    try{
      console.log("Reviewing")
      const resp = await fetch('http://192.168.192.222:8000/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({"text":text,"video": `${taskId}`})}
      )
      if (resp.ok) {
        const data = await resp.json();
        setVideo(data);
        console.log(data);}
      }
      
  catch (error) {
    console.error('Error:', error);
  }}

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          {task ? (
            <View style={styles.taskContainer}>
              {markdownToTextComponents(task)}
            </View>
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )}

          <TouchableOpacity onPress={review}>
            <Text>Review your video</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  taskContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
  },
  boldText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});