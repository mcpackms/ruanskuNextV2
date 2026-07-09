import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {LiquidGlassView} from '@sbaiahmed1/react-native-blur';

import CommunityScreen from './CommunityScreen';
import FamilyScreen from './FamilyScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen';
import type {UserInfo} from '../types';
import {loadBackgroundUri} from '../services/storage';

interface Props {
  user: UserInfo;
  onLogout: () => void;
}

type Tab = 'community' | 'family' | 'profile';

const TAB_CONFIG: {key: Tab; label: string}[] = [
  {key: 'community', label: '社区'},
  {key: 'family', label: '家族'},
  {key: 'profile', label: '我的'},
];

const TAB_COUNT = TAB_CONFIG.length;
const SLIDER_H_MARGIN = 14;

export default function MainScreen({user, onLogout}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const [bgUri, setBgUri] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 加载已保存的背景图
  useEffect(() => {
    loadBackgroundUri().then(setBgUri);
  }, []);

  const sectionWidth = tabBarWidth / TAB_COUNT;
  const sliderWidth = tabBarWidth > 0 ? sectionWidth - SLIDER_H_MARGIN * 2 : 0;

  // 动画值
  const sliderTranslateX = useRef(new Animated.Value(0)).current;

  // 追踪当前滑块位置
  const sliderValueRef = useRef(0);
  useEffect(() => {
    const listener = sliderTranslateX.addListener(({value}) => {
      sliderValueRef.current = value;
    });
    return () => sliderTranslateX.removeListener(listener);
  }, [sliderTranslateX]);

  // ref 保存 sectionWidth
  const sectionWidthRef = useRef(0);
  useEffect(() => {
    sectionWidthRef.current = sectionWidth;
  }, [sectionWidth]);

  // 触摸起始位置
  const touchStartXRef = useRef(0);

  // 统一手势（拖拽+点击）
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: evt => {
        touchStartXRef.current = evt.nativeEvent.locationX;
      },

      onPanResponderMove: (_, gesture) => {
        const sw = sectionWidthRef.current || 1;
        const maxTranslate = (TAB_COUNT - 1) * sw;
        const newValue = Math.max(
          0,
          Math.min(maxTranslate, sliderValueRef.current + gesture.dx),
        );
        sliderTranslateX.setValue(newValue);
      },

      onPanResponderRelease: (_, gesture) => {
        const sw = sectionWidthRef.current || 1;
        const isTap = Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5;

        let tabIndex: number;
        if (isTap) {
          tabIndex = Math.floor(
            Math.min(
              TAB_COUNT - 1,
              Math.max(0, touchStartXRef.current / sw),
            ),
          );
        } else {
          const finalX = Math.max(
            0,
            Math.min(
              (TAB_COUNT - 1) * sw,
              sliderValueRef.current + gesture.dx,
            ),
          );
          tabIndex = Math.round(finalX / sw);
        }

        const targetTab = TAB_CONFIG[tabIndex].key;
        setActiveTab(targetTab);
        setShowSettings(false);

        Animated.spring(sliderTranslateX, {
          toValue: tabIndex * sw,
          useNativeDriver: true,
          tension: 100,
          friction: 12,
        }).start();
      },
    }),
  ).current;

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const {width} = e.nativeEvent.layout;
    if (width > 0) {
      setTabBarWidth(width);
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleBackgroundChange = useCallback((uri: string | null) => {
    setBgUri(uri);
  }, []);

  const renderProfileContent = () => {
    if (showSettings) {
      return <SettingsScreen onBack={handleCloseSettings} onBackgroundChange={handleBackgroundChange} />;
    }
    return <ProfileScreen user={user} onLogout={handleLogout} onOpenSettings={handleOpenSettings} />;
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'community':
        return <CommunityScreen />;
      case 'family':
        return <FamilyScreen />;
      case 'profile':
        return renderProfileContent();
    }
  };

  return (
    <View style={styles.container}>
      {/* ===== 内容区域 ===== */}
      <View style={styles.content}>
        {/* 底层：默认背景 */}
        <View style={styles.contentBg} />

        {/* 中层：自定义背景图 */}
        {bgUri && (
          <Image
            source={{uri: bgUri}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}

        {/* 顶层：页面内容 */}
        <View style={styles.screenContainer}>{renderActiveScreen()}</View>
      </View>

      {/* ===== 底部悬浮凸玻璃导航栏 ===== */}
      <View style={[styles.tabBarArea, {paddingBottom: insets.bottom + 8}]}>
        <View
          style={styles.tabBarFloat}
          onLayout={handleLayout}
          {...panResponder.panHandlers}>
          <LiquidGlassView
            glassType="regular"
            glassTintColor="#FFFFFF"
            glassOpacity={0.75}
            style={styles.tabBar}>
            {/* 滑块 */}
            {tabBarWidth > 0 && (
              <Animated.View
                style={[
                  styles.slider,
                  {
                    width: sliderWidth,
                    transform: [{translateX: sliderTranslateX}],
                  },
                ]}
              />
            )}

            {/* 标签 */}
            {TAB_CONFIG.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <View key={tab.key} style={styles.tabItem}>
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}>
                    {tab.label}
                  </Text>
                </View>
              );
            })}
          </LiquidGlassView>
        </View>
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
    paddingBottom: 80,
  },
  contentBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  /* ---------- 悬浮导航栏 ---------- */
  tabBarArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },

  /* ---------- 悬浮凸玻璃导航栏 ---------- */
  tabBarFloat: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  /* ---------- 液态玻璃 ---------- */
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingVertical: 4,
    paddingHorizontal: SLIDER_H_MARGIN,
    borderRadius: 24,
  },

  /* ---------- 滑块 ---------- */
  slider: {
    position: 'absolute',
    left: SLIDER_H_MARGIN,
    height: 36,
    top: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  /* ---------- 标签 ---------- */
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
