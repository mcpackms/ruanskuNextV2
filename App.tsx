/**
 * ruanskyNextV2 - RTK 论坛客户端
 */

import React, {useState, useCallback, useEffect} from 'react';
import {StatusBar, StyleSheet, useColorScheme, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import type {UserInfo} from './src/types';
import {loadUser, saveUser, clearUser} from './src/services/storage';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 启动时尝试恢复登录会话
  useEffect(() => {
    loadUser().then(saved => {
      if (saved) {
        setUser(saved);
      }
      setLoading(false);
    });
  }, []);

  const handleLoginSuccess = useCallback((userInfo: UserInfo) => {
    setUser(userInfo);
    saveUser(userInfo); // 持久化
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    clearUser(); // 清除持久化
  }, []);

  if (loading) {
    return <View style={styles.container} />;
  }

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