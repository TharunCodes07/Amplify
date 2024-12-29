// import React, { useEffect, useState } from "react";
// import { View, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from "react-native";
// import { Text, Card, Button, useTheme } from "react-native-paper";
// import { supabase } from "../../constants/Supabase";
// import * as DocumentPicker from "expo-document-picker";
// import { useVideoPlayer, VideoView } from "expo-video";
// import { useEvent } from "expo";
// import Markdown from 'react-native-markdown-display';

// // ... (keep the existing interfaces and constants)

// export default function ViewTask({ route }: ViewTaskProps) {
//   // ... (keep the existing state and useEffect)

//   const theme = useTheme();

//   const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: theme.colors.background,
//       padding: 16,
//     },
//     card: {
//       marginBottom: 16,
//       elevation: 4,
//     },
//     taskText: {
//       fontSize: 18,
//       color: theme.colors.text,
//       marginBottom: 8,
//     },
//     status: {
//       fontSize: 16,
//       color: theme.colors.primary,
//       marginBottom: 16,
//     },
//     video: {
//       width: "100%",
//       height: 200,
//       marginTop: 16,
//       borderRadius: 8,
//       overflow: 'hidden',
//     },
//     buttonContainer: {
//       flexDirection: 'row',
//       justifyContent: 'space-around',
//       marginTop: 16,
//     },
//   });

//   return (
//     <ScrollView style={styles.container}>
//       <Card style={styles.card}>
//         <Card.Content>
//           {task ? (
//             <>
//               <Markdown style={markdownStyles}>{task.task}</Markdown>
//               <Text style={styles.status}>
//                 Status: {completed ? "Completed" : "Pending"}
//               </Text>
//             </>
//           ) : (
//             <ActivityIndicator size="large" color={theme.colors.primary} />
//           )}
//         </Card.Content>
//       </Card>

//       {!completed && !videoUrl && (
//         <Button
//           mode="contained"
//           onPress={selectAndUploadVideo}
//           loading={uploading}
//           disabled={uploading}
//           style={buttonStyles.floatingButton}
//         >
//           {uploading ? "Uploading..." : "Select & Upload Video"}
//         </Button>
//       )}

//       {!completed && videoUrl && (
//         <Button
//           mode="contained"
//           onPress={review}
//           loading={isGenerating}
//           disabled={isGenerating}
//           style={buttonStyles.floatingButton}
//         >
//           {isGenerating ? "Generating..." : "Review Video"}
//         </Button>
//       )}

//       {completed && videoUrl && (
//         <Card style={styles.card}>
//           <Card.Content>
//             <VideoView
//               style={styles.video}
//               player={player}
//               allowsFullscreen
//               allowsPictureInPicture
//             />
//           </Card.Content>
//         </Card>
//       )}

//       {error && (
//         <Text style={{ color: theme.colors.error, textAlign: 'center', marginTop: 16 }}>
//           {error}
//         </Text>
//       )}
//     </ScrollView>
//   );
// }

// const buttonStyles = StyleSheet.create({
//   floatingButton: {
//     marginVertical: 16,
//     elevation: 4,
//     borderRadius: 28,
//   },
// });

// const markdownStyles = {
//   body: {
//     color: '#333',
//   },
//   heading1: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     color: '#1a1a1a',
//   },
//   heading2: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 8,
//     color: '#333',
//   },
//   paragraph: {
//     marginBottom: 16,
//     lineHeight: 24,
//   },
//   list: {
//     marginBottom: 16,
//   },
//   listItem: {
//     marginBottom: 8,
//   },
//   listItemBullet: {
//     fontSize: 18,
//     lineHeight: 24,
//   },
// };

