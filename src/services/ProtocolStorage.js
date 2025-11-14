import AsyncStorage from '@react-native-async-storage/async-storage';

const PROTOCOLS_KEY = '@protocols';

export const saveProtocol = async (protocol) => {
  try {
    const protocols = await getProtocols();
    protocols.push(protocol);
    await AsyncStorage.setItem(PROTOCOLS_KEY, JSON.stringify(protocols));
    return protocol;
  } catch (error) {
    console.error('Error saving protocol:', error);
    throw error;
  }
};

export const getProtocols = async () => {
  try {
    const data = await AsyncStorage.getItem(PROTOCOLS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting protocols:', error);
    return [];
  }
};

export const getProtocol = async (protocolNumber) => {
  try {
    const protocols = await getProtocols();
    return protocols.find(p => p.protocolNumber === protocolNumber);
  } catch (error) {
    console.error('Error getting protocol:', error);
    return null;
  }
};

