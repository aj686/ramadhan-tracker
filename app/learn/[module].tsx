import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { LearningCard } from '@/components/learning-card';
import { borderRadius, spacing, typography } from '@/constants/theme';
import type { ModuleId, LearningItem, AllahName, Prophet } from '@/types';

import { animals } from '@/data/animals';
import { allahNames } from '@/data/allah-names';
import { prophets } from '@/data/prophets';
import { transport } from '@/data/transport';
import { countries } from '@/data/countries';

const MODULE_META: Record<ModuleId, { title: string; emoji: string; color: string }> = {
  animals:     { title: 'Animals',           emoji: '🐾', color: '#22C55E' },
  allah_names: { title: '99 Names of Allah', emoji: '📿', color: '#8B5CF6' },
  prophets:    { title: 'Prophets & Rasul',  emoji: '👳', color: '#F59E0B' },
  transport:   { title: 'Transport',         emoji: '🚗', color: '#06B6D4' },
  countries:   { title: 'Countries',         emoji: '🌍', color: '#3B82F6' },
};

function getModuleData(moduleId: ModuleId): (LearningItem | AllahName | Prophet)[] {
  switch (moduleId) {
    case 'animals':     return animals;
    case 'allah_names': return allahNames;
    case 'prophets':    return prophets;
    case 'transport':   return transport;
    case 'countries':   return countries;
  }
}

export default function ModuleScreen() {
  const { module } = useLocalSearchParams<{ module: string }>();
  const moduleId = module as ModuleId;
  const meta = MODULE_META[moduleId];
  const data = getModuleData(moduleId);

  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!meta) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Module not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0F172A', '#1E293B', '#0F172A']
          : ['#F0FFF4', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={meta.color} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{meta.emoji}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{meta.title}</Text>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {data.length} items
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Card Grid */}
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <LearningCard moduleId={moduleId} item={item as any} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerEmoji: { fontSize: 28 },
  headerTitle: { ...typography.headline, marginTop: 2 },
  headerCount: { ...typography.caption, marginTop: 2 },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingTop: spacing.md,
  },
});
