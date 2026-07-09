/**
 * 本地持久化存储（AsyncStorage 封装）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {UserInfo} from '../types';

const KEYS = {
  BACKGROUND: '@rtk_background',
  USER: '@rtk_user',
};

// ========== 用户登录态持久化 ==========

/** 保存用户信息（登录后调用） */
export async function saveUser(user: UserInfo): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

/** 读取已保存的用户信息（启动时调用） */
export async function loadUser(): Promise<UserInfo | null> {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserInfo;
  } catch {
    return null;
  }
}

/** 清除用户信息（退出时调用） */
export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
}

// ========== 背景图持久化 ==========

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
