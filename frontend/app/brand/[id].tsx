import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function BrandStoreScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [brand, setBrand] = useState<any>(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    if (id) {
      loadBrandData();
    }
  }, [id]);

  useEffect(() => {
    applyFilters();
  }, [products, searchQuery, selectedGender, selectedCategory, priceRange]);

  const loadBrandData = async () => {
    try {
      const [brandRes, productsRes] = await Promise.all([
        axios.get(`${API_URL}/api/brands/${id}`),
        axios.get(`${API_URL}/api/products?brand_id=${id}`)
      ]);
      setBrand(brandRes.data);
      setProducts(productsRes.data);
      setFilteredProducts(productsRes.data);
    } catch (error) {
      console.error('Error loading brand data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((p: any) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Gender filter
    if (selectedGender !== 'all') {
      filtered = filtered.filter((p: any) => p.gender === selectedGender);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p: any) => p.category === selectedCategory);
    }

    // Price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter((p: any) => {
        if (priceRange === 'under50') return p.price < 50;
        if (priceRange === '50-100') return p.price >= 50 && p.price <= 100;
        if (priceRange === 'over100') return p.price > 100;
        return true;
      });
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (product: any) => {
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
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const categories = ['all', 'Casual', 'Outerwear', 'Footwear', 'Pants'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{brand?.name || 'Brand Store'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.brandLogoContainer}>
            <Ionicons name="pricetag" size={32} color="#fff" />
          </View>
          <Text style={styles.brandName}>{brand?.name}</Text>
          <Text style={styles.brandDescription}>{brand?.description}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {/* Gender Filter */}
          <View style={styles.filterGroup}>
            <TouchableOpacity
              style={[styles.filterChip, selectedGender === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedGender('all')}
            >
              <Text style={[styles.filterText, selectedGender === 'all' && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedGender === 'men' && styles.filterChipActive]}
              onPress={() => setSelectedGender('men')}
            >
              <Text style={[styles.filterText, selectedGender === 'men' && styles.filterTextActive]}>Men</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedGender === 'women' && styles.filterChipActive]}
              onPress={() => setSelectedGender('women')}
            >
              <Text style={[styles.filterText, selectedGender === 'women' && styles.filterTextActive]}>Women</Text>
            </TouchableOpacity>
          </View>

          {/* Price Filter */}
          <View style={styles.filterGroup}>
            <TouchableOpacity
              style={[styles.filterChip, priceRange === 'under50' && styles.filterChipActive]}
              onPress={() => setPriceRange('under50')}
            >
              <Text style={[styles.filterText, priceRange === 'under50' && styles.filterTextActive]}>Under $50</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, priceRange === '50-100' && styles.filterChipActive]}
              onPress={() => setPriceRange('50-100')}
            >
              <Text style={[styles.filterText, priceRange === '50-100' && styles.filterTextActive]}>$50-$100</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, priceRange === 'over100' && styles.filterChipActive]}
              onPress={() => setPriceRange('over100')}
            >
              <Text style={[styles.filterText, priceRange === 'over100' && styles.filterTextActive]}>Over $100</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Products Grid */}
        <ScrollView style={styles.productsContainer}>
          <View style={styles.productsGrid}>
            {filteredProducts.map((product: any) => (
              <View key={product._id} style={styles.productCard}>
                {product.images && product.images[0] ? (
                  <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={32} color="#333" />
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productPrice}>${product.price}</Text>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => handleAddToCart(product)}
                  >
                    <Ionicons name="cart" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          {filteredProducts.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No products match your filters</Text>
            </View>
          )}
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  brandHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  brandLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  brandDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#000',
  },
  productsContainer: {
    flex: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  productCard: {
    width: (width - 48) / 2,
    marginHorizontal: 8,
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});