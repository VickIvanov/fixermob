import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FileViewer from 'react-native-file-viewer';
import {getFileUri, fileExists, downloadPdfIfNeeded} from '../services/StorageService';

const ProtocolDetailScreen = ({route}) => {
  const {protocol} = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
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

  const downloadPdf = async () => {
    if (!protocol.protocol_id) {
      Alert.alert('Ошибка', 'ID протокола не найден');
      return;
    }

    try {
      setIsDownloading(true);
      const fileName = protocol.pdfPath || `protocol_${protocol.protocol_id}.pdf`;
      await downloadPdfIfNeeded(protocol.protocol_id, fileName);
      await checkPdfExists();
      Alert.alert('Успех', 'PDF успешно загружен');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить PDF файл');
    } finally {
      setIsDownloading(false);
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
          // Пытаемся скачать если файла нет
          await downloadPdf();
          filePath = getFileUri(protocol.pdfPath);
        } else if (!exists) {
          Alert.alert('Ошибка', 'PDF файл не найден');
          return;
        }
      } else if (protocol.protocol_id) {
        // Скачиваем если нет локального пути
        await downloadPdf();
        const fileName = `protocol_${protocol.protocol_id}.pdf`;
        filePath = getFileUri(fileName);
      } else {
        Alert.alert('Ошибка', 'PDF файл не найден');
        return;
      }

      await FileViewer.open(filePath, {
        showOpenWithDialog: true,
        showAppsSuggestions: true,
      });
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Ошибка', 'Не удалось открыть PDF файл');
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
        {!pdfExists && protocol.protocol_id && (
          <TouchableOpacity
            style={[styles.button, styles.downloadButton]}
            onPress={downloadPdf}
            disabled={isDownloading}>
            {isDownloading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="cloud-download" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Загрузить PDF</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            (!pdfExists && !protocol.protocol_id) && styles.buttonDisabled,
          ]}
          onPress={openPdf}
          disabled={(!pdfExists && !protocol.protocol_id) || isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="picture-as-pdf" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Открыть PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {!pdfExists && !protocol.protocol_id && (
          <Text style={styles.warningText}>
            PDF файл еще не загружен или не найден
          </Text>
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
