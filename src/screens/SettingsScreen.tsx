import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchImageLibrary} from 'react-native-image-picker';
import {loadBackgroundUri, saveBackgroundUri, clearBackgroundUri} from '../services/storage';

interface Props {
  onBack: () => void;
  onBackgroundChange: (uri: string | null) => void;
}

export default function SettingsScreen({onBack, onBackgroundChange}: Props) {
  const insets = useSafeAreaInsets();
  const [bgUri, setBgUri] = useState<string | null>(null);

  // 加载已保存的背景
  useEffect(() => {
    loadBackgroundUri().then(setBgUri);
  }, []);

  // 请求存储权限（Android 运行时权限）
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
      // Android 13+ (API 33)：细粒度媒体权限
      const apiLevel = Platform.Version as number;
      const permission =
        apiLevel >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

      const granted = await PermissionsAndroid.request(permission, {
        title: '需要访问相册',
        message: '选择背景图片需要访问您的相册',
        buttonPositive: '允许',
        buttonNegative: '拒绝',
      });

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(
          '权限被拒绝',
          '请在系统设置中手动授予「存储」或「照片和视频」权限',
        );
        return false;
      }

      return true;
    } catch (err) {
      console.warn('权限请求出错:', err);
      return false;
    }
  }, []);

  // 从相册选择
  const handlePickFromGallery = useCallback(async () => {
    // 先申请权限
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1080,
      maxHeight: 1920,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('错误', result.errorMessage || '无法打开相册');
      return;
    }

    const uri = result.assets?.[0]?.uri;
    if (uri) {
      await saveBackgroundUri(uri);
      setBgUri(uri);
      onBackgroundChange(uri);
    }
  }, [onBackgroundChange, requestPermission]);

  // 清除背景
  const handleClear = useCallback(() => {
    Alert.alert('恢复默认', '确定要清除自定义背景吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '确定',
        onPress: async () => {
          await clearBackgroundUri();
          setBgUri(null);
          onBackgroundChange(null);
        },
      },
    ]);
  }, [onBackgroundChange]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        },
      ]}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <Pressable
          style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 当前背景预览 */}
      <View style={styles.previewCard}>
        <Text style={styles.sectionTitle}>背景预览</Text>
        {bgUri ? (
          <Image source={{uri: bgUri}} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <View style={styles.previewPlaceholder}>
            <Text style={styles.previewPlaceholderText}>默认背景</Text>
          </View>
        )}
        {bgUri && (
          <Pressable
            style={({pressed}) => [styles.clearButton, pressed && styles.clearButtonPressed]}
            onPress={handleClear}>
            <Text style={styles.clearButtonText}>恢复默认背景</Text>
          </Pressable>
        )}
      </View>

      {/* 从相册选择 */}
      <Pressable
        style={({pressed}) => [styles.actionCard, pressed && styles.actionCardPressed]}
        onPress={handlePickFromGallery}>
        <Text style={styles.actionIcon}>🖼️</Text>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>从相册选择</Text>
          <Text style={styles.actionDesc}>选择一张图片作为应用背景</Text>
        </View>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerSpacer: {
    width: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backArrow: {
    fontSize: 28,
    color: '#4A90D9',
    marginRight: 2,
    lineHeight: 28,
  },
  backText: {
    fontSize: 16,
    color: '#4A90D9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },

  /* 预览卡片 */
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  previewPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlaceholderText: {
    fontSize: 15,
    color: '#999',
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  clearButtonPressed: {
    backgroundColor: '#fff5f5',
  },
  clearButtonText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
  },

  /* 相册选择 */
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  actionDesc: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },

  /* URL 输入 */

});