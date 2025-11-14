import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

// Нативный модуль для создания overlay окна
// Будет создан позже, пока используем заглушку
class OverlayWindowService {
  constructor() {
    this.isServiceRunning = false;
  }

  async startService() {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      // Здесь будет вызов нативного модуля для создания overlay
      // Пока используем заглушку
      this.isServiceRunning = true;
      return true;
    } catch (error) {
      console.error('Error starting overlay service:', error);
      return false;
    }
  }

  async stopService() {
    this.isServiceRunning = false;
  }

  isRunning() {
    return this.isServiceRunning;
  }
}

export default new OverlayWindowService();

