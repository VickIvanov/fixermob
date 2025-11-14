// import axios from 'axios';
import {getDeviceId} from './DeviceService';

// const API_BASE_URL = 'https://api.example.com'; // Моковый URL, замените на реальный

// Простая функция для base64 кодирования (для моковых данных)
const toBase64 = (str) => {
  try {
    // В React Native можно использовать встроенную функцию если доступна
    if (typeof btoa !== 'undefined') {
      return btoa(str);
    }
    // Или использовать простую заглушку
    return 'TW9ja1BERg=='; // "Mock PDF" в base64
  } catch (e) {
    return 'TW9ja1BERg==';
  }
};

// Моковая функция для генерации PDF
const generateMockPdf = async (protocolData) => {
  // В реальном приложении здесь будет запрос к API
  // Пока возвращаем моковые данные
  const mockContent = `Mock PDF Content - Protocol: ${protocolData.type}, Device: ${protocolData.deviceId}`;
  const mockPdfBase64 = toBase64(mockContent);
  
  return {
    pdfUrl: `data:application/pdf;base64,${mockPdfBase64}`,
    protocolNumber: `PROT-${Date.now()}`,
  };
};

export const uploadVideoProtocol = async (videoPath) => {
  try {
    const deviceId = await getDeviceId();
    
    // В реальном приложении здесь будет загрузка файла
    // Пока используем мок
    const formData = new FormData();
    formData.append('video', {
      uri: videoPath,
      type: 'video/mp4',
      name: 'video.mp4',
    });
    formData.append('deviceId', deviceId);
    formData.append('type', 'video');

    // Моковый ответ
    const mockResponse = await generateMockPdf({
      type: 'video',
      deviceId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      protocolNumber: mockResponse.protocolNumber,
      pdfUrl: mockResponse.pdfUrl,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading video protocol:', error);
    throw error;
  }
};

export const uploadPhotoProtocol = async (photoPaths) => {
  try {
    const deviceId = await getDeviceId();
    
    const formData = new FormData();
    photoPaths.forEach((path, index) => {
      formData.append('photos', {
        uri: path,
        type: 'image/jpeg',
        name: `photo_${index}.jpg`,
      });
    });
    formData.append('deviceId', deviceId);
    formData.append('type', 'photo');

    const mockResponse = await generateMockPdf({
      type: 'photo',
      deviceId,
      timestamp: new Date().toISOString(),
      photoCount: photoPaths.length,
    });

    return {
      success: true,
      protocolNumber: mockResponse.protocolNumber,
      pdfUrl: mockResponse.pdfUrl,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading photo protocol:', error);
    throw error;
  }
};

export const uploadScreenshotProtocol = async (screenshotPaths) => {
  try {
    const deviceId = await getDeviceId();
    
    const formData = new FormData();
    screenshotPaths.forEach((path, index) => {
      formData.append('screenshots', {
        uri: path,
        type: 'image/png',
        name: `screenshot_${index}.png`,
      });
    });
    formData.append('deviceId', deviceId);
    formData.append('type', 'screenshot');

    const mockResponse = await generateMockPdf({
      type: 'screenshot',
      deviceId,
      timestamp: new Date().toISOString(),
      screenshotCount: screenshotPaths.length,
    });

    return {
      success: true,
      protocolNumber: mockResponse.protocolNumber,
      pdfUrl: mockResponse.pdfUrl,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading screenshot protocol:', error);
    throw error;
  }
};

