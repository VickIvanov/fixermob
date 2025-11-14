import RNFS from 'react-native-fs';
import {Platform} from 'react-native';

// Для Android используем ExternalDirectoryPath для доступа к файлам
// Для iOS используем DocumentDirectoryPath
const APP_DIR = Platform.select({
  ios: `${RNFS.DocumentDirectoryPath}/Protocols`,
  android: `${RNFS.ExternalDirectoryPath}/Protocols`,
});

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

export const savePdf = async (pdfData, fileName) => {
  try {
    await initAppDirectory();
    const filePath = `${APP_DIR}/${fileName}`;
    
    // Если pdfData это base64 строка
    if (pdfData.startsWith('data:')) {
      const base64Data = pdfData.split(',')[1];
      await RNFS.writeFile(filePath, base64Data, 'base64');
    } else {
      await RNFS.writeFile(filePath, pdfData, 'base64');
    }
    
    return filePath;
  } catch (error) {
    console.error('Error saving PDF:', error);
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

