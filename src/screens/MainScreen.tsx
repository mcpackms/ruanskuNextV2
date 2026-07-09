import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  Pressable,
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

  // 动画值：滑块 translateX（相对最左位置）
  const sliderTranslateX = useRef(new Animated.Value(0)).current;

  // 追踪当前滑块位置（给 PanResponder 用）
  const sliderValueRef = useRef(0);
  useEffect(() => {
    const listener = sliderTranslateX.addListener(({value}) => {
      sliderValueRef.current = value;
    });
    return () => sliderTranslateX.removeListener(listener);
  }, [sliderTranslateX]);

  // 用 ref 保存 sectionWidth，避免 PanResponder 闭包过期
  const sectionWidthRef = useRef(0);
  useEffect(() => {
    sectionWidthRef.current = sectionWidth;
  }, [sectionWidth]);

  // 拖拽手势
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
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
        const finalX = Math.max(
          0,
          Math.min(
            (TAB_COUNT - 1) * sw,
            sliderValueRef.current + gesture.dx,
          ),
        );
        const tabIndex = Math.round(finalX / sw);
        const targetTab = TAB_CONFIG[tabIndex].key;

        setActiveTab(targetTab);

        Animated.spring(sliderTranslateX, {
          toValue: tabIndex * sw,
          useNativeDriver: true,
          tension: 100,
          friction: 12,
        }).start();
      },
    }),
  ).current;

  // 点击标签切换（带动画）
  const switchToTab = useCallback(
    (tabKey: Tab) => {
      setActiveTab(tabKey);
      setShowSettings(false); // 切换标签时关闭设置页
      const tabIndex = TAB_CONFIG.findIndex(t => t.key === tabKey);
      const sw = sectionWidthRef.current || 1;
      Animated.spring(sliderTranslateX, {
        toValue: tabIndex * sw,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }).start();
    },
    [sliderTranslateX],
  );

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const {width} = e.nativeEvent.layout;
    if (width > 0) {
      setTabBarWidth(width);
    }
  }, []);

  const handleTabPress = useCallback(
    (tabKey: Tab) => {
      switchToTab(tabKey);
    },
    [switchToTab],
  );

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  const handleBackgroundChange = useCallback((uri: string | null) => {
    setBgUri(uri);
  }, []);

  // 渲染 "我的" 标签下的内容
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
      {/* 内容区域（带自定义背景） */}
      <View style={styles.content}>
        {bgUri ? (
          <ImageBackground source={{uri: bgUri}} style={styles.bgImage} resizeMode="cover">
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

      {/* ========== 底部凸玻璃导航栏 ========== */}
      <View
        style={[
          styles.tabBarWrapper,
          {paddingBottom: insets.bottom + 4},
        ]}>
        <View onLayout={handleLayout}>
          <LiquidGlassView
            glassType="regular"
            glassTintColor="#FFFFFF"
            glassOpacity={0.85}
            style={styles.tabBar}>
            {/* 可拖拽滑块 */}
            {tabBarWidth > 0 && (
              <Animated.View
                style={[
                  styles.slider,
                  {
                    width: sliderWidth,
                    transform: [{translateX: sliderTranslateX}],
                  },
                ]}
                {...panResponder.panHandlers}
              />
            )}

            {/* 标签 */}
            {TAB_CONFIG.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}>
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  bgImage: {
    flex: 1,
  },

  /* ---------- 凸玻璃容器（阴影层） ---------- */
  tabBarWrapper: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },

  /* ---------- 液态玻璃导航栏 ---------- */
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: SLIDER_H_MARGIN,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  /* ---------- 滑块 ---------- */
  slider: {
    position: 'absolute',
    left: SLIDER_H_MARGIN,
    height: 34,
    top: 4,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
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
    color: 'rgba(0,0,0,0.45)',
  },
  tabLabelActive: {
    color: '#4A90D9',
    fontWeight: '700',
    fontSize: 14,
  },
});
