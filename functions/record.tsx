import { View, Text } from 'react-native'
import React from 'react'
import { Audio } from 'expo-av';

const record = async (audioRecorder: React.MutableRefObject<Audio.Recording>) => {
  try{
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
    });
    const doneRecording = audioRecorder.current._isDoneRecording;
    if(doneRecording){
        audioRecorder.current = new Audio.Recording();
    }

    const permission = await Audio.requestPermissionsAsync();
    if(permission.status === 'granted'){
        const recStatus = await audioRecorder.current.getStatusAsync();
        if(!recStatus.canRecord){
            const recOptions = {
                ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
                android: {
                    extension: '.mp3',
                    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                    audioEncoder: Audio.AndroidAudioEncoder.AAC,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.mp3',
                    audioQuality: Audio.IOSAudioQuality.HIGH,
                    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                }
            }
            await audioRecorder.current.prepareToRecordAsync(recOptions);
        }
        await audioRecorder.current.startAsync();
    }
    else{
        console.log('permission denied');
    }
  }
  catch (e){
    console.log(e);
  }
}

export default record