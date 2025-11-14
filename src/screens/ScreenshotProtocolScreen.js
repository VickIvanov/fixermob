import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  StatusBar,
  AppState,
} from 'react-native';
import {captureScreen} from 'react-native-view-shot';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {uploadScreenshotProtocol} from '../services/ApiService';
import {saveFile, savePdf} from '../services/StorageService';
import {saveProtocol} from '../services/ProtocolStorage';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  requestOverlayPermission,
  checkOverlayPermission,
  startOverlayService,
  stopOverlayService,
  addOverlayListener,
} from '../services/OverlayService';

const ScreenshotProtocolScreen = () => {
  const [screenshots, setScreenshots] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasOverlayPermission, setHasOverlayPermission] = useState(false);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      checkPermissionAndStartService();
      
      // Слушаем события от overlay сервиса
      const subscription = addOverlayListener((event) => {
        if (event.action === 'takeScreenshot') {
          takeScreenshot();
        }
      });

      return () => {
        stopOverlayService();
        subscription?.remove();
      };
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPermissionAndStartService();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const checkPermissionAndStartService = async () => {
    const hasPermission = await checkOverlayPermission();
    setHasOverlayPermission(hasPermission);
    
    if (hasPermission) {
      await startOverlayService();
    } else {
      const granted = await requestOverlayPermission();
      setHasOverlayPermission(granted);
      if (granted) {
        await startOverlayService();
      }
    }
  };

  const takeScreenshot = async () => {
    try {
      const uri = await captureScreen({
        format: 'png',
        quality: 0.9,
      });
      setScreenshots(prev => [...prev, uri]);
    } catch (error) {
      console.error('Error taking screenshot:', error);
      Alert.alert('Ошибка', 'Не удалось сделать скриншот');
    }
  };

  const removeScreenshot = (index) => {
    const newScreenshots = screenshots.filter((_, i) => i !== index);
    setScreenshots(newScreenshots);
  };

  const uploadScreenshots = async () => {
    if (screenshots.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы один скриншот');
      return;
    }

    try {
      setIsUploading(true);

      // Сохраняем скриншоты локально
      const savedPaths = [];
      for (const screenshotUri of screenshots) {
        const fileName = `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
        const savedPath = await saveFile(screenshotUri, fileName);
        savedPaths.push(savedPath);
      }

      // Отправляем на API
      const response = await uploadScreenshotProtocol(savedPaths);

      if (response.success) {
        // Сохраняем PDF
        const pdfFileName = `protocol_${response.protocolNumber}.pdf`;
        await savePdf(response.pdfUrl, pdfFileName);

        // Сохраняем протокол
        await saveProtocol({
          protocolNumber: response.protocolNumber,
          date: response.date,
          type: 'screenshot',
          pdfPath: pdfFileName,
          screenshotCount: screenshots.length,
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
      console.error('Error uploading screenshots:', error);
      Alert.alert('Ошибка', 'Не удалось отправить протокол');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView style={styles.scrollView}>
        <View style={styles.infoContainer}>
          <Icon name="info" size={24} color="#4A90E2" />
          <Text style={styles.infoText}>
            {hasOverlayPermission
              ? 'Плавающая кнопка активна! Она будет видна поверх всех приложений. Нажмите на неё для создания скриншотов в любом приложении.'
              : 'Для работы кнопки скриншотов необходимо разрешить "Отображение поверх других приложений". Нажмите кнопку ниже для запроса разрешения.'}
          </Text>
        </View>

        {!hasOverlayPermission && (
          <View style={styles.permissionContainer}>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={checkPermissionAndStartService}>
              <Icon name="security" size={30} color="#FFFFFF" />
              <Text style={styles.permissionButtonText}>
                Запросить разрешение
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.screenshotsContainer}>
          {screenshots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="screenshot" size={80} color="#CCC" />
              <Text style={styles.emptyText}>Скриншоты не добавлены</Text>
              <Text style={styles.emptySubtext}>
                {hasOverlayPermission
                  ? 'Используйте плавающую кнопку поверх всех приложений для создания скриншотов'
                  : 'Сначала разрешите отображение поверх других приложений'}
              </Text>
            </View>
          ) : (
            screenshots.map((uri, index) => (
              <View key={index} style={styles.screenshotWrapper}>
                <Image source={{uri}} style={styles.screenshot} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeScreenshot(index)}>
                  <Icon name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.controls}>
        {screenshots.length > 0 && (
          <>
            <Text style={styles.countText}>
              Скриншотов: {screenshots.length}
            </Text>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={uploadScreenshots}
              disabled={isUploading}>
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="check-circle" size={30} color="#FFFFFF" />
                  <Text style={styles.finishButtonText}>Завершить</Text>
                </>
              )}
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
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1976D2',
  },
  permissionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  permissionButton: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  screenshotsContainer: {
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
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  screenshotWrapper: {
    width: '48%',
    margin: '1%',
    position: 'relative',
  },
  screenshot: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
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
  countText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  finishButton: {
    backgroundColor: '#27AE60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
  },
  finishButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ScreenshotProtocolScreen;
