/**
 * 本地持久化存储（AsyncStorage 封装）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  BACKGROUND: '@rtk_background',
};

/** 保存背景图 URI */
export async function saveBackgroundUri(uri: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.BACKGROUND, uri);
}

/** 读取背景图 URI */
export async function loadBackgroundUri(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.BACKGROUND);
}

/** 清除背景图 */
export async function clearBackgroundUri(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.BACKGROUND);
}
