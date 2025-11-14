import {Platform, Linking, Alert, NativeModules, NativeEventEmitter} from 'react-native';
import {request, PERMISSIONS, RESULTS, openSettings} from 'react-native-permissions';

const {OverlayModule} = NativeModules;
const overlayEventEmitter = OverlayModule ? new NativeEventEmitter(OverlayModule) : null;

export const requestOverlayPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    if (OverlayModule) {
      const hasPermission = await OverlayModule.checkOverlayPermission();
      if (hasPermission) {
        return true;
      }
      
      await OverlayModule.requestOverlayPermission();
      
      // Проверяем снова после запроса
      return await OverlayModule.checkOverlayPermission();
    } else {
      // Fallback на react-native-permissions
      const result = await request(PERMISSIONS.ANDROID.SYSTEM_ALERT_WINDOW);
      
      if (result === RESULTS.GRANTED) {
        return true;
      } else {
        Alert.alert(
          'Разрешение требуется',
          'Для работы кнопки скриншотов поверх всех приложений необходимо разрешение "Отображение поверх других приложений".',
          [
            {text: 'Отмена', style: 'cancel'},
            {
              text: 'Настройки',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ],
        );
        return false;
      }
    }
  } catch (error) {
    console.error('Error requesting overlay permission:', error);
    return false;
  }
};

export const checkOverlayPermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    if (OverlayModule) {
      return await OverlayModule.checkOverlayPermission();
    } else {
      const {check} = require('react-native-permissions');
      const result = await check(PERMISSIONS.ANDROID.SYSTEM_ALERT_WINDOW);
      return result === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error checking overlay permission:', error);
    return false;
  }
};

export const startOverlayService = async () => {
  if (Platform.OS !== 'android' || !OverlayModule) {
    return false;
  }

  try {
    const hasPermission = await checkOverlayPermission();
    if (!hasPermission) {
      const granted = await requestOverlayPermission();
      if (!granted) {
        return false;
      }
    }

    await OverlayModule.startOverlayService();
    return true;
  } catch (error) {
    console.error('Error starting overlay service:', error);
    return false;
  }
};

export const stopOverlayService = async () => {
  if (Platform.OS !== 'android' || !OverlayModule) {
    return false;
  }

  try {
    await OverlayModule.stopOverlayService();
    return true;
  } catch (error) {
    console.error('Error stopping overlay service:', error);
    return false;
  }
};

export const addOverlayListener = (callback) => {
  if (overlayEventEmitter) {
    return overlayEventEmitter.addListener('overlayScreenshot', callback);
  }
  return null;
};
