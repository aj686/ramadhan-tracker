import React, { useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuth();

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const result = await register(email.trim(), password);

    if (!result.success) {
      Alert.alert('Registration Failed', result.error || 'Please try again');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0A1F13', '#0F2D1B', '#0A1F13']
          : ['#ECFDF5', '#D1FAE5', '#A7F3D0']
        }
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logoCircle,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons name="moon" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start tracking your children's Ramadan
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                borderColor: colors.glassBorder,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={styles.formBlur}
            >
              <View style={[styles.formContent, { backgroundColor: colors.glass }]}>
                <Text style={[styles.formTitle, { color: colors.text }]}>
                  Sign Up
                </Text>

                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
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
                      editable={!isLoading}
                    />
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Password"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.primaryMuted },
                    ]}
                  >
                    <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Confirm Password"
                      placeholderTextColor={colors.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: colors.primary },
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>

          {/* Login Link */}
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isLoading}
            style={styles.linkContainer}
          >
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
              <Text style={[styles.linkBold, { color: colors.primary }]}>
                Login
              </Text>
            </Text>
          </TouchableOpacity>

          <View style={{ height: insets.bottom + spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.largeTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subhead,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  formCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  formBlur: {
    overflow: 'hidden',
  },
  formContent: {
    padding: spacing.xl,
  },
  formTitle: {
    ...typography.title2,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  inputGroup: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.headline,
    color: '#FFFFFF',
  },
  linkContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  linkText: {
    ...typography.subhead,
  },
  linkBold: {
    fontWeight: '600',
  },
});
