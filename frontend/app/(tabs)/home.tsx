import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HomeScreen() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [brands, setBrands] = useState([]);
  
  // Filter states
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedBrand, selectedGender, selectedCategory, allProducts]);

  const loadData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      setToken(storedToken || '');
      
      const [productsRes, brandsRes] = await Promise.all([
        axios.get(`${API_URL}/api/products/trending`),
        axios.get(`${API_URL}/api/brands`)
      ]);
      
      setAllProducts(productsRes.data);
      setBrands(brandsRes.data);
      setFilteredProducts(productsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    if (selectedBrand !== 'all') {
      filtered = filtered.filter(p => p.brand_id === selectedBrand);
    }

    if (selectedGender !== 'all') {
      filtered = filtered.filter(p => p.gender === selectedGender);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    setFilteredProducts(filtered);
    setCurrentIndex(0); // Reset to first product when filters change
  };

  const handleLike = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to save items');
      return;
    }
    
    const product = filteredProducts[currentIndex];
    try {
      await axios.post(
        `${API_URL}/api/wishlist/add/${product._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
    }
    
    // Move to next product
    goToNextProduct();
  };

  const handleSkip = () => {
    goToNextProduct();
  };

  const goToNextProduct = () => {
    if (currentIndex < filteredProducts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Loop back to beginning
      setCurrentIndex(0);
      Alert.alert('All Done!', 'Starting over from the beginning');
    }
  };

  const handleAddToCart = async () => {
    const product = filteredProducts[currentIndex];
    try {
      const cart = await AsyncStorage.getItem('cart');
      const cartItems = cart ? JSON.parse(cart) : [];
      
      const existingItem = cartItems.find((item: any) => item.product_id === product._id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cartItems.push({
          product_id: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.images?.[0]
        });
      }
      
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      Alert.alert('Success', 'Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleBuyNow = async () => {
    const product = filteredProducts[currentIndex];
    try {
      const cartItems = [{
        product_id: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.images?.[0]
      }];
      
      await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
      router.push('/(tabs)/cart');
    } catch (error) {
      console.error('Error with buy now:', error);
    }
  };

  const handleBrandClick = async (brandId: string) => {
    router.push(`/brand/${brandId}` as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>No products available</Text>
          <Text style={styles.emptySubtext}>Check back later for new arrivals</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>SKYRITING</Text>
        <TouchableOpacity onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {currentProduct && (
          <View style={styles.card}>
            {currentProduct.images && currentProduct.images[0] ? (
              <Image
                source={{ uri: currentProduct.images[0] }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="shirt-outline" size={80} color="#333" />
              </View>
            )}

            {/* Brand Logo Badge */}
            <TouchableOpacity 
              style={styles.brandBadge}
              onPress={() => handleBrandClick(currentProduct.brand_id)}
            >
              <Ionicons name="pricetag" size={16} color="#fff" />
              <Text style={styles.brandBadgeText}>View Brand</Text>
            </TouchableOpacity>

            <View style={styles.productInfo}>
              <Text style={styles.productName}>{currentProduct.name}</Text>
              <Text style={styles.productPrice}>${currentProduct.price}</Text>
              <Text style={styles.productDescription} numberOfLines={2}>
                {currentProduct.description}
              </Text>
              
              {/* Buy Now Button */}
              <TouchableOpacity 
                style={styles.buyNowButton}
                onPress={handleBuyNow}
              >
                <Text style={styles.buyNowText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSwipeLeft}
        >
          <Ionicons name="close" size={32} color="#ff4444" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.cartButton]}
          onPress={handleAddToCart}
        >
          <Ionicons name="cart" size={28} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleSwipeRight}
        >
          <Ionicons name="heart" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {products.length}
        </Text>
      </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: width - 32,
    height: height * 0.65,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '55%',
  },
  placeholderImage: {
    width: '100%',
    height: '55%',
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  brandBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productInfo: {
    padding: 20,
    gap: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4CAF50',
  },
  productDescription: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  buyNowButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buyNowText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 24,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  cartButton: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  likeButton: {
    backgroundColor: '#ff4444',
    borderColor: '#ff4444',
  },
  progressContainer: {
    paddingBottom: 16,
    alignItems: 'center',
  },
  progressText: {
    color: '#666',
    fontSize: 14,
  },
});