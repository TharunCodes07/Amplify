import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native';

export default function TaskDetails() {
  const { taskId } = useLocalSearchParams();
  console.log(useLocalSearchParams());


  return (
    <View>
      <Text style={styles.text}>Task ID: {taskId}</Text>
      {/* Fetch and display task details using taskId */}
    </View>
  );
}

const styles = StyleSheet.create({
  text : {
    backgroundColor: '#fff',
  }
});
