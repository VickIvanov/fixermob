import {Platform} from 'react-native';

/**
 * Загрузка файла через XMLHttpRequest (более надежно для больших файлов)
 */
export const uploadFile = (url, formData, onProgress) => {
  return new Promise((resolve, reject) => {
    console.log('[NetworkService] Starting XMLHttpRequest upload to:', url);
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = event.loaded / event.total;
        console.log('[NetworkService] Upload progress:', Math.round(progress * 100) + '%');
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      console.log('[NetworkService] XHR load event, status:', xhr.status);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('[NetworkService] Upload successful, response:', response);
          resolve(response);
        } catch (error) {
          console.log('[NetworkService] Response is not JSON, returning as text');
          resolve(xhr.responseText);
        }
      } else {
        console.error('[NetworkService] HTTP error, status:', xhr.status);
        console.error('[NetworkService] Response text:', xhr.responseText);
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.message || `HTTP error! status: ${xhr.status}`));
        } catch (error) {
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', (event) => {
      console.error('[NetworkService] XHR error event:', event);
      console.error('[NetworkService] XHR readyState:', xhr.readyState);
      console.error('[NetworkService] XHR status:', xhr.status);
      reject(new Error('Network request failed. Проверьте подключение к сети и что API сервер запущен.'));
    });

    xhr.addEventListener('timeout', () => {
      console.error('[NetworkService] XHR timeout after 5 minutes');
      reject(new Error('Request timeout'));
    });

    xhr.addEventListener('abort', () => {
      console.error('[NetworkService] XHR request aborted');
      reject(new Error('Request aborted'));
    });

    try {
      console.log('[NetworkService] Opening POST request to:', url);
      xhr.open('POST', url);
      xhr.timeout = 300000; // 5 минут
      
      // НЕ устанавливаем Content-Type - браузер/React Native установит автоматически с boundary
      
      // Отправляем FormData
      console.log('[NetworkService] Sending FormData...');
      xhr.send(formData);
      console.log('[NetworkService] FormData sent, waiting for response...');
    } catch (error) {
      console.error('[NetworkService] Error setting up XHR:', error);
      console.error('[NetworkService] Error message:', error.message);
      console.error('[NetworkService] Error stack:', error.stack);
      reject(new Error(`Failed to setup request: ${error.message}`));
    }
  });
};

