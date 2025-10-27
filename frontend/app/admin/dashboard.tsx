import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const adminMenuItems = [
    {
      title: 'Orders Management',
      icon: 'receipt',
      color: '#4CAF50',
      route: '/admin/orders',
      count: analytics?.orders_count || 0
    },
    {
      title: 'Users Management',
      icon: 'people',
      color: '#2196F3',
      route: '/admin/users',
      count: analytics?.users_count || 0
    },
    {
      title: 'Brands Management',
      icon: 'pricetag',
      color: '#FF9800',
      route: '/admin/brands',
      count: analytics?.brands_count || 0
    },
    {
      title: 'Products Management',
      icon: 'shirt',
      color: '#9C27B0',
      route: '/admin/products',
      count: analytics?.products_count || 0
    },
    {
      title: 'Push Notifications',
      icon: 'notifications',
      color: '#f44336',
      route: '/admin/notifications',
      count: 0
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={loadAnalytics}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Analytics Cards */}
        <View style={styles.analyticsContainer}>
          <View style={styles.analyticsCard}>
            <Ionicons name="people" size={32} color="#2196F3" />
            <Text style={styles.analyticsValue}>{analytics?.users_count || 0}</Text>
            <Text style={styles.analyticsLabel}>Total Users</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Ionicons name="checkmark-done" size={32} color="#4CAF50" />
            <Text style={styles.analyticsValue}>{analytics?.orders_count || 0}</Text>
            <Text style={styles.analyticsLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.analyticsContainer}>
          <View style={styles.analyticsCard}>
            <Ionicons name="pricetag" size={32} color="#FF9800" />
            <Text style={styles.analyticsValue}>{analytics?.brands_count || 0}</Text>
            <Text style={styles.analyticsLabel}>Brands</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Ionicons name="shirt" size={32} color="#9C27B0" />
            <Text style={styles.analyticsValue}>{analytics?.products_count || 0}</Text>
            <Text style={styles.analyticsLabel}>Products</Text>
          </View>
        </View>

        <View style={styles.revenueCard}>
          <Ionicons name="cash" size={40} color="#4CAF50" />
          <View style={styles.revenueInfo}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>${analytics?.total_revenue?.toFixed(2) || '0.00'}</Text>
          </View>
        </View>

        {/* Admin Menu */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Management</Text>
          {adminMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={28} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuCount}>{item.count} items</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#666" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  analyticsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  revenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a4a2a',
    gap: 16,
  },
  revenueInfo: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  menuContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  menuCount: {
    fontSize: 13,
    color: '#888',
  },
});