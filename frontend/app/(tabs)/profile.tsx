import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      router.replace('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#666" />
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified Influencer</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user?.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user?.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="heart-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>My Wishlist</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="receipt-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>My Orders</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#fff" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff4444" />
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a3a1a',
    borderRadius: 20,
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#222',
    marginHorizontal: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  menuContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  logoutItem: {
    marginTop: 16,
  },
  logoutText: {
    color: '#ff4444',
  },
});
