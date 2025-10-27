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

  const categories = ['all', 'Casual', 'Outerwear', 'Footwear', 'Pants'];

  if (filteredProducts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="shirt-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>No products match your filters</Text>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              setSelectedBrand('all');
              setSelectedGender('all');
              setSelectedCategory('all');
            }}
          >
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentProduct = filteredProducts[currentIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search and Notifications */}
      <View style={styles.header}>
        <Text style={styles.logo}>SKYRITING</Text>
        <TouchableOpacity onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters Bar */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity 
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="options" size={16} color={showFilters ? "#000" : "#fff"} />
          <Text style={[styles.filterText, showFilters && styles.filterTextActive]}>Filters</Text>
        </TouchableOpacity>

        {showFilters && (
          <>
            {/* Brand Filter */}
            <View style={styles.filterGroup}>
              <TouchableOpacity
                style={[styles.filterChip, selectedBrand === 'all' && styles.filterChipSelected]}
                onPress={() => setSelectedBrand('all')}
              >
                <Text style={[styles.filterChipText, selectedBrand === 'all' && styles.filterChipTextSelected]}>
                  All Brands
                </Text>
              </TouchableOpacity>
              {brands.slice(0, 3).map(brand => (
                <TouchableOpacity
                  key={brand._id}
                  style={[styles.filterChip, selectedBrand === brand._id && styles.filterChipSelected]}
                  onPress={() => setSelectedBrand(brand._id)}
                >
                  <Text style={[styles.filterChipText, selectedBrand === brand._id && styles.filterChipTextSelected]}>
                    {brand.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Gender Filter */}
            <View style={styles.filterGroup}>
              <TouchableOpacity
                style={[styles.filterChip, selectedGender === 'all' && styles.filterChipSelected]}
                onPress={() => setSelectedGender('all')}
              >
                <Text style={[styles.filterChipText, selectedGender === 'all' && styles.filterChipTextSelected]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedGender === 'men' && styles.filterChipSelected]}
                onPress={() => setSelectedGender('men')}
              >
                <Text style={[styles.filterChipText, selectedGender === 'men' && styles.filterChipTextSelected]}>Men</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, selectedGender === 'women' && styles.filterChipSelected]}
                onPress={() => setSelectedGender('women')}
              >
                <Text style={[styles.filterChipText, selectedGender === 'women' && styles.filterChipTextSelected]}>Women</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <View style={styles.filterGroup}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, selectedCategory === cat && styles.filterChipSelected]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextSelected]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            setSelectedBrand('all');
            setSelectedGender('all');
            setSelectedCategory('all');
          }}
        >
          <Ionicons name="refresh" size={16} color="#fff" />
          <Text style={styles.filterText}>Reset</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.cardContainer}>
        {currentProduct && (
          <View style={styles.card}>
            {currentProduct.images && currentProduct.images[0] ? (
              <Image
                source={{ uri: currentProduct.images[0] }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="shirt-outline" size={80} color="#333" />
              </View>
            )}

            {/* Action Icons on Right Side */}
            <View style={styles.sideActions}>
              <TouchableOpacity 
                style={styles.sideActionButton}
                onPress={handleAddToCart}
              >
                <Ionicons name="cart-outline" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.sideActionButton}
                onPress={handleLike}
              >
                <Ionicons name="heart-outline" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.sideActionButton}
                onPress={() => {}}
              >
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Brand Badge */}
            <TouchableOpacity 
              style={styles.brandBadge}
              onPress={() => handleBrandClick(currentProduct.brand_id)}
            >
              <Ionicons name="pricetag" size={16} color="#fff" />
              <Text style={styles.brandBadgeText}>View Brand</Text>
            </TouchableOpacity>

            {/* Product Info at Bottom */}
            <View style={styles.productInfo}>
              <View style={styles.productHeader}>
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{currentProduct.name}</Text>
                  <Text style={styles.productPrice}>${currentProduct.price}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.buyNowButton}
                  onPress={handleBuyNow}
                >
                  <Text style={styles.buyNowText}>Buy now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  resetButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  resetButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterChipSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#000',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    width: width - 32,
    height: height * 0.7,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '80%',
    backgroundColor: '#f5f5f5',
  },
  placeholderImage: {
    width: '100%',
    height: '80%',
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideActions: {
    position: 'absolute',
    right: 16,
    top: '40%',
    gap: 16,
  },
  sideActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
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
    fontSize: 11,
    fontWeight: '600',
  },
  productInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4CAF50',
  },
  buyNowButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buyNowText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});