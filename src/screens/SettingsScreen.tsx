import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface Props {
  onBack: () => void;
}

export default function SettingsScreen({onBack}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        },
      ]}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <Pressable
          style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backText}>返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 设置内容 */}
      <View style={styles.contentCard}>
        <Text style={styles.sectionTitle}>通用设置</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>版本</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </View>
      </View>
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
  headerSpacer: {
    width: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backArrow: {
    fontSize: 28,
    color: '#4A90D9',
    marginRight: 2,
    lineHeight: 28,
  },
  backText: {
    fontSize: 16,
    color: '#4A90D9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: '#666',
  },
  settingValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
});
