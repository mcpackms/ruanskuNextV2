/**
 * CommunityScreen - 社区（帖子流）
 *
 * 功能开发中，展示占位 UI。后续接入帖子列表 API。
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, {paddingTop: insets.top + 20}]}>
      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>社区</Text>
        <Text style={styles.subtitle}>发现精彩内容</Text>
      </View>

      {/* 占位卡片 */}
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderIcon}>🚀</Text>
        <Text style={styles.placeholderTitle}>即将上线</Text>
        <Text style={styles.placeholderDesc}>
          帖子列表、搜索、热门话题等功能正在开发中，敬请期待
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  placeholderCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  placeholderDesc: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
