import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';

const MainScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Протоколы осмотра</Text>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('VideoProtocol')}>
          <View style={styles.buttonContent}>
            <Icon name="videocam" size={40} color="#4A90E2" />
            <Text style={styles.buttonText}>Протокол с видео</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('PhotoProtocol')}>
          <View style={styles.buttonContent}>
            <Icon name="camera-alt" size={40} color="#4A90E2" />
            <Text style={styles.buttonText}>Протокол с фото</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ScreenshotProtocol')}>
          <View style={styles.buttonContent}>
            <Icon name="screenshot" size={40} color="#4A90E2" />
            <Text style={styles.buttonText}>Протокол со скриншотами</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.listButton]}
          onPress={() => navigation.navigate('ProtocolsList')}>
          <View style={styles.buttonContent}>
            <Icon name="list" size={40} color="#4A90E2" />
            <Text style={styles.buttonText}>Список протоколов</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listButton: {
    marginTop: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#333',
    fontWeight: '500',
  },
});

export default MainScreen;

