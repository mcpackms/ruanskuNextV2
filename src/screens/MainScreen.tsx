import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  Platform,
  ImageBackground,
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

  // 动画值：滑块 translateX
  const sliderTranslateX = useRef(new Animated.Value(0)).current;

  // 追踪当前滑块位置
  const sliderValueRef = useRef(0);
  useEffect(() => {
    const listener = sliderTranslateX.addListener(({value}) => {
      sliderValueRef.current = value;
    });
    return () => sliderTranslateX.removeListener(listener);
  }, [sliderTranslateX]);

  // 用 ref 保存 sectionWidth
  const sectionWidthRef = useRef(0);
  useEffect(() => {
    sectionWidthRef.current = sectionWidth;
  }, [sectionWidth]);

  // 触摸起始位置（用于区分点击/拖拽）
  const touchStartXRef = useRef(0);

  // 拖拽+点击统一手势（放在整个导航栏上）
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

      onPanResponderRelease: (evt, gesture) => {
        const sw = sectionWidthRef.current || 1;

        // 判断是点击还是拖拽
        const isTap = Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5;

        let tabIndex: number;

        if (isTap) {
          // 点击：根据触摸位置计算
          tabIndex = Math.floor(
            Math.min(
              TAB_COUNT - 1,
              Math.max(0, touchStartXRef.current / sw),
            ),
          );
        } else {
          // 拖拽：根据滑块最终位置计算
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
      return (
        <SettingsScreen
          onBack={handleCloseSettings}
          onBackgroundChange={handleBackgroundChange}
        />
      );
    }
    return (
      <ProfileScreen
        user={user}
        onLogout={handleLogout}
        onOpenSettings={handleOpenSettings}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* 内容区域 */}
      <View style={styles.content}>
        {bgUri ? (
          <ImageBackground
            source={{uri: bgUri}}
            style={styles.bgImage}
            resizeMode="cover">
            {activeTab === 'community' && <CommunityScreen />}
            {activeTab === 'family' && <FamilyScreen />}
            {activeTab === 'profile' && renderProfileContent()}
          </ImageBackground>
        ) : (
          <>
            {activeTab === 'community' && <CommunityScreen />}
            {activeTab === 'family' && <FamilyScreen />}
            {activeTab === 'profile' && renderProfileContent()}
          </>
        )}
      </View>

      {/* ========== 底部悬浮凸玻璃导航栏 ========== */}
      <View
        style={[styles.tabBarArea, {paddingBottom: insets.bottom + 8}]}
        {...panResponder.panHandlers}>
        <View style={styles.tabBarFloat} onLayout={handleLayout}>
          <LiquidGlassView
            glassType="regular"
            glassTintColor="#FFFFFF"
            glassOpacity={0.8}
            style={styles.tabBar}>
            {/* 磨砂滑块（纯视觉指示，手势由外层处理） */}
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

            {/* 标签文字 */}
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
  bgImage: {
    flex: 1,
  },

  /* ---------- 悬浮导航栏容器（响应手势） ---------- */
  tabBarArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
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
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },

  /* ---------- 液态玻璃导航栏 ---------- */
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingVertical: 4,
    paddingHorizontal: SLIDER_H_MARGIN,
    borderRadius: 24,
  },

  /* ---------- 滑块（磨砂效果） ---------- */
  slider: {
    position: 'absolute',
    left: SLIDER_H_MARGIN,
    height: 36,
    top: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
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
