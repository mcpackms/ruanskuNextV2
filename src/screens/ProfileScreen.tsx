import React, {useCallback} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {UserInfo} from '../types';
import {logout} from '../services/api';

interface Props {
  user: UserInfo;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export default function ProfileScreen({user, onLogout, onOpenSettings}: Props) {
  const insets = useSafeAreaInsets();

  const handleLogout = useCallback(() => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            // 即使退出接口失败，也清除本地状态
          }
          onLogout();
        },
      },
    ]);
  }, [onLogout]);

  const infoItems: {label: string; value: string}[] = [
    {label: 'UID', value: user.uid},
    {label: '手机号', value: user.mobile},
    {label: '昵称', value: user.nickname},
    {label: '等级', value: user.level},
    {label: '签名', value: user.signature || '未设置'},
    {label: '性别', value: user.sex === '1' ? '男' : user.sex === '2' ? '女' : '未设置'},
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        },
      ]}>
      {/* 头像 + 昵称卡片 */}
      <View style={styles.profileCard}>
        {user.face ? (
          <Image source={{uri: user.face}} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <Text style={styles.nickname}>{user.nickname}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.{user.level}</Text>
        </View>
      </View>

      {/* 信息列表 */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>账号信息</Text>
        {infoItems.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.infoRow,
              index < infoItems.length - 1 && styles.infoRowBorder,
            ]}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* 设置入口 */}
      <Pressable
        style={({pressed}) => [
          styles.menuItem,
          pressed && styles.menuItemPressed,
        ]}
        onPress={onOpenSettings}>
        <Text style={styles.menuIcon}>⚙️</Text>
        <Text style={styles.menuText}>设置</Text>
        <Text style={styles.menuArrow}>›</Text>
      </Pressable>

      {/* 退出按钮 */}
      <Pressable
        style={({pressed}) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
        onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>退出登录</Text>
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
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 32,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  nickname: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A90D9',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
  },
  infoValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemPressed: {
    opacity: 0.7,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
  },
  menuArrow: {
    fontSize: 22,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  logoutButtonPressed: {
    backgroundColor: '#fff5f5',
  },
  logoutButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
});