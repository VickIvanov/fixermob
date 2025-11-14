import RNFS from 'react-native-fs';
import {Platform} from 'react-native';
import {downloadProtocolPDF} from './ApiService';

// Для Android используем ExternalDirectoryPath для доступа к файлам
// Для iOS используем DocumentDirectoryPath
const APP_DIR = Platform.select({
  ios: `${RNFS.DocumentDirectoryPath}/Protocols`,
  android: `${RNFS.ExternalDirectoryPath}/Protocols`,
});

// Для Android эмулятора используем 10.0.2.2 вместо localhost
// Для физического устройства используйте IP адрес вашего компьютера
const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:5001' // Android эмулятор
    : 'http://localhost:5001' // iOS симулятор
  : 'http://your-server-ip:5001'; // Продакшн

// Инициализация директории приложения
export const initAppDirectory = async () => {
  try {
    const exists = await RNFS.exists(APP_DIR);
    if (!exists) {
      await RNFS.mkdir(APP_DIR);
    }
    return APP_DIR;
  } catch (error) {
    console.error('Error initializing app directory:', error);
    throw error;
  }
};

export const saveFile = async (sourcePath, fileName) => {
  try {
    await initAppDirectory();
    const destPath = `${APP_DIR}/${fileName}`;
    await RNFS.copyFile(sourcePath, destPath);
    return destPath;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

/**
 * Сохранение PDF
 * @param {string} pdfData - Base64 строка или URL
 * @param {string} fileName - Имя файла
 * @param {string} protocolId - ID протокола (для скачивания с сервера если нужно)
 */
export const savePdf = async (pdfData, fileName, protocolId = null) => {
  try {
    await initAppDirectory();
    const filePath = `${APP_DIR}/${fileName}`;
    
    // Если pdfData это URL (относительный путь с сервера)
    if (pdfData.startsWith('/api/') || pdfData.startsWith('http')) {
      if (!protocolId) {
        throw new Error('protocolId required for downloading PDF from server');
      }
      
      // Скачиваем PDF с сервера
      const base64Data = await downloadProtocolPDF(protocolId);
      await RNFS.writeFile(filePath, base64Data, 'base64');
    } 
    // Если pdfData это base64 строка с префиксом data:
    else if (pdfData.startsWith('data:')) {
      const base64Data = pdfData.split(',')[1];
      await RNFS.writeFile(filePath, base64Data, 'base64');
    } 
    // Если pdfData это уже base64 строка
    else {
      await RNFS.writeFile(filePath, pdfData, 'base64');
    }
    
    return filePath;
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw error;
  }
};

/**
 * Скачивание PDF с сервера если его нет локально
 * @param {string} protocolId - ID протокола
 * @param {string} fileName - Имя файла для сохранения
 */
export const downloadPdfIfNeeded = async (protocolId, fileName) => {
  try {
    const filePath = getFileUri(fileName);
    const exists = await RNFS.exists(filePath);
    
    if (!exists && protocolId) {
      // Скачиваем с сервера
      const base64Data = await downloadProtocolPDF(protocolId);
      await initAppDirectory();
      await RNFS.writeFile(filePath, base64Data, 'base64');
      return filePath;
    }
    
    return exists ? filePath : null;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

export const getFileUri = (fileName) => {
  return `${APP_DIR}/${fileName}`;
};

export const fileExists = async (fileName) => {
  try {
    const filePath = `${APP_DIR}/${fileName}`;
    return await RNFS.exists(filePath);
  } catch (error) {
    return false;
  }
};
