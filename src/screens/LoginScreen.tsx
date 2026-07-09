import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {login} from '../services/api';
import type {UserInfo} from '../types';

interface Props {
  onLoginSuccess: (user: UserInfo) => void;
}

export default function LoginScreen({onLoginSuccess}: Props) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!password) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    setLoading(true);
    try {
      const result = await login({phone: trimmedPhone, password});
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        Alert.alert('登录失败', result.error || '未知错误');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : '网络错误，请检查 MCP 服务是否运行';
      Alert.alert('登录失败', message);
    } finally {
      setLoading(false);
    }
  }, [phone, password, onLoginSuccess]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20},
        ]}
        keyboardShouldPersistTaps="handled">
        {/* 标题区域 */}
        <View style={styles.header}>
          <Text style={styles.appName}>ruanskyNextV2</Text>
          <Text style={styles.subtitle}>RTK 论坛客户端</Text>
        </View>

        {/* 表单区域 */}
        <View style={styles.form}>
          <Text style={styles.label}>手机号</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入手机号"
            placeholderTextColor="#999"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={styles.label}>密码</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="请输入密码"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setShowPassword(prev => !prev)}>
              <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            </Pressable>
          </View>

          <Pressable
            style={({pressed}) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
              loading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>登 录</Text>
            )}
          </Pressable>


        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#222',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#222',
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  eyeText: {
    fontSize: 18,
  },
  loginButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    minHeight: 50,
  },
  loginButtonPressed: {
    backgroundColor: '#357ABD',
    opacity: 0.9,
  },
  loginButtonDisabled: {
    backgroundColor: '#a0c4e8',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 4,
  },
});