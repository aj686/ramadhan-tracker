import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoBack } from '@/hooks/use-go-back';
import { useTheme } from '@/hooks/use-theme';
import { LegalLanguage, PRIVACY_LAST_UPDATED, PRIVACY_POLICY, SUPPORT_EMAIL } from '@/constants/legal';
import { borderRadius, spacing, typography } from '@/constants/theme';

const LANGUAGES: { value: LegalLanguage; label: string }[] = [
  { value: 'ms', label: 'BM' },
  { value: 'en', label: 'EN' },
];

// Public on purpose: Play Console needs a privacy URL that opens without signing in.
export default function PrivacyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack('/');
  const [language, setLanguage] = useState<LegalLanguage>('ms');
  const policy = PRIVACY_POLICY[language];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={goBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{policy.title}</Text>
        <View style={styles.languageRow}>
          {LANGUAGES.map((option) => {
            const isActive = option.value === language;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setLanguage(option.value)}
                style={[styles.languageBtn, { backgroundColor: isActive ? colors.primary : colors.primaryMuted }]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.languageText, { color: isActive ? colors.textOnPrimary : colors.text }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}>
        <Text style={[styles.updated, { color: colors.textMuted }]}>{PRIVACY_LAST_UPDATED}</Text>
        <Text style={[styles.body, { color: colors.text }]}>{policy.intro}</Text>
        {policy.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={[styles.heading, { color: colors.text }]}>{section.heading}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{section.body}</Text>
          </View>
        ))}
        {SUPPORT_EMAIL !== '' && (
          <View style={styles.section}>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{policy.contact}</Text>
            <Text style={[styles.heading, { color: colors.text }]}>{SUPPORT_EMAIL}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...typography.title3, flex: 1 },
  languageRow: { flexDirection: 'row', gap: spacing.xs },
  languageBtn: {
    minWidth: 44,
    minHeight: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  languageText: { ...typography.footnote, fontWeight: '700' },
  content: { paddingHorizontal: spacing.xl, gap: spacing.md },
  updated: { ...typography.caption },
  section: { gap: spacing.xs, marginTop: spacing.sm },
  heading: { ...typography.headline },
  body: { ...typography.subhead, lineHeight: 22 },
});
