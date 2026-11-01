import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { useGoBack } from '@/hooks/use-go-back';
import { useTheme } from '@/hooks/use-theme';
import { Alert } from '@/services/alert';
import { borderRadius, spacing, typography } from '@/constants/theme';

const CONFIRM_WORD = 'DELETE';

// Public on purpose: Play requires a web link that explains how to delete an account.
// Signed-out visitors see the steps; signed-in parents can delete from here.
export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const goBack = useGoBack('/');
  const { isAuthenticated, deleteAccount } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD && !isDeleting;

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    const result = await deleteAccount();
    setIsDeleting(false);
    if (result.success) {
      Alert.alert('Account deleted', 'Your account and all your children\'s records have been removed.');
    } else {
      Alert.alert('Could not delete the account', 'Nothing was removed. Please check your connection and try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={goBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Delete Account</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.body, { color: colors.text }]}>
          This permanently removes your MyLittleMuslim account, your children&apos;s profiles, and all their
          fasting, solat, sunat, Quran, doa and reward records. It cannot be undone.
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Akaun MyLittleMuslim anda, profil anak-anak dan semua rekod puasa, solat, sunat, Quran, doa dan ganjaran
          akan dipadam secara kekal. Tindakan ini tidak boleh dibatalkan.
        </Text>

        {isAuthenticated ? (
          <>
            <Text style={[styles.label, { color: colors.text }]}>
              Type {CONFIRM_WORD} to confirm
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isDeleting}
              placeholder={CONFIRM_WORD}
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={`Type ${CONFIRM_WORD} to confirm`}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.error }, !canDelete && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={!canDelete}
              accessibilityRole="button"
            >
              {isDeleting ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>Delete my account</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              To delete your account, sign in, then go to Profile and choose Delete Account.
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.replace('/(auth)/login')}
              accessibilityRole="button"
            >
              <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>Sign in</Text>
            </TouchableOpacity>
          </>
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
  content: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  body: { ...typography.subhead, lineHeight: 22 },
  label: { ...typography.headline, marginTop: spacing.sm },
  input: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: borderRadius.md,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { ...typography.headline },
});
