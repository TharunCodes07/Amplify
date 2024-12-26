import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

export const base64ToFile = async (base64Data: string) => {
    // Always use mp3 as it's supported by the API
    const tempFilePath = `${FileSystem.cacheDirectory}audio_${Date.now()}.mp3`;
    
    try {
        await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64
        });
        
        return {
            uri: tempFilePath,
            type: 'audio/mp3',
            name: `audio_${Date.now()}.mp3`
        };
    } catch (error) {
        console.error('Error creating file:', error);
        throw error;
    }
};
