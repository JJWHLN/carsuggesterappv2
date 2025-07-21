/**
 * Admin Tab - Content Management Dashboard
 * This is your control center for implementing the content-first strategy
 * Reviews → Traffic → Dealers → Subscriptions ($99-$499/month)
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import AdminDashboard from '@/components/AdminDashboard';
import { Colors } from '@/constants/Colors';

export default function AdminTab() {
  return (
    <SafeAreaView style={styles.container}>
      <AdminDashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
