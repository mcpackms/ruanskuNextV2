import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
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

const TABS: {key: Tab; label: string; icon: string}[] = [
  {key: 'community', label: '社区', icon: '🏠'},
  {key: 'family', label: '家族', icon: '👨‍👩‍👧'},
  {key: 'profile', label: '我的', icon: '👤'},
];

const TAB_COUNT = TABS.length;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_HORIZONTAL_MARGIN = 4;
const SLIDER_PADDING = 14;

export default function MainScreen({user, onLogout}: Props) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - BAR_HORIZONTAL_MARGIN * 2);
  const [showSettings, setShowSettings] = useState(false);

  const segmentWidth = containerWidth / TAB_COUNT;
  const sliderWidth = segmentWidth - SLIDER_PADDING * 2;

  const slideAnim = useRef(new Animated.Value(0)).current;
  const currentSlideValue = useRef(0);

  useEffect(() => {
    const listener = slideAnim.addListener(({value}) => {
      currentSlideValue.current = value;
    });
    return () => slideAnim.removeListener(listener);
  }, [slideAnim]);

  const segmentWidthRef = useRef(segmentWidth);
  useEffect(() => {
    segmentWidthRef.current = segmentWidth;
  }, [segmentWidth]);

  const animateToTab = useCallback(
    (index: number) => {
      Animated.spring(slideAnim, {
        toValue: index * segmentWidthRef.current,
        useNativeDriver: true,
        tension: 25,
        friction: 20,
        mass: 1.5,
      }).start();
    },
    [slideAnim],
  );

  const touchStartX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        touchStartX.current = event.nativeEvent.locationX;
      },
      onPanResponderMove: (_, gestureState) => {
        const maxTranslate = (TAB_COUNT - 1) * segmentWidthRef.current;
        const newValue = Math.max(
          0,
          Math.min(maxTranslate, currentSlideValue.current + gestureState.dx),
        );
        slideAnim.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const sw = segmentWidthRef.current;
        const isTap = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;

        let targetIndex: number;
        if (isTap) {
          targetIndex = Math.floor(
            Math.min(TAB_COUNT - 1, Math.max(0, touchStartX.current / sw)),
          );
        } else {
          const finalPosition = Math.max(
            0,
            Math.min(
              (TAB_COUNT - 1) * sw,
              currentSlideValue.current + gestureState.dx,
            ),
          );
          targetIndex = Math.round(finalPosition / sw);
        }

        setActiveTab(TABS[targetIndex].key);
        setShowSettings(false);
        animateToTab(targetIndex);
      },
    }),
  ).current;

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const {width} = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  }, []);

  const renderActiveScreen = () => {
    if (activeTab === 'community') return <CommunityScreen />;
    if (activeTab === 'family') return <FamilyScreen />;

    if (showSettings) {
      return (
        <SettingsScreen
          onBack={() => setShowSettings(false)}
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
    <View style={[styles.root, styles.rootBackground]}>

      {/* 主内容区 */}
      <View style={styles.mainContent}>
        {renderActiveScreen()}
      </View>

      {/* 底部导航栏 */}
      <View
        style={[
          styles.tabBarContainer,
          {paddingBottom: Math.max(insets.bottom, 8) + 8},
        ]}>
        <View
          style={styles.tabBarFloat}
          onLayout={handleContainerLayout}
          {...panResponder.panHandlers}>
          <LiquidGlassView
            glassType="regular"
            glassTintColor="#FFFFFF"
            glassOpacity={0.08}
            style={styles.tabBar}>
            {/* 滑动指示器 */}
            {containerWidth > 0 && (
              <Animated.View
                style={[
                  styles.activeIndicator,
                  {
                    width: sliderWidth,
                    transform: [{translateX: slideAnim}],
                  },
                ]}
              />
            )}

            {/* 标签文字 */}
            <View style={styles.tabTextLayer}>
              {TABS.map((tab) => (
                <View key={tab.key} style={styles.tabItem}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === tab.key && styles.tabTextActive,
                    ]}>
                    {tab.label}
                  </Text>
                </View>
              ))}
            </View>
          </LiquidGlassView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootBackground: {
    backgroundColor: '#F5F5F5',
  },
  mainContent: {
    flex: 1,
    paddingBottom: 90,
    backgroundColor: 'transparent',
  },

  /* ---------- 导航栏容器 ---------- */
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },

  /* ---------- 悬浮导航栏 ---------- */
  tabBarFloat: {
    marginHorizontal: 4,
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

  /* ---------- 玻璃效果(毛玻璃) ---------- */
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SLIDER_PADDING,
    borderRadius: 28,
    minHeight: 60,
  },

  /* 文字层容器 */
  tabTextLayer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* 活跃指示器 - 透明+边框 */
  activeIndicator: {
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
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.45)',
  },
  tabTextActive: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
});
