import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FileViewer from 'react-native-file-viewer';
import {getFileUri, fileExists, downloadPdfIfNeeded} from '../services/StorageService';
import PdfViewerService from '../services/PdfViewerService';
import RNFS from 'react-native-fs';

const ProtocolDetailScreen = ({route}) => {
  const {protocol} = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [pdfExists, setPdfExists] = useState(false);

  useEffect(() => {
    checkPdfExists();
  }, []);

  const checkPdfExists = async () => {
    if (protocol.pdfPath) {
      const exists = await fileExists(protocol.pdfPath);
      setPdfExists(exists);
    } else {
      setPdfExists(false);
    }
  };


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'video':
        return 'Протокол с видео';
      case 'photo':
        return 'Протокол с фото';
      case 'screenshot':
        return 'Протокол со скриншотами';
      default:
        return 'Протокол';
    }
  };

  const openPdf = async () => {
    try {
      setIsLoading(true);
      
      // Проверяем наличие файла
      let filePath;
      if (protocol.pdfPath) {
        filePath = getFileUri(protocol.pdfPath);
        const exists = await fileExists(protocol.pdfPath);
        
        if (!exists && protocol.protocol_id) {
          // Автоматически скачиваем если файла нет
          const fileName = protocol.pdfPath || `protocol_${protocol.protocol_id}.pdf`;
          await downloadPdfIfNeeded(protocol.protocol_id, fileName);
          filePath = getFileUri(fileName);
        } else if (!exists) {
          Alert.alert('Ошибка', 'PDF файл не найден');
          return;
        }
      } else if (protocol.protocol_id) {
        // Автоматически скачиваем если нет локального пути
        const fileName = `protocol_${protocol.protocol_id}.pdf`;
        await downloadPdfIfNeeded(protocol.protocol_id, fileName);
        filePath = getFileUri(fileName);
      } else {
        Alert.alert('Ошибка', 'PDF файл не найден');
        return;
      }

      // Проверяем существование файла
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        Alert.alert('Ошибка', 'PDF файл не найден по пути: ' + filePath);
        return;
      }

      console.log('[ProtocolDetailScreen] Opening PDF:', filePath);
      
      // Пробуем использовать нативный модуль для Android
      if (Platform.OS === 'android') {
        try {
          await PdfViewerService.openPdf(filePath);
          return; // Успешно открыто
        } catch (nativeError) {
          console.warn('[ProtocolDetailScreen] Native PDF viewer failed, trying FileViewer:', nativeError);
          // Fallback на FileViewer
        }
      }
      
      // Используем FileViewer как fallback
      await FileViewer.open(filePath, {
        showOpenWithDialog: true,
        showAppsSuggestions: true,
        displayName: `Протокол ${protocol.protocolNumber}`,
      });
    } catch (error) {
      console.error('[ProtocolDetailScreen] Error opening PDF:', error);
      console.error('[ProtocolDetailScreen] Error message:', error.message);
      
      // Показываем понятное сообщение об ошибке
      let errorMessage = 'Не удалось открыть PDF файл';
      if (error.message && error.message.includes('No app associated')) {
        errorMessage = 'На устройстве не найдено приложение для просмотра PDF. Установите приложение для просмотра PDF файлов (например, Adobe Reader или Google PDF Viewer).';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Ошибка', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="description" size={60} color="#4A90E2" />
        <Text style={styles.protocolNumber}>{protocol.protocolNumber}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Тип:</Text>
          <Text style={styles.detailValue}>{getTypeName(protocol.type)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Дата создания:</Text>
          <Text style={styles.detailValue}>{formatDate(protocol.date)}</Text>
        </View>

        {protocol.photoCount && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Количество фото:</Text>
            <Text style={styles.detailValue}>{protocol.photoCount}</Text>
          </View>
        )}

        {protocol.screenshotCount && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Количество скриншотов:</Text>
            <Text style={styles.detailValue}>{protocol.screenshotCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.button}
          onPress={openPdf}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="picture-as-pdf" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Открыть PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  protocolNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
  },
  details: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  actions: {
    padding: 20,
    marginTop: 'auto',
  },
  button: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  downloadButton: {
    backgroundColor: '#27AE60',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningText: {
    marginTop: 10,
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
  },
});

export default ProtocolDetailScreen;
