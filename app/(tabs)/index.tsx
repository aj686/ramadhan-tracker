import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useChildren } from '@/hooks/use-children';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { Child } from '@/types';

// Cycling avatar colors per child index
const AVATAR_COLORS = [
  { bg: 'rgba(34,197,94,0.15)', fg: '#22C55E' },
  { bg: 'rgba(168,85,247,0.15)', fg: '#A855F7' },
  { bg: 'rgba(249,115,22,0.15)', fg: '#F97316' },
  { bg: 'rgba(59,130,246,0.15)', fg: '#3B82F6' },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { children, isLoading, fetchChildren, createChild, deleteChild, canAddChild, maxChildren, isPremium } = useChildren();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleAddChild = async () => {
    if (!newChildName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    setIsAdding(true);
    const result = await createChild({ name: newChildName.trim() });
    setIsAdding(false);
    if (result?.success) {
      setNewChildName('');
      setShowAddModal(false);
    } else {
      Alert.alert('Cannot Add Child', result?.error || 'Failed to add child');
    }
  };

  const handleDeleteChild = (child: Child) => {
    Alert.alert(
      'Remove Child',
      `Remove ${child.name}? All tracking data will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => { await deleteChild(child.id); },
        },
      ]
    );
  };

  const getAvatarColor = (index: number) => AVATAR_COLORS[index % AVATAR_COLORS.length];

  const renderChild = ({ item, index }: { item: Child; index: number }) => {
    const avatar = getAvatarColor(index);
    return (
      <View style={[styles.childCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.cardBlur}>
          <View style={[styles.cardContent, { backgroundColor: colors.glass }]}>
            <TouchableOpacity
              style={styles.cardMain}
              onPress={() => router.push(`/child/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.childAvatar, { backgroundColor: avatar.bg }]}>
                <Ionicons name="person" size={26} color={avatar.fg} />
              </View>
              <View style={styles.childInfo}>
                <Text style={[styles.childName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.childSub, { color: colors.textSecondary }]}>
                  Tap to view progress
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <View style={[styles.cardDivider, { backgroundColor: colors.borderLight }]} />
            <TouchableOpacity
              onPress={() => handleDeleteChild(item)}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Ionicons name="trash-outline" size={17} color={colors.error} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    );
  };

  const freeLimit = isPremium ? null : 2;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0F172A', '#1E293B', '#0F172A']
          : ['#F0FFF4', '#FFFFFF', '#FFF8F0']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>MyLittleMuslim</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Ramadan 2026 — 1447H
          </Text>
        </View>
        <View style={[styles.moonBadge, { backgroundColor: colors.primaryMuted }]}>
          <Text style={styles.moonEmoji}>🌙</Text>
        </View>
      </View>

      {/* Children list */}
      {isLoading && children.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={children}
          renderItem={renderChild}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          ListHeaderComponent={() => (
            <View style={styles.listHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Children
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {children.length}/{freeLimit ?? '∞'}
              </Text>
            </View>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No children added yet
              </Text>
              <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                Add up to {freeLimit ?? 'unlimited'} children to track their progress
              </Text>
            </View>
          )}
        />
      )}

      {/* FAB — add child */}
      {canAddChild && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + 76 }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Upgrade nudge when limit reached */}
      {!canAddChild && !isPremium && (
        <View style={[styles.limitBanner, { backgroundColor: colors.rewardMuted, bottom: insets.bottom + 76 }]}>
          <Ionicons name="star" size={14} color={colors.rewardColor} />
          <Text style={[styles.limitText, { color: colors.rewardColor }]}>
            Upgrade Premium for unlimited children
          </Text>
        </View>
      )}

      {/* Add Child Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => { setShowAddModal(false); setNewChildName(''); }}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={[styles.modalCard, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
                  <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.modalBlur}>
                    <View style={[styles.modalContent, { backgroundColor: colors.glass }]}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Add Child</Text>
                      <View style={[styles.inputContainer, { backgroundColor: colors.primaryMuted }]}>
                        <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="Child's name"
                          placeholderTextColor={colors.textMuted}
                          value={newChildName}
                          onChangeText={setNewChildName}
                          editable={!isAdding}
                          returnKeyType="done"
                          onSubmitEditing={handleAddChild}
                          autoFocus
                        />
                      </View>
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={[styles.modalBtn, { borderColor: colors.border }]}
                          onPress={() => { setShowAddModal(false); setNewChildName(''); }}
                          disabled={isAdding}
                        >
                          <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
                          onPress={handleAddChild}
                          disabled={isAdding}
                        >
                          {isAdding ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={[styles.modalBtnText, { color: '#FFFFFF' }]}>Add</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </BlurView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: { ...typography.title2 },
  headerSub: { ...typography.footnote, marginTop: 2 },
  moonBadge: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moonEmoji: { fontSize: 22 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    flexGrow: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.headline },
  sectionCount: { ...typography.footnote },
  childCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  cardBlur: { overflow: 'hidden' },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: { flex: 1 },
  childName: { ...typography.headline },
  childSub: { ...typography.caption, marginTop: 2 },
  cardDivider: { width: 1, height: 40 },
  deleteBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyEmoji: { fontSize: 56 },
  emptyText: { ...typography.title3, textAlign: 'center' },
  emptySubText: { ...typography.subhead, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  limitBanner: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  limitText: { ...typography.caption, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalBlur: { overflow: 'hidden' },
  modalContent: { padding: spacing.xl },
  modalTitle: { ...typography.title3, textAlign: 'center', marginBottom: spacing.lg },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  input: { flex: 1, ...typography.body },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: { borderWidth: 0 },
  modalBtnText: { ...typography.headline },
});
