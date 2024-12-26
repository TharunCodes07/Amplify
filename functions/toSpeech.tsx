import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const getAudio = async (text:string) => {
  const DEEPGRAM_URL = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";
  const DEEPGRAM_API_KEY = "2ba616301f2749c7d9356af089e437e28b3b8055";
  const uri = `${FileSystem.cacheDirectory}temp_${Date.now()}.wav`;
  console.log("text :",text)
  try {
    const response = await fetch(DEEPGRAM_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({"text" :  text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch audio from Deepgram:', response.status, errorText);
      throw new Error(`Failed to fetch audio: ${response.status} ${errorText}`);
    }

    const audioData = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioData)));

    await FileSystem.writeAsStringAsync(uri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const sound = new Audio.Sound();
    await sound.loadAsync({ uri });
    await sound.playAsync();

    // Clean up the temporary file after playing
    await FileSystem.deleteAsync(uri, { idempotent: true });

    return sound;
  } catch (error) {
    console.error('Error in getAudio function:', error);
    throw error;
  }
};

export default getAudio;
