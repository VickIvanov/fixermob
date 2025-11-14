import AsyncStorage from '@react-native-async-storage/async-storage';
import {getProtocols as getProtocolsFromApi} from './ApiService';

const PROTOCOLS_KEY = '@protocols';

/**
 * Сохранение протокола локально
 * @param {Object} protocol - Объект протокола
 */
export const saveProtocol = async (protocol) => {
  try {
    const protocols = await getLocalProtocols();
    // Проверяем, нет ли уже такого протокола
    const existingIndex = protocols.findIndex(
      p => p.protocol_id === protocol.protocol_id || p.protocolNumber === protocol.protocolNumber
    );
    
    if (existingIndex >= 0) {
      protocols[existingIndex] = protocol;
    } else {
      protocols.push(protocol);
    }
    
    await AsyncStorage.setItem(PROTOCOLS_KEY, JSON.stringify(protocols));
    return protocol;
  } catch (error) {
    console.error('Error saving protocol:', error);
    throw error;
  }
};

/**
 * Получение протоколов (сначала с сервера, затем локальные)
 */
export const getProtocols = async () => {
  try {
    // Сначала пытаемся получить с сервера
    try {
      const serverData = await getProtocolsFromApi();
      if (serverData.success && serverData.protocols) {
        // Сохраняем протоколы с сервера локально
        const serverProtocols = serverData.protocols.map(protocol => ({
          protocol_id: protocol.id,
          protocolNumber: protocol.number || protocol.id.substring(0, 8).toUpperCase(),
          date: parseServerDate(protocol.date),
          type: mapServerType(protocol.type),
          pdf_url: protocol.pdf_url,
          pdfPath: null, // Будет загружен при открытии
        }));
        
        // Сохраняем в локальное хранилище
        await AsyncStorage.setItem(PROTOCOLS_KEY, JSON.stringify(serverProtocols));
        return serverProtocols;
      }
    } catch (error) {
      console.warn('Failed to fetch protocols from server, using local:', error);
    }
    
    // Если не удалось получить с сервера, используем локальные
    return await getLocalProtocols();
  } catch (error) {
    console.error('Error getting protocols:', error);
    return [];
  }
};

/**
 * Получение протоколов только из локального хранилища
 */
export const getLocalProtocols = async () => {
  try {
    const data = await AsyncStorage.getItem(PROTOCOLS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting local protocols:', error);
    return [];
  }
};

/**
 * Получение одного протокола по номеру или ID
 */
export const getProtocol = async (protocolNumberOrId) => {
  try {
    const protocols = await getProtocols();
    return protocols.find(
      p => p.protocolNumber === protocolNumberOrId || p.protocol_id === protocolNumberOrId
    ) || null;
  } catch (error) {
    console.error('Error getting protocol:', error);
    return null;
  }
};

/**
 * Парсинг даты с сервера (формат: "15.12.2024 14:30:25")
 */
const parseServerDate = (dateString) => {
  try {
    // Формат: "15.12.2024 14:30:25"
    const parts = dateString.split(' ');
    const datePart = parts[0].split('.');
    const timePart = parts[1] ? parts[1].split(':') : ['00', '00', '00'];
    
    const day = parseInt(datePart[0], 10);
    const month = parseInt(datePart[1], 10) - 1; // Месяцы в JS начинаются с 0
    const year = parseInt(datePart[2], 10);
    const hour = parseInt(timePart[0], 10);
    const minute = parseInt(timePart[1], 10);
    const second = parseInt(timePart[2], 10) || 0;
    
    return new Date(year, month, day, hour, minute, second).toISOString();
  } catch (error) {
    console.error('Error parsing server date:', error);
    return new Date().toISOString();
  }
};

/**
 * Маппинг типа протокола с сервера на локальный формат
 */
const mapServerType = (serverType) => {
  const typeMap = {
    'video': 'video',
    'photos': 'photo',
    'screenshots': 'screenshot',
  };
  return typeMap[serverType] || serverType;
};
