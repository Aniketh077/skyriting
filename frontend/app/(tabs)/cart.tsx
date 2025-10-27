import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  color?: string;
}

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const updateQuantity = async (index: number, delta: number) => {
    const newCart = [...cartItems];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCartItems(newCart);
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  const removeItem = async (index: number) => {
    const newCart = cartItems.filter((_, i) => i !== index);
    setCartItems(newCart);
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (!address.street || !address.city || !address.phone) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const response = await axios.post(
        `${API_URL}/api/orders`,
        {
          items: orderItems,
          total_amount: getTotalPrice(),
          shipping_address: address,
          payment_method: 'mock'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Order placed successfully!', [
        {
          text: 'OK',
          onPress: async () => {
            setCartItems([]);
            await AsyncStorage.removeItem('cart');
          }
        }
      ]);
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#333" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <Text style={styles.emptySubtext}>Add items to get started</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Text style={styles.itemCount}>{cartItems.length} items</Text>
      </View>

      <ScrollView style={styles.content}>
        {cartItems.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.itemImage} />
            ) : (
              <View style={styles.itemImagePlaceholder}>
                <Ionicons name="shirt-outline" size={32} color="#333" />
              </View>
            )}
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
              {item.size && <Text style={styles.itemMeta}>Size: {item.size}</Text>}
              {item.color && <Text style={styles.itemMeta}>Color: {item.color}</Text>}
            </View>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateQuantity(index, -1)}
              >
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => updateQuantity(index, 1)}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => removeItem(index)}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street Address"
            placeholderTextColor="#666"
            value={address.street}
            onChangeText={(text) => setAddress({...address, street: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#666"
            value={address.city}
            onChangeText={(text) => setAddress({...address, city: text})}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="State"
              placeholderTextColor="#666"
              value={address.state}
              onChangeText={(text) => setAddress({...address, state: text})}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Zip Code"
              placeholderTextColor="#666"
              value={address.zipCode}
              onChangeText={(text) => setAddress({...address, zipCode: text})}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
            value={address.phone}
            onChangeText={(text) => setAddress({...address, phone: text})}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${getTotalPrice().toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutButton, loading && styles.disabledButton]}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.checkoutButtonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#888',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  addressSection: {
    padding: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
