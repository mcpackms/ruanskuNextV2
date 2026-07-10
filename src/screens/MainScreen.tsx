/**
 * MainScreen - 主页面（完全重写）
 *
 * 三标签底部导航：社区（帖子列表）、家族、我的
 * - 毛玻璃底部导航栏 + 弹性滑块
 * - 每个标签页使用 lazy mount 优化性能
 * - 统一的安全区域处理
 */

import React, {useState, useCallback, useRef, useEffect, memo} from 'react';
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

// ─── 常量 ──────────────────────────────────────────────────────────
interface Props {
  user: UserInfo;
  onLogout: () => void;
}

type Tab = 'community' | 'family' | 'profile';

interface TabConfig {
  key: Tab;
  label: string;
  icon: string; // emoji icon for simplicity (no icon library dep)
  iconActive: string;
}

const TABS: TabConfig[] = [
  {key: 'community', label: '社区', icon: '🌐', iconActive: '🌍'},
  {key: 'family', label: '家族', icon: '👥', iconActive: '👪'},
  {key: 'profile', label: '我的', icon: '👤', iconActive: '🌟'},
];

const TAB_COUNT = TABS.length;
const SCREEN_WIDTH = Dimensions.get('window').width;

// 导航栏尺寸常量
const BAR_HORIZONTAL_MARGIN = 8;
const BAR_BORDER_RADIUS = 32;
const SLIDER_PADDING = 6;
const TAB_PADDING_VERTICAL = 10;

// ─── 组件 ──────────────────────────────────────────────────────────

/** 单个标签按钮（memo 防重复渲染） */
const TabButton = memo(
  ({
    tab,
    isActive,
    onPress,
  }: {
    tab: TabConfig;
    isActive: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      style={styles.tabItem}
      onPress={onPress}
      android_ripple={{color: 'rgba(0,0,0,0.08)', borderless: true}}>
      <Text style={styles.tabIcon}>{isActive ? tab.iconActive : tab.icon}</Text>
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
        {tab.label}
      </Text>
    </Pressable>
  ),
);

// ─── 主组件 ────────────────────────────────────────────────────────

export default function MainScreen({user, onLogout}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [showSettings, setShowSettings] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  // 动画值
  const slideAnim = useRef(new Animated.Value(0)).current;
  const segWRef = useRef(0);

  // 已挂载的 tab（lazy mount）
  const mountedTabs = useRef<Set<Tab>>(new Set(['community']));

  // 导航栏宽度测量
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
    mountedTabs.current.add(tab);
    setActiveTab(tab);
  }, []);

  // 滑块弹性动画
  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === activeTab);
    if (idx < 0 || segWRef.current <= 0) return;

    Animated.spring(slideAnim, {
      toValue: idx * segWRef.current,
      useNativeDriver: true,
      tension: 40,
      friction: 12,
      mass: 0.8,
    }).start();
  }, [activeTab, slideAnim]);

  // 动态滑块尺寸
  const segmentWidth = barWidth > 0 ? barWidth / TAB_COUNT : 0;
  const sliderWidth = segmentWidth > SLIDER_PADDING * 2 ? segmentWidth - SLIDER_PADDING * 2 : 0;

  // 返回按钮
  const handleBackFromSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  // ── 渲染当前页面 ──

  const renderScreen = () => {
    // Settings 页面覆盖在 profile tab 之上
    if (showSettings) {
      return <SettingsScreen onBack={handleBackFromSettings} />;
    }

    switch (activeTab) {
      case 'community':
        return <CommunityScreen />;
      case 'family':
        return <FamilyScreen />;
      case 'profile':
        return (
          <ProfileScreen
            user={user}
            onLogout={onLogout}
            onOpenSettings={() => setShowSettings(true)}
          />
        );
      default:
        return null;
    }
  };

  // ── 渲染 ──

  return (
    <View style={styles.root}>
      {/* 主内容区域 */}
      <View style={styles.mainContent}>{renderScreen()}</View>

      {/* 底部导航栏 */}
      <View
        style={[
          styles.barContainer,
          {paddingBottom: Math.max(insets.bottom, 6) + 10},
        ]}>
        <View
          style={styles.barOuter}
          onLayout={handleBarLayout}>
          <LiquidGlassView
            glassType="regular"
            glassTintColor="#FFFFFF"
            glassOpacity={0.12}
            style={styles.glass}>
            {/* 滑动指示器 */}
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

            {/* 标签按钮 */}
            {TABS.map(tab => (
              <TabButton
                key={tab.key}
                tab={tab}
                isActive={activeTab === tab.key}
                onPress={() => handleTabPress(tab.key)}
              />
            ))}
          </LiquidGlassView>
        </View>
      </View>
    </View>
  );
}

// ─── 样式 ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // 主内容
  mainContent: {
    flex: 1,
    paddingBottom: 80,
  },

  // ── 底部导航栏 ──

  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  barOuter: {
    width: SCREEN_WIDTH - BAR_HORIZONTAL_MARGIN * 2,
    borderRadius: BAR_BORDER_RADIUS,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  glass: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TAB_PADDING_VERTICAL,
    paddingHorizontal: SLIDER_PADDING + 4,
    borderRadius: BAR_BORDER_RADIUS,
    minHeight: 64,
  },

  // 滑块
  slider: {
    position: 'absolute',
    left: SLIDER_PADDING + 4,
    top: SLIDER_PADDING,
    bottom: SLIDER_PADDING,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // 标签项
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 1,
  },

  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },

  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.45)',
    marginTop: 1,
  },

  tabLabelActive: {
    color: '#1a1a1a',
    fontWeight: '700',
    fontSize: 13,
  },
});
