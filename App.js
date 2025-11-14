import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import MainScreen from './src/screens/MainScreen';
import VideoProtocolScreen from './src/screens/VideoProtocolScreen';
import PhotoProtocolScreen from './src/screens/PhotoProtocolScreen';
import ScreenshotProtocolScreen from './src/screens/ScreenshotProtocolScreen';
import ProtocolsListScreen from './src/screens/ProtocolsListScreen';
import ProtocolDetailScreen from './src/screens/ProtocolDetailScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen
          name="Main"
          component={MainScreen}
          options={{title: 'Протоколы осмотра'}}
        />
        <Stack.Screen
          name="VideoProtocol"
          component={VideoProtocolScreen}
          options={{title: 'Протокол с видео'}}
        />
        <Stack.Screen
          name="PhotoProtocol"
          component={PhotoProtocolScreen}
          options={{title: 'Протокол с фото'}}
        />
        <Stack.Screen
          name="ScreenshotProtocol"
          component={ScreenshotProtocolScreen}
          options={{title: 'Протокол со скриншотами'}}
        />
        <Stack.Screen
          name="ProtocolsList"
          component={ProtocolsListScreen}
          options={{title: 'Список протоколов'}}
        />
        <Stack.Screen
          name="ProtocolDetail"
          component={ProtocolDetailScreen}
          options={{title: 'Детали протокола'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

