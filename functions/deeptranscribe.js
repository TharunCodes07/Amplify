// import { createClient } from '@deepgram/sdk';
// import { Audio } from 'expo-av';
// import * as FileSystem from 'expo-file-system';
// import { Platform } from 'react-native';
// import { base64ToFile } from './toFile';
// import { GROQ_API_KEY } from '@env';

// const transcribe = async (audioRecorder) => {
//     await Audio.setAudioModeAsync({
//         allowsRecordingIOS: false,
//         playsInSilentModeIOS: false,
//     });
    
//     const isPrepared = await audioRecorder.current._canRecord;
//     if(!isPrepared){
//         console.log('not prepared');
//         return undefined;
//     }
    
//     await audioRecorder.current.stopAndUnloadAsync();
//     const recordingUri = audioRecorder.current.getURI() || '';
//     const base64Uri = await FileSystem.readAsStringAsync(recordingUri, {
//         encoding: FileSystem.EncodingType.Base64
//     });

//     if(!base64Uri || base64Uri === ''){
//         console.log("ERROR: No recording found");
//         return undefined;
//     }
//     const audioFile = await base64ToFile(base64Uri);


//   const deepgramApiKey = '2ba616301f2749c7d9356af089e437e28b3b8055';
//   // Example filename: index.js

// const { createClient, LiveTranscriptionEvents } =require("@deepgram/sdk");
// const fetch = require("cross-fetch");
// const dotenv = require("dotenv");
// dotenv.config();

// // URL for the realtime streaming audio you would like to transcribe
// const url = "http://stream.live.vc.bbcmedia.co.uk/bbc_world_service";

// const live = async () => {
//   // STEP 1: Create a Deepgram client using the API key
//   const deepgram = createClient(deepgramApiKey);

//   // STEP 2: Create a live transcription connection
//   const connection = deepgram.listen.live({
//     model: "nova-2",
//     language: "en-US",
//     smart_format: true,
//   });

//   // STEP 3: Listen for events from the live transcription connection
//   connection.on(LiveTranscriptionEvents.Open, () => {
//     connection.on(LiveTranscriptionEvents.Close, () => {
//       console.log("Connection closed.");
//     });

//     connection.on(LiveTranscriptionEvents.Transcript, (data) => {
//       console.log(data.channel.alternatives[0].transcript);
//     });

//     connection.on(LiveTranscriptionEvents.Metadata, (data) => {
//       console.log(data);
//     });

//     connection.on(LiveTranscriptionEvents.Error, (err) => {
//       console.error(err);
//     });

//     // STEP 4: Fetch the audio stream and send it to the live transcription connection
//     fetch(url)
//       .then((r) => r.body)
//       .then((res) => {
//         res.on("readable", () => {
//           connection.send(res.read());
//         });
//       });
//   });
// };


// export default transcribe;
