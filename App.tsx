/**
 * ruanskyNextV2 - RTK 论坛客户端
 */

import React, {useState, useCallback} from 'react';
import {StatusBar, StyleSheet, useColorScheme, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import type {UserInfo} from './src/types';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [user, setUser] = useState<UserInfo | null>(null);

  const handleLoginSuccess = useCallback((userInfo: UserInfo) => {
    setUser(userInfo);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        {user ? (
          <MainScreen user={user} onLogout={handleLogout} />
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;