import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  LayoutChangeEvent,
  Platform,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {LiquidGlassView} from '@sbaiahmed1/react-native-blur';

import CommunityScreen from './CommunityScreen';
import FamilyScreen from './FamilyScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import type {UserInfo} from '../types';

interface Props {
  user: UserInfo;
  onLogout: () => void;
}

type Tab = 'community' | 'family' | 'profile';

const TABS: {key: Tab; label: string}[] = [
  {key: 'community', label: '社区'},
  {key: 'family', label: '家族'},
  {key: 'profile', label: '我的'},
];

const TAB_COUNT = TABS.length;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_PADDING = 14;

export default function MainScreen({user, onLogout}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [showSettings, setShowSettings] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const segWRef = useRef(0);

  const segmentWidth = barWidth > 0 ? barWidth / TAB_COUNT : 0;
  const sliderWidth = segmentWidth > SLIDER_PADDING * 2 ? segmentWidth - SLIDER_PADDING * 2 : 0;

  // 测量导航栏宽度
  const handleBarLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      setBarWidth(w);
      segWRef.current = w / TAB_COUNT;
    }
  }, []);

  // 切换标签
  const handleTabPress = useCallback((tab: Tab) => {
    setShowSettings(false);
    setActiveTab(tab);
  }, []);

  // 滑块动画
  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === activeTab);
    if (idx < 0 || segWRef.current <= 0) return;
    Animated.spring(slideAnim, {
      toValue: idx * segWRef.current,
      useNativeDriver: true,
      tension: 25,
      friction: 20,
      mass: 1.5,
    }).start();
  }, [activeTab, slideAnim]);

  const renderScreen = () => {
    if (activeTab === 'community') return <CommunityScreen />;
    if (activeTab === 'family') return <FamilyScreen />;

    if (showSettings) {
      return <SettingsScreen onBack={() => setShowSettings(false)} />;
    }

    return (
      <ProfileScreen
        user={user}
        onLogout={onLogout}
        onOpenSettings={() => setShowSettings(true)}
      />
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.mainContent}>{renderScreen()}</View>

      {/* 导航栏 */}
      <View
        style={[
          styles.barPosition,
          {paddingBottom: Math.max(insets.bottom, 8) + 8},
        ]}>
        <View
          style={styles.barOuter}
          onLayout={handleBarLayout}>
          <LiquidGlassView
            glassType="regular"
            glassTintColor="#FFFFFF"
            glassOpacity={0.08}
            style={styles.glass}>
            {/* 滑块 */}
            {barWidth > 0 && sliderWidth > 0 && (
              <Animated.View
                style={[
                  styles.slider,
                  {
                    width: sliderWidth,
                    transform: [{translateX: slideAnim}],
                  },
                ]}
              />
            )}

            {/* 标签 */}
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}>
                  <Text
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </LiquidGlassView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mainContent: {
    flex: 1,
    paddingBottom: 90,
    backgroundColor: 'transparent',
  },

  /* 导航栏定位 */
  barPosition: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },

  /* 外层容器 */
  barOuter: {
    width: SCREEN_WIDTH - 8,
    borderRadius: 28,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  /* 毛玻璃 */
  glass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SLIDER_PADDING,
    borderRadius: 28,
    minHeight: 60,
  },

  /* 滑块 - 透明+边框 */
  slider: {
    position: 'absolute',
    left: SLIDER_PADDING,
    top: 8,
    bottom: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },

  /* 标签项 */
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    zIndex: 1,
  },

  /* 标签文字 */
  tabLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.45)',
  },
  tabLabelActive: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
});
