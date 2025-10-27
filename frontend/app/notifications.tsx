import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

interface Notification {
  id: string;
  type: 'order' | 'wishlist' | 'promotion' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'order',
      title: 'Order Shipped',
      message: 'Your order #12345 has been shipped and is on the way!',
      time: '2 hours ago',
      read: false
    },
    {
      id: '2',
      type: 'promotion',
      title: 'Flash Sale Alert!',
      message: 'Get 50% off on selected items. Sale ends tonight!',
      time: '5 hours ago',
      read: false
    },
    {
      id: '3',
      type: 'wishlist',
      title: 'Price Drop',
      message: 'An item in your wishlist is now 30% off',
      time: '1 day ago',
      read: true
    },
    {
      id: '4',
      type: 'order',
      title: 'Order Delivered',
      message: 'Your order #12344 has been delivered successfully',
      time: '2 days ago',
      read: true
    },
    {
      id: '5',
      type: 'system',
      title: 'Welcome to Skyriting',
      message: 'Discover amazing fashion and connect with influencers',
      time: '1 week ago',
      read: true
    },
  ]);

  const getIconName = (type: string) => {
    switch (type) {
      case 'order': return 'receipt';
      case 'wishlist': return 'heart';
      case 'promotion': return 'pricetag';
      case 'system': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'order': return '#4CAF50';
      case 'wishlist': return '#ff4444';
      case 'promotion': return '#FF9800';
      case 'system': return '#2196F3';
      default: return '#666';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.unreadBadge}>{unreadCount} unread</Text>
              )}
            </View>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.unreadCard
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: getIconColor(notification.type) + '20' }
              ]}>
                <Ionicons 
                  name={getIconName(notification.type) as any}
                  size={24}
                  color={getIconColor(notification.type)}
                />
              </View>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  unreadBadge: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  markAllText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    gap: 12,
  },
  unreadCard: {
    backgroundColor: '#1a2a1a',
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
});