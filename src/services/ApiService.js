import {Platform} from 'react-native';
import {getDeviceId} from './DeviceService';

// Для Android эмулятора используем 10.0.2.2 вместо localhost
// Для физического устройства используйте IP адрес вашего компьютера
const API_BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:5001' // Android эмулятор
    : 'http://localhost:5001' // iOS симулятор
  : 'http://your-server-ip:5001'; // Продакшн

/**
 * Загрузка видео протокола
 * @param {string} videoPath - Путь к видео файлу
 * @returns {Promise<{success: boolean, protocol_id: string, pdf_url: string}>}
 */
export const uploadVideoProtocol = async (videoPath) => {
  try {
    const deviceId = await getDeviceId();
    
    const formData = new FormData();
    formData.append('device_id', deviceId);
    formData.append('video', {
      uri: videoPath,
      type: 'video/mp4',
      name: 'video.mp4',
    });

    const response = await fetch(`${API_BASE_URL}/api/protocols/video`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      protocol_id: data.protocol_id,
      protocolNumber: data.protocol_id.substring(0, 8).toUpperCase(), // Первые 8 символов как номер
      pdf_url: data.pdf_url,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading video protocol:', error);
    throw error;
  }
};

/**
 * Загрузка фото протокола
 * @param {string[]} photoPaths - Массив путей к фото файлам
 * @returns {Promise<{success: boolean, protocol_id: string, pdf_url: string}>}
 */
export const uploadPhotoProtocol = async (photoPaths) => {
  try {
    const deviceId = await getDeviceId();
    
    const formData = new FormData();
    formData.append('device_id', deviceId);
    
    photoPaths.forEach((path, index) => {
      formData.append('photos', {
        uri: path,
        type: 'image/jpeg',
        name: `photo_${index}.jpg`,
      });
    });

    const response = await fetch(`${API_BASE_URL}/api/protocols/photos`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      protocol_id: data.protocol_id,
      protocolNumber: data.protocol_id.substring(0, 8).toUpperCase(),
      pdf_url: data.pdf_url,
      date: new Date().toISOString(),
      photoCount: photoPaths.length,
    };
  } catch (error) {
    console.error('Error uploading photo protocol:', error);
    throw error;
  }
};

/**
 * Загрузка скриншотов протокола
 * @param {string[]} screenshotPaths - Массив путей к скриншотам
 * @returns {Promise<{success: boolean, protocol_id: string, pdf_url: string}>}
 */
export const uploadScreenshotProtocol = async (screenshotPaths) => {
  try {
    const deviceId = await getDeviceId();
    
    const formData = new FormData();
    formData.append('device_id', deviceId);
    
    screenshotPaths.forEach((path, index) => {
      formData.append('screenshots', {
        uri: path,
        type: 'image/png',
        name: `screenshot_${index}.png`,
      });
    });

    const response = await fetch(`${API_BASE_URL}/api/protocols/screenshots`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      protocol_id: data.protocol_id,
      protocolNumber: data.protocol_id.substring(0, 8).toUpperCase(),
      pdf_url: data.pdf_url,
      date: new Date().toISOString(),
      screenshotCount: screenshotPaths.length,
    };
  } catch (error) {
    console.error('Error uploading screenshot protocol:', error);
    throw error;
  }
};

/**
 * Получение списка протоколов для устройства
 * @returns {Promise<{success: boolean, protocols: Array}>}
 */
export const getProtocols = async () => {
  try {
    const deviceId = await getDeviceId();
    
    const response = await fetch(
      `${API_BASE_URL}/api/protocols?device_id=${encodeURIComponent(deviceId)}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      protocols: data.protocols || [],
    };
  } catch (error) {
    console.error('Error getting protocols:', error);
    throw error;
  }
};

/**
 * Скачивание PDF протокола
 * @param {string} protocolId - ID протокола
 * @returns {Promise<string>} - Путь к сохраненному PDF файлу
 */
export const downloadProtocolPDF = async (protocolId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/protocols/${protocolId}/pdf`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Получаем PDF как blob и конвертируем в base64
    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

/**
 * Проверка работоспособности API
 * @returns {Promise<{status: string}>}
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
};
