import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {uploadVideoProtocol} from '../services/ApiService';
import {saveFile, savePdf} from '../services/StorageService';
import {saveProtocol} from '../services/ProtocolStorage';
import {useNavigation} from '@react-navigation/native';

const VideoProtocolScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [videoPath, setVideoPath] = useState(null);
  const camera = useRef(null);
  const device = useCameraDevice('back');
  const navigation = useNavigation();

  React.useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.CAMERA,
        ios: PERMISSIONS.IOS.CAMERA,
      });

      const result = await request(permission);
      setHasPermission(result === RESULTS.GRANTED);
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Ошибка', 'Не удалось запросить разрешение на камеру');
    }
  };

  const startRecording = async () => {
    if (!camera.current || !device) {
      Alert.alert('Ошибка', 'Камера не готова');
      return;
    }

    try {
      setIsRecording(true);
      const file = await camera.current.startRecording({
        flash: 'off',
        onRecordingFinished: (video) => {
          setVideoPath(video.path);
          setIsRecording(false);
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          Alert.alert('Ошибка', 'Не удалось записать видео');
          setIsRecording(false);
        },
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Ошибка', 'Не удалось начать запись');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (camera.current) {
      await camera.current.stopRecording();
    }
  };

  const uploadVideo = async () => {
    if (!videoPath) {
      Alert.alert('Ошибка', 'Видео не записано');
      return;
    }

    try {
      setIsUploading(true);

      // Сохраняем видео локально
      const fileName = `video_${Date.now()}.mp4`;
      const savedPath = await saveFile(videoPath, fileName);

      // Отправляем на API
      const response = await uploadVideoProtocol(savedPath);

      if (response.success) {
        // Сохраняем PDF
        const pdfFileName = `protocol_${response.protocol_id}.pdf`;
        try {
          await savePdf(response.pdf_url, pdfFileName, response.protocol_id);
        } catch (pdfError) {
          console.warn('Failed to save PDF immediately, will download later:', pdfError);
        }

        // Сохраняем протокол
        await saveProtocol({
          protocol_id: response.protocol_id,
          protocolNumber: response.protocolNumber,
          date: response.date,
          type: 'video',
          pdfPath: pdfFileName,
          pdf_url: response.pdf_url,
        });

        Alert.alert('Успех', 'Протокол успешно создан и отправлен', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              navigation.navigate('ProtocolsList');
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('Ошибка', 'Не удалось отправить протокол');
    } finally {
      setIsUploading(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Требуется разрешение на использование камеры</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Камера не найдена</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        video={true}
        audio={true}
      />

      <View style={styles.controls}>
        {!videoPath ? (
          <>
            {!isRecording ? (
              <TouchableOpacity
                style={[styles.button, styles.recordButton]}
                onPress={startRecording}>
                <Icon name="fiber-manual-record" size={50} color="#FF0000" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={stopRecording}>
                <Icon name="stop" size={50} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.videoReadyText}>Видео записано</Text>
            <TouchableOpacity
              style={[styles.button, styles.uploadButton]}
              onPress={uploadVideo}
              disabled={isUploading}>
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="cloud-upload" size={30} color="#FFFFFF" />
                  <Text style={styles.uploadButtonText}>Отправить</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={() => setVideoPath(null)}>
              <Icon name="refresh" size={30} color="#FFFFFF" />
              <Text style={styles.retakeButtonText}>Перезаписать</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 50,
    marginVertical: 10,
  },
  recordButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stopButton: {
    backgroundColor: '#FF0000',
  },
  uploadButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  retakeButton: {
    backgroundColor: '#666',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  retakeButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
  },
  videoReadyText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 10,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default VideoProtocolScreen;

