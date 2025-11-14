import DeviceInfo from 'react-native-device-info';

let deviceId = null;

export const getDeviceId = async () => {
  if (!deviceId) {
    deviceId = await DeviceInfo.getUniqueId();
  }
  return deviceId;
};

