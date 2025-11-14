import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {uploadPhotoProtocol} from '../services/ApiService';
import {saveFile, savePdf} from '../services/StorageService';
import {saveProtocol} from '../services/ProtocolStorage';
import {useNavigation} from '@react-navigation/native';

const PhotoProtocolScreen = () => {
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const camera = useRef(null);
  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, []);

  const takePhoto = async () => {
    if (!camera.current || !device) {
      Alert.alert('Ошибка', 'Камера не готова');
      return;
    }

    try {
      const photo = await camera.current.takePhoto({
        flash: 'off',
      });
      setPhotos([...photos, `file://${photo.path}`]);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Ошибка', 'Не удалось сделать фото');
    }
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы одно фото');
      return;
    }

    try {
      setIsUploading(true);

      // Сохраняем фото локально
      const savedPaths = [];
      for (const photoUri of photos) {
        const fileName = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const savedPath = await saveFile(photoUri, fileName);
        savedPaths.push(savedPath);
      }

      // Отправляем на API
      const response = await uploadPhotoProtocol(savedPaths);

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
          type: 'photo',
          pdfPath: pdfFileName,
          pdf_url: response.pdf_url,
          photoCount: photos.length,
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
      console.error('Error uploading photos:', error);
      const errorMessage = error.message || 'Не удалось отправить протокол';
      Alert.alert(
        'Ошибка',
        errorMessage.includes('Network') 
          ? 'Ошибка сети. Проверьте подключение к интернету и что API сервер запущен на http://192.168.1.57:5001'
          : errorMessage
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Требуется разрешение на использование камеры</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Запросить разрешение</Text>
        </TouchableOpacity>
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
      {showCamera ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={camera}
            style={styles.camera}
            device={device}
            isActive={showCamera}
            photo={true}
          />
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePhoto}>
              <Icon name="camera-alt" size={40} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => setShowCamera(false)}>
              <Icon name="photo-library" size={30} color="#FFFFFF" />
              <Text style={styles.galleryButtonText}>Галерея ({photos.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.photosContainer}>
            {photos.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="photo-camera" size={80} color="#CCC" />
                <Text style={styles.emptyText}>Фото не добавлены</Text>
              </View>
            ) : (
              photos.map((uri, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{uri}} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto(index)}>
                    <Icon name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <View style={styles.controls}>
        {!showCamera && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCamera(true)}>
            <Icon name="add-a-photo" size={30} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Добавить фото</Text>
          </TouchableOpacity>
        )}

        {photos.length > 0 && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={uploadPhotos}
            disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="cloud-upload" size={30} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>Отправить ({photos.length})</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 8,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
  photoWrapper: {
    width: '48%',
    margin: '1%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  addButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    marginHorizontal: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default PhotoProtocolScreen;
