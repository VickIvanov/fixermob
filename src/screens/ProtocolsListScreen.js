import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getProtocols} from '../services/ProtocolStorage';

const ProtocolsListScreen = () => {
  const [protocols, setProtocols] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const loadProtocols = async () => {
    try {
      setLoading(true);
      const data = await getProtocols();
      // Сортируем по дате (новые первыми)
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setProtocols(sorted);
    } catch (error) {
      console.error('Error loading protocols:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить протоколы');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProtocols();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProtocols();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return 'videocam';
      case 'photo':
        return 'camera-alt';
      case 'screenshots':
        return 'screenshot';
      case 'screenshot':
        return 'screenshot';
      default:
        return 'description';
    }
  };

  const renderProtocol = ({item}) => (
    <TouchableOpacity
      style={styles.protocolItem}
      onPress={() => navigation.navigate('ProtocolDetail', {protocol: item})}>
      <View style={styles.protocolIcon}>
        <Icon name={getTypeIcon(item.type)} size={30} color="#4A90E2" />
      </View>
      <View style={styles.protocolInfo}>
        <Text style={styles.protocolNumber}>{item.protocolNumber}</Text>
        <Text style={styles.protocolDate}>{formatDate(item.date)}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );

  if (loading && protocols.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.emptyText}>Загрузка протоколов...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {protocols.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={80} color="#CCC" />
          <Text style={styles.emptyText}>Протоколы не найдены</Text>
          <Text style={styles.emptySubtext}>
            Создайте новый протокол на главном экране
          </Text>
        </View>
      ) : (
        <FlatList
          data={protocols}
          renderItem={renderProtocol}
          keyExtractor={(item) => item.protocol_id || item.protocolNumber}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    color: '#999',
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  protocolIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  protocolDate: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProtocolsListScreen;
