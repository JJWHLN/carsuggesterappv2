import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Shield,
  Users,
  FileText,
  Car,
  TrendingUp,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { RoleGate } from '@/components/ui/RoleProtection';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { AdminService } from '@/services/adminService';
import { SecurityService } from '@/services/securityService';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';

export default function AdminScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadAdminData = async () => {
    if (!user) return;

    try {
      setError(null);
      const [statsData, usersData, activityData] = await Promise.all([
        AdminService.getPlatformStats(user.id),
        AdminService.getAllUsers(user.id),
        AdminService.getRecentActivity(user.id, 10),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setRecentActivity(activityData);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAdminData();
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    if (!user) return;

    const roles = ['user', 'dealer', 'admin'];
    const roleOptions = roles.filter(role => role !== currentRole);

    Alert.alert(
      'Change User Role',
      `Select new role for user:`,
      [
        ...roleOptions.map(role => ({
          text: role.charAt(0).toUpperCase() + role.slice(1),
          onPress: async () => {
            try {
              await SecurityService.updateUserRole(user.id, userId, role as any);
              loadAdminData(); // Refresh data
              Alert.alert('Success', `User role updated to ${role}`);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Icon color={color} size={24} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{title}</Text>
    </Card>
  );

  const UserItem = ({ user: userData }: { user: any }) => (
    <Card style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={[styles.userEmail, { color: colors.text }]}>{userData.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userData.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(userData.role) }]}>
              {userData.role.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={[styles.userDate, { color: colors.textSecondary }]}>
          Joined: {new Date(userData.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.changeRoleButton}
        onPress={() => handleChangeRole(userData.id, userData.role)}
      >
        <UserCheck color={colors.primary} size={20} />
      </TouchableOpacity>
    </Card>
  );

  const ActivityItem = ({ activity }: { activity: any }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: colors.primaryLight }]}>
        {activity.type === 'review' ? (
          <FileText color={colors.primary} size={16} />
        ) : (
          <Car color={colors.primary} size={16} />
        )}
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: colors.text }]} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>
          {activity.type === 'review' ? `Review by ${activity.author}` : `Listing - ${activity.status}`} • {' '}
          {new Date(activity.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return colors.error;
      case 'dealer': return colors.warning;
      case 'user': return colors.success;
      default: return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading admin dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Access Denied"
          message={error}
          onRetry={loadAdminData}
        />
      </SafeAreaView>
    );
  }

  return (
    <RoleGate requiredRoles={['admin']} requireAuth={true}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color={colors.text} size={24} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Admin Dashboard</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Stats Overview */}
          {stats && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Total Users"
                  value={stats.users.total}
                  icon={Users}
                  color={colors.primary}
                />
                <StatCard
                  title="Active Listings"
                  value={stats.content.activeListings}
                  icon={Car}
                  color={colors.accentGreen}
                />
                <StatCard
                  title="Reviews"
                  value={stats.content.reviews}
                  icon={FileText}
                  color={colors.warning}
                />
                <StatCard
                  title="Bookmarks"
                  value={stats.content.bookmarks}
                  icon={TrendingUp}
                  color={colors.success}
                />
              </View>

              {/* Role Distribution */}
              <View style={styles.roleDistribution}>
                <Text style={[styles.subsectionTitle, { color: colors.text }]}>Users by Role</Text>
                <View style={styles.roleStats}>
                  {Object.entries(stats.users.byRole).map(([role, count]) => (
                    <View key={role} style={styles.roleStatItem}>
                      <View style={[styles.roleStatDot, { backgroundColor: getRoleColor(role) }]} />
                      <Text style={[styles.roleStatText, { color: colors.text }]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}: {count as number}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* User Management */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>User Management</Text>
            {users.slice(0, 10).map(userData => (
              <UserItem key={userData.id} user={userData} />
            ))}
            {users.length > 10 && (
              <Button
                title={`View All ${users.length} Users`}
                onPress={() => {/* Navigate to full user management */}}
                variant="outline"
                style={styles.viewAllButton}
              />
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            <Card style={styles.activityCard}>
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <ActivityItem key={`${activity.type}-${activity.id}`} activity={activity} />
                ))
              ) : (
                <Text style={[styles.noActivity, { color: colors.textSecondary }]}>
                  No recent activity
                </Text>
              )}
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h1,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  subsectionTitle: {
    ...Typography.h3,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
  roleDistribution: {
    marginTop: Spacing.lg,
  },
  roleStats: {
    gap: Spacing.sm,
  },
  roleStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleStatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  roleStatText: {
    ...Typography.body,
    fontWeight: '500',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  userDate: {
    ...Typography.caption,
  },
  changeRoleButton: {
    padding: Spacing.sm,
  },
  viewAllButton: {
    marginTop: Spacing.md,
  },
  activityCard: {
    padding: Spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  activityMeta: {
    ...Typography.caption,
  },
  noActivity: {
    ...Typography.body,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
