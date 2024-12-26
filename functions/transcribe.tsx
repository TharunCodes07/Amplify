import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { base64ToFile } from './toFile';
// import { GROQ_API_KEY } from '@env';



const transcribe = async (audioRecorder: React.MutableRefObject<Audio.Recording>) => {
    const GROQ_API_KEY="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"
    
    console.log(GROQ_API_KEY);

    await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
    });
    
    const isPrepared = await audioRecorder.current._canRecord;
    if(!isPrepared){
        console.log('not prepared');
        return undefined;
    }

    await audioRecorder.current.stopAndUnloadAsync();
    const recordingUri = audioRecorder.current.getURI() || '';
    const base64Uri = await FileSystem.readAsStringAsync(recordingUri, {
        encoding: FileSystem.EncodingType.Base64
    });

    if(!base64Uri || base64Uri === ''){
        console.log("ERROR: No recording found");
        return undefined;
    }

    
    const audioFile = await base64ToFile(base64Uri);
    const filename = audioFile.name;

    const formData = new FormData();
    formData.append('file', audioFile as any);
    formData.append('model', 'whisper-large-v3-turbo');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'multipart/form-data'
        },
        body: formData
    })
    .then((res: Response) => res.json())
    .catch((err: Error) => {
        console.log("ERROR res: ", err);
    });

    console.log("RESPONSE: ", response);
    
    if (!response || !response.text) {
        console.log("ERROR: No transcription found");
        return undefined;
    }

    return response.text;
};

export default transcribe;