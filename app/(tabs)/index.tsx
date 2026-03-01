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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { useChildren } from '@/hooks/use-children';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { Child } from '@/types';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { children, isLoading, fetchChildren, createChild, deleteChild, canAddChild } = useChildren();
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
      Alert.alert('Error', result?.error || 'Failed to add child');
    }
  };

  const handleDeleteChild = (child: Child) => {
    Alert.alert(
      'Remove Child',
      `Remove ${child.name}? All fasting data will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteChild(child.id);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  // Card is split: content area (TouchableOpacity) + delete button (separate TouchableOpacity)
  // This avoids the nested-touchable Android bug where pressing delete also fires the card nav.
  const renderChild = ({ item }: { item: Child }) => (
    <View style={[styles.childCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.childCardContent}
        onPress={() => router.push(`/child/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.childAvatar, { backgroundColor: colors.primaryMuted }]}>
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
        <View style={styles.childInfo}>
          <Text style={[styles.childName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.childSub, { color: colors.textSecondary }]}>
            Tap to view fasting log
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleDeleteChild(item)}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark
          ? ['#0A1F13', '#0F2D1B', '#0A1F13']
          : ['#ECFDF5', '#D1FAE5', '#A7F3D0']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Ramadan Tracker</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Children ({children.length}/3)
            </Text>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No children added yet
              </Text>
              <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
                Add up to 3 children to track their fasting
              </Text>
            </View>
          )}
        />
      )}

      {/* Add Child Button */}
      {canAddChild && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + spacing.xl }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
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
                <View style={[styles.modalCard, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}>
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
                    />
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        setShowAddModal(false);
                        setNewChildName('');
                      }}
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
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.title2,
  },
  headerSub: {
    ...typography.footnote,
    marginTop: 2,
  },
  logoutBtn: {
    padding: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    flexGrow: 1,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.md,
  },
  // Card is a plain View; content area and delete are siblings (not nested touchables)
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  childCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  childAvatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    ...typography.headline,
  },
  childSub: {
    ...typography.footnote,
    marginTop: 2,
  },
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
  emptyText: {
    ...typography.title3,
    textAlign: 'center',
  },
  emptySubText: {
    ...typography.subhead,
    textAlign: 'center',
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.title3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    ...typography.body,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    borderWidth: 0,
  },
  modalBtnText: {
    ...typography.headline,
  },
});
