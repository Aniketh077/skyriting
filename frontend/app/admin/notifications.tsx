import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/notifications/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please fill in both title and message');
      return;
    }

    Alert.alert(
      'Confirm Send',
      `Send notification to ${sendToAll ? 'all users' : 'specific users'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setLoading(true);
            try {
              const token = await AsyncStorage.getItem('token');
              const response = await axios.post(
                `${API_URL}/api/admin/notifications/send`,
                {
                  title: title,
                  body: body,
                  user_ids: sendToAll ? null : []
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              Alert.alert(
                'Success',
                `Notification sent to ${response.data.sent_count} users`
              );
              setTitle('');
              setBody('');
              loadStats();
            } catch (error: any) {
              console.error('Error sending notification:', error);
              Alert.alert(
                'Error',
                error.response?.data?.detail || 'Failed to send notification'
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Push Notifications',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name=\"arrow-back\" size={24} color=\"#fff\" />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView style={styles.content}>
        {/* Stats Card */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Notification Coverage</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total_users}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.users_with_notifications_enabled}
                </Text>
                <Text style={styles.statLabel}>Enabled</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {stats.coverage_percentage}%
                </Text>
                <Text style={styles.statLabel}>Coverage</Text>
              </View>
            </View>
          </View>
        )}

        {/* Send Notification Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Send Notification</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder=\"Notification title\"
            placeholderTextColor=\"#666\"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder=\"Notification message\"
            placeholderTextColor=\"#666\"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
          />

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>Send to all users</Text>
              <Text style={styles.switchSubtext}>
                {sendToAll ? 'All users will receive' : 'Select specific users'}
              </Text>
            </View>
            <Switch
              value={sendToAll}
              onValueChange={setSendToAll}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor={sendToAll ? '#fff' : '#aaa'}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendNotification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color=\"#000\" />
            ) : (
              <>
                <Ionicons name=\"send\" size={20} color=\"#000\" />
                <Text style={styles.sendButtonText}>Send Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name=\"information-circle\" size={24} color=\"#4CAF50\" />
          <Text style={styles.infoText}>
            Notifications are sent via Expo Push Notification service. Users must have
            the app installed and notifications enabled to receive them.
          </Text>
        </View>

        {/* Quick Templates */}
        <View style={styles.templatesCard}>
          <Text style={styles.templatesTitle}>Quick Templates</Text>
          
          <TouchableOpacity
            style={styles.templateItem}
            onPress={() => {
              setTitle('New Products Added!');
              setBody('Check out our latest collection of fashion items. Swipe to discover!');
            }}
          >
            <Ionicons name=\"shirt-outline\" size={20} color=\"#4CAF50\" />
            <Text style={styles.templateText}>New Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateItem}
            onPress={() => {
              setTitle('Special Offer! 🎉');
              setBody('Limited time offer! Get up to 50% off on selected items. Shop now!');
            }}
          >
            <Ionicons name=\"pricetag-outline\" size={20} color=\"#4CAF50\" />
            <Text style={styles.templateText}>Sale Announcement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.templateItem}
            onPress={() => {
              setTitle('Order Update');
              setBody('Your order has been shipped and is on the way!');
            }}
          >
            <Ionicons name=\"cube-outline\" size={20} color=\"#4CAF50\" />
            <Text style={styles.templateText}>Order Status</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  formCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  switchSubtext: {
    fontSize: 12,
    color: '#888',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1a3a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a4a2a',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#aaa',
    lineHeight: 20,
  },
  templatesCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333',
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0a0a0a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  templateText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});
