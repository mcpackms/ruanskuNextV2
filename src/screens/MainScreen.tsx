import React, {useState, useCallback} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import CommunityScreen from './CommunityScreen';
import ProfileScreen from './ProfileScreen';
import type {UserInfo} from '../types';

interface Props {
  user: UserInfo;
  onLogout: () => void;
}

type Tab = 'community' | 'profile';

const TAB_CONFIG: {key: Tab; label: string}[] = [
  {key: 'community', label: '社区'},
  {key: 'profile', label: '我的'},
];

export default function MainScreen({user, onLogout}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('community');

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'community':
        return <CommunityScreen />;
      case 'profile':
        return <ProfileScreen user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* 内容区域 */}
      <View style={styles.content}>{renderScreen()}</View>

      {/* 底部导航栏 */}
      <View style={[styles.tabBar, {paddingBottom: insets.bottom + 8}]}>
        {TAB_CONFIG.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={({pressed}) => [
                styles.tabItem,
                pressed && styles.tabItemPressed,
              ]}
              onPress={() => setActiveTab(tab.key)}>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#4A90D9',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 2,
    backgroundColor: '#4A90D9',
    borderRadius: 1,
  },
});