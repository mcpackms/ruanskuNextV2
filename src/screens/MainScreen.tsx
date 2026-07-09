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
import {BlurView} from '@sbaiahmed1/react-native-blur';

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
const TABS: {key: Tab; label: string}[] = [
  {key: 'community', label: '社区'},
  {key: 'family', label: '家族'},
  {key: 'profile', label: '我的'},
];
const TAB_COUNT = TABS.length;
const BAR_H_MARGIN = 16;
const SLIDER_H_MARGIN = 6;

export default function MainScreen({user, onLogout}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [barWidth, setBarWidth] = useState(0);
  const [bgUri, setBgUri] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadBackgroundUri().then(setBgUri);
  }, []);

  const segW = barWidth / TAB_COUNT;
  const sliderW = Math.max(0, segW - SLIDER_H_MARGIN * 2);

  // ---- 滑动动画 ----
  const slideX = useRef(new Animated.Value(0)).current;
  const slideVal = useRef(0);
  useEffect(() => {
    const id = slideX.addListener(v => {
      slideVal.current = v.value;
    });
    return () => slideX.removeListener(id);
  }, [slideX]);

  const segWRef = useRef(0);
  useEffect(() => {
    segWRef.current = segW;
  }, [segW]);

  const snap = useCallback(
    (idx: number) => {
      Animated.spring(slideX, {
        toValue: idx * segWRef.current,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }).start();
    },
    [slideX],
  );

  // ---- 手势（点击 + 拖拽） ----
  const touchX = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: e => {
        touchX.current = e.nativeEvent.locationX;
      },
      onPanResponderMove: (_, g) => {
        const sw = segWRef.current || 1;
        slideX.setValue(
          Math.max(0, Math.min((TAB_COUNT - 1) * sw, slideVal.current + g.dx)),
        );
      },
      onPanResponderRelease: (_, g) => {
        const sw = segWRef.current || 1;
        let idx: number;
        if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
          idx = Math.min(TAB_COUNT - 1, Math.max(0, Math.floor(touchX.current / sw)));
        } else {
          idx = Math.round(
            Math.max(0, Math.min((TAB_COUNT - 1) * sw, slideVal.current + g.dx)) / sw,
          );
        }
        setActiveTab(TABS[idx].key);
        setShowSettings(false);
        snap(idx);
      },
    }),
  ).current;

  // ---- 布局 ----
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const {width} = e.nativeEvent.layout;
    if (width > 0) setBarWidth(width);
  }, []);

  const renderScreen = () => {
    if (activeTab === 'community') return <CommunityScreen />;
    if (activeTab === 'family') return <FamilyScreen />;
    if (showSettings) {
      return (
        <SettingsScreen
          onBack={() => setShowSettings(false)}
          onBackgroundChange={setBgUri}
        />
      );
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
    <View style={[styles.root, !bgUri && styles.rootBg]}>
      {/* 全屏背景图 */}
      {bgUri && (
        <Image
          source={{uri: bgUri}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      )}

      {/* 内容区 */}
      <View style={styles.content}>{renderScreen()}</View>

      {/* 底部悬浮导航栏 */}
      <View style={[styles.barArea, {paddingBottom: insets.bottom + 6}]}>
        <View style={styles.barShadow}>
          <View style={styles.barInner} onLayout={onLayout} {...pan.panHandlers}>
            <BlurView blurType="light" blurAmount={32} style={styles.blur}>
              {barWidth > 0 && (
                <Animated.View
                  style={[
                    styles.slider,
                    {width: sliderW, transform: [{translateX: slideX}]},
                  ]}
                />
              )}
              {TABS.map(t => (
                <View key={t.key} style={styles.tabItem}>
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === t.key && styles.tabLabelActive,
                    ]}>
                    {t.label}
                  </Text>
                </View>
              ))}
            </BlurView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootBg: {
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingBottom: 80,
    backgroundColor: 'transparent',
  },

  /* ---- 导航栏 ---- */
  barArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  barShadow: {
    marginHorizontal: BAR_H_MARGIN,
    borderRadius: 28,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  barInner: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SLIDER_H_MARGIN,
    borderRadius: 28,
  },

  /* ---- 滑块 ---- */
  slider: {
    position: 'absolute',
    left: SLIDER_H_MARGIN,
    top: 4,
    bottom: 4,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },

  /* ---- 标签 ---- */
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  tabLabelActive: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
