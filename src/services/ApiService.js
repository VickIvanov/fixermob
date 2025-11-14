import {Platform} from 'react-native';
import RNFS from 'react-native-fs';
import {getDeviceId} from './DeviceService';
import {uploadFile} from './NetworkService';

// Для Android эмулятора используем 10.0.2.2 вместо localhost
// Для физического устройства используем IP адрес компьютера
// или localhost через adb reverse если IP не работает
const API_BASE_URL = __DEV__
  ? 'http://localhost:5001' // Используем localhost с adb reverse для Android
  : 'http://your-server-ip:5001'; // Продакшн

/**
 * Загрузка видео протокола
 * @param {string} videoPath - Путь к видео файлу
 * @returns {Promise<{success: boolean, protocol_id: string, pdf_url: string}>}
 */
export const uploadVideoProtocol = async (videoPath) => {
  try {
    const deviceId = await getDeviceId();
    
    // Очищаем путь от file:// префикса для RNFS
    const cleanPath = videoPath.replace('file://', '');
    
    // Проверяем существование файла
    const fileExists = await RNFS.exists(cleanPath);
    if (!fileExists) {
      throw new Error(`Video file not found: ${cleanPath}`);
    }

    const formData = new FormData();
    formData.append('device_id', deviceId);
    formData.append('video', {
      uri: Platform.OS === 'android' ? `file://${cleanPath}` : cleanPath,
      type: 'video/mp4',
      name: 'video.mp4',
    });

    console.log('[ApiService] Uploading video to:', `${API_BASE_URL}/api/protocols/video`);
    console.log('[ApiService] Video path:', cleanPath);
    console.log('[ApiService] Device ID:', deviceId);
    console.log('[ApiService] File exists:', fileExists);
    console.log('[ApiService] FormData video URI:', Platform.OS === 'android' ? `file://${cleanPath}` : cleanPath);

    // Пробуем использовать fetch с правильными настройками
    try {
      console.log('[ApiService] Starting fetch request...');
      const response = await fetch(`${API_BASE_URL}/api/protocols/video`, {
        method: 'POST',
        body: formData,
        // НЕ устанавливаем Content-Type - React Native установит автоматически
      });

      console.log('[ApiService] Response status:', response.status);
      console.log('[ApiService] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ApiService] Upload error response:', errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('[ApiService] Failed to parse error response as JSON');
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ApiService] Upload successful, protocol_id:', data.protocol_id);
      return {
        success: true,
        protocol_id: data.protocol_id,
        protocolNumber: data.protocol_id.substring(0, 8).toUpperCase(),
        pdf_url: data.pdf_url,
        date: new Date().toISOString(),
      };
    } catch (fetchError) {
      console.error('[ApiService] Fetch error, trying XMLHttpRequest:', fetchError);
      console.error('[ApiService] Fetch error message:', fetchError.message);
      console.error('[ApiService] Fetch error stack:', fetchError.stack);
      // Fallback на XMLHttpRequest
      console.log('[ApiService] Attempting XMLHttpRequest upload...');
      const data = await uploadFile(`${API_BASE_URL}/api/protocols/video`, formData);
      console.log('[ApiService] XMLHttpRequest upload successful, protocol_id:', data.protocol_id);
      
      return {
        success: true,
        protocol_id: data.protocol_id,
        protocolNumber: data.protocol_id.substring(0, 8).toUpperCase(),
        pdf_url: data.pdf_url,
        date: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('[ApiService] Error uploading video protocol:', error);
    console.error('[ApiService] Error message:', error.message);
    console.error('[ApiService] Error stack:', error.stack);
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
    
    for (let index = 0; index < photoPaths.length; index++) {
      const path = photoPaths[index];
      const cleanPath = path.replace('file://', '');
      
      // Проверяем существование файла
      const fileExists = await RNFS.exists(cleanPath);
      if (!fileExists) {
        console.warn(`Photo file not found: ${cleanPath}, skipping...`);
        continue;
      }
      
      formData.append('photos', {
        uri: Platform.OS === 'android' ? `file://${cleanPath}` : cleanPath,
        type: 'image/jpeg',
        name: `photo_${index}.jpg`,
      });
    }

    console.log('Uploading photos to:', `${API_BASE_URL}/api/protocols/photos`);
    console.log('Photo count:', photoPaths.length);
    console.log('Device ID:', deviceId);

    // Пробуем использовать fetch с правильными настройками
    try {
      const response = await fetch(`${API_BASE_URL}/api/protocols/photos`, {
        method: 'POST',
        body: formData,
        // НЕ устанавливаем Content-Type - React Native установит автоматически
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          // Игнорируем ошибку парсинга
        }
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
    } catch (fetchError) {
      console.error('Fetch error, trying XMLHttpRequest:', fetchError);
      // Fallback на XMLHttpRequest
      const data = await uploadFile(`${API_BASE_URL}/api/protocols/photos`, formData);
      
      return {
        success: true,
        protocol_id: data.protocol_id,
        protocolNumber: data.protocol_id.substring(0, 8).toUpperCase(),
        pdf_url: data.pdf_url,
        date: new Date().toISOString(),
        photoCount: photoPaths.length,
      };
    }
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
    
    for (let index = 0; index < screenshotPaths.length; index++) {
      const path = screenshotPaths[index];
      const cleanPath = path.replace('file://', '');
      
      // Проверяем существование файла
      const fileExists = await RNFS.exists(cleanPath);
      if (!fileExists) {
        console.warn(`[ApiService] Screenshot file not found: ${cleanPath}, skipping...`);
        continue;
      }
      
      formData.append('screenshots', {
        uri: Platform.OS === 'android' ? `file://${cleanPath}` : cleanPath,
        type: 'image/png',
        name: `screenshot_${index}.png`,
      });
    }

    console.log('[ApiService] Uploading screenshots to:', `${API_BASE_URL}/api/protocols/screenshots`);
    console.log('[ApiService] Screenshot count:', screenshotPaths.length);
    console.log('[ApiService] Device ID:', deviceId);

    // Пробуем использовать fetch с правильными настройками
    try {
      console.log('[ApiService] Starting fetch request for screenshots...');
      const response = await fetch(`${API_BASE_URL}/api/protocols/screenshots`, {
        method: 'POST',
        body: formData,
        // НЕ устанавливаем Content-Type - React Native установит автоматически
      });

      console.log('[ApiService] Response status:', response.status);
      console.log('[ApiService] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ApiService] Upload error response:', errorText);
        let errorData = {};
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('[ApiService] Failed to parse error response as JSON');
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[ApiService] Upload successful, protocol_id:', data.protocol_id);
      return {
        success: true,
        protocol_id: data.protocol_id,
        protocolNumber: data.protocol_id.substring(0, 8).toUpperCase(),
        pdf_url: data.pdf_url,
        date: new Date().toISOString(),
        screenshotCount: screenshotPaths.length,
      };
    } catch (fetchError) {
      console.error('[ApiService] Fetch error, trying XMLHttpRequest:', fetchError);
      console.error('[ApiService] Fetch error message:', fetchError.message);
      console.error('[ApiService] Fetch error stack:', fetchError.stack);
      // Fallback на XMLHttpRequest
      console.log('[ApiService] Attempting XMLHttpRequest upload for screenshots...');
      const data = await uploadFile(`${API_BASE_URL}/api/protocols/screenshots`, formData);
      console.log('[ApiService] XMLHttpRequest upload successful, protocol_id:', data.protocol_id);
      
      return {
        success: true,
        protocol_id: data.protocol_id,
        protocolNumber: data.protocol_id.substring(0, 8).toUpperCase(),
        pdf_url: data.pdf_url,
        date: new Date().toISOString(),
        screenshotCount: screenshotPaths.length,
      };
    }
  } catch (error) {
    console.error('[ApiService] Error uploading screenshot protocol:', error);
    console.error('[ApiService] Error message:', error.message);
    console.error('[ApiService] Error stack:', error.stack);
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
