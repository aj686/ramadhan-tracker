import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { useGoBack } from '@/hooks/use-go-back';
import { useTheme } from '@/hooks/use-theme';
import { Alert } from '@/services/alert';
import { borderRadius, spacing, typography } from '@/constants/theme';

const MIN_PASSWORD_LENGTH = 6;
const OTP_MIN_LENGTH = 6;

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack('/(auth)/login');
  const { requestPasswordReset, resetPassword } = useAuth();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const sendCode = async () => {
    if (isSubmitting) return;
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setIsSubmitting(true);
    const result = await requestPasswordReset(email.trim());
    setIsSubmitting(false);
    if (result.success) {
      setStep('code');
    } else {
      Alert.alert('Could not send the code', result.error || 'Please try again');
    }
  };

  const submitNewPassword = async () => {
    if (isSubmitting) return;
    if (code.trim().length < OTP_MIN_LENGTH) {
      Alert.alert('Error', 'Please enter the code from the email');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert('Error', `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    setIsSubmitting(true);
    const result = await resetPassword(email.trim(), code.trim(), password);
    setIsSubmitting(false);
    if (result.success) {
      Alert.alert('Password updated', 'You are now signed in with your new password.');
    } else {
      Alert.alert('Could not reset the password', result.error || 'Check the code and try again');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B', '#0F172A'] : ['#F0FFF4', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={goBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="key" size={34} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {step === 'email'
                ? 'Enter your email and we will send you a code.'
                : `If ${email.trim()} has an account, a code is on its way. Check your spam folder too.`}
            </Text>
          </View>

          <View style={[styles.formCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.formBlur}>
              <View style={[styles.formContent, { backgroundColor: colors.glass }]}>
                {step === 'email' ? (
                  <View style={[styles.inputContainer, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Email"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      returnKeyType="go"
                      onSubmitEditing={sendCode}
                      editable={!isSubmitting}
                    />
                  </View>
                ) : (
                  <>
                    <View style={[styles.inputContainer, { backgroundColor: colors.primaryMuted }]}>
                      <Ionicons name="keypad-outline" size={20} color={colors.textMuted} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Code from the email"
                        placeholderTextColor={colors.textMuted}
                        value={code}
                        onChangeText={setCode}
                        keyboardType="number-pad"
                        autoComplete="one-time-code"
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        editable={!isSubmitting}
                      />
                    </View>
                    <View style={[styles.inputContainer, { backgroundColor: colors.primaryMuted }]}>
                      <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                      <TextInput
                        ref={passwordRef}
                        style={[styles.input, { color: colors.text }]}
                        placeholder="New password"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoComplete="new-password"
                        returnKeyType="go"
                        onSubmitEditing={submitNewPassword}
                        editable={!isSubmitting}
                      />
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }, isSubmitting && styles.buttonDisabled]}
                  onPress={step === 'email' ? sendCode : submitNewPassword}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.textOnPrimary} />
                  ) : (
                    <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
                      {step === 'email' ? 'Send Code' : 'Save New Password'}
                    </Text>
                  )}
                </TouchableOpacity>

                {step === 'code' && (
                  <TouchableOpacity onPress={sendCode} disabled={isSubmitting} style={styles.resend}>
                    <Text style={[styles.resendText, { color: colors.primary }]}>Send a new code</Text>
                  </TouchableOpacity>
                )}
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start', marginBottom: spacing.md },
  headerSection: { alignItems: 'center', marginBottom: spacing.xxl },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.title2, textAlign: 'center' },
  subtitle: { ...typography.subhead, textAlign: 'center', marginTop: spacing.sm },
  formCard: {
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  formBlur: { overflow: 'hidden' },
  formContent: { padding: spacing.xl, gap: spacing.md },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  input: { flex: 1, ...typography.body },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...typography.headline },
  resend: { alignItems: 'center', paddingVertical: spacing.sm },
  resendText: { ...typography.subhead, fontWeight: '600' },
});
