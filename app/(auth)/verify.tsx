import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { verifyOtp, resendVerification, isLoading } = useAuth();

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '');
    if (!digit && text.length === 0) {
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
      if (index > 0) inputRefs.current[index - 1]?.focus();
      return;
    }
    if (!digit) return;

    const newCode = [...code];
    newCode[index] = digit[0];
    setCode(newCode);

    if (index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = code.join('');
    if (token.length < CODE_LENGTH) {
      Alert.alert('Error', 'Please enter the full 6-digit code');
      return;
    }

    const result = await verifyOtp(email || '', token);
    if (result.success) {
      // Auth state listener in use-auth will pick up the new session
      // and redirect to (tabs) automatically
    } else {
      Alert.alert('Verification Failed', result.error || 'Invalid code. Please try again.');
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    const result = await resendVerification(email || '');
    if (result.success) {
      Alert.alert('Code Sent', `A new verification code has been sent to ${email}`);
    } else {
      Alert.alert('Error', result.error || 'Could not resend code. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0F172A', '#1E293B', '#0F172A']
          : ['#F0FFF4', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top + spacing.xxxl }]}>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Icon & Title */}
          <View style={styles.headerSection}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="mail-open" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>
          </View>

          {/* Code Input */}
          <View style={[styles.codeCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
              <View style={[styles.codeContent, { backgroundColor: colors.glass }]}>
                <View style={styles.codeRow}>
                  {Array.from({ length: CODE_LENGTH }, (_, i) => (
                    <TextInput
                      key={i}
                      ref={(ref) => { inputRefs.current[i] = ref; }}
                      style={[
                        styles.codeInput,
                        {
                          backgroundColor: colors.primaryMuted,
                          color: colors.text,
                          borderColor: code[i] ? colors.primary : 'transparent',
                        },
                      ]}
                      value={code[i]}
                      onChangeText={(text) => handleChange(text, i)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                      keyboardType="number-pad"
                      maxLength={1}
                      editable={!isLoading}
                      autoFocus={i === 0}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.verifyBtn, { backgroundColor: colors.primary }, isLoading && styles.btnDisabled]}
                  onPress={handleVerify}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyBtnText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>

          {/* Resend link */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={isLoading}
            style={styles.resendContainer}
          >
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Didn't receive the code?{' '}
              <Text style={[styles.resendBold, { color: colors.primary }]}>Resend</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title2,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subhead,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emailText: {
    ...typography.headline,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  codeCard: {
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  blur: { overflow: 'hidden' },
  codeContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  codeInput: {
    width: 44,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  verifyBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
  },
  btnDisabled: { opacity: 0.6 },
  verifyBtnText: { ...typography.headline, color: '#FFFFFF' },
  resendContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  resendText: { ...typography.subhead },
  resendBold: { fontWeight: '600' },
});
