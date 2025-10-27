import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'users' | 'influencers' | 'banned'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, filter]);

  const loadUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply role/status filter
    switch (filter) {
      case 'users':
        filtered = filtered.filter(u => u.role === 'user' && !u.is_banned);
        break;
      case 'influencers':
        filtered = filtered.filter(u => u.role === 'influencer');
        break;
      case 'banned':
        filtered = filtered.filter(u => u.is_banned);
        break;
    }

    setFilteredUsers(filtered);
  };

  const handleVerifyInfluencer = async (userId: string, isCurrentlyVerified: boolean) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = isCurrentlyVerified ? 'unverify-influencer' : 'verify-influencer';
      
      await axios.put(
        `${API_URL}/api/admin/${endpoint}/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', `User ${isCurrentlyVerified ? 'unverified' : 'verified as influencer'} successfully`);
      loadUsers();
    } catch (error) {
      console.error('Error updating influencer status:', error);
      Alert.alert('Error', 'Failed to update influencer status');
    }
  };

  const handleBanUser = async (userId: string, isCurrentlyBanned: boolean) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const endpoint = isCurrentlyBanned ? 'unban-user' : 'ban-user';
      
      await axios.put(
        `${API_URL}/api/admin/${endpoint}/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', `User ${isCurrentlyBanned ? 'unbanned' : 'banned'} successfully`);
      loadUsers();
    } catch (error) {
      console.error('Error updating ban status:', error);
      Alert.alert('Error', 'Failed to update ban status');
    }
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: onConfirm, style: 'destructive' }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userStats}>
            <Text style={styles.statText}>
              Followers: {item.followers_count} | Following: {item.following_count}
            </Text>
          </View>
        </View>
        
        <View style={styles.badgesContainer}>
          {item.role === 'admin' && (
            <View style={[styles.badge, styles.adminBadge]}>
              <Text style={styles.badgeText}>Admin</Text>
            </View>
          )}
          {item.role === 'influencer' && (
            <View style={[styles.badge, styles.influencerBadge]}>
              <Ionicons name="checkmark-circle" size={14} color="#fff" />
              <Text style={styles.badgeText}>Influencer</Text>
            </View>
          )}
          {item.is_banned && (
            <View style={[styles.badge, styles.bannedBadge]}>
              <Text style={styles.badgeText}>Banned</Text>
            </View>
          )}
        </View>
      </View>

      {item.role !== 'admin' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.is_verified ? styles.unverifyButton : styles.verifyButton
            ]}
            onPress={() => 
              confirmAction(
                item.is_verified ? 'Remove Influencer Status' : 'Make Influencer',
                `Are you sure you want to ${item.is_verified ? 'remove influencer status from' : 'make'} ${item.name} ${item.is_verified ? '' : 'an influencer'}?`,
                () => handleVerifyInfluencer(item.id, item.is_verified)
              )
            }
          >
            <Ionicons 
              name={item.is_verified ? "remove-circle-outline" : "checkmark-circle-outline"} 
              size={18} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>
              {item.is_verified ? 'Remove Influencer' : 'Make Influencer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              item.is_banned ? styles.unbanButton : styles.banButton
            ]}
            onPress={() =>
              confirmAction(
                item.is_banned ? 'Unban User' : 'Ban User',
                `Are you sure you want to ${item.is_banned ? 'unban' : 'ban'} ${item.name}?`,
                () => handleBanUser(item.id, item.is_banned)
              )
            }
          >
            <Ionicons 
              name={item.is_banned ? "unlock-outline" : "ban-outline"} 
              size={18} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>
              {item.is_banned ? 'Unban' : 'Ban'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFilterButton = (filterType: typeof filter, label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Users Management', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Users Management',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'All')}
        {renderFilterButton('users', 'Users')}
        {renderFilterButton('influencers', 'Influencers')}
        {renderFilterButton('banned', 'Banned')}
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          Total Users: {users.length} | Showing: {filteredUsers.length}
        </Text>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statsBar: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 13,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  userStats: {
    marginTop: 4,
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  badgesContainer: {
    gap: 4,
    alignItems: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#8B5CF6',
  },
  influencerBadge: {
    backgroundColor: '#10B981',
  },
  bannedBadge: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  verifyButton: {
    backgroundColor: '#10B981',
  },
  unverifyButton: {
    backgroundColor: '#6B7280',
  },
  banButton: {
    backgroundColor: '#EF4444',
  },
  unbanButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});
