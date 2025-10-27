import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'Casual', name: 'Casual', icon: 'shirt' },
    { id: 'Outerwear', name: 'Outerwear', icon: 'snow' },
    { id: 'Footwear', name: 'Footwear', icon: 'footsteps' },
    { id: 'Pants', name: 'Pants', icon: 'resize' },
  ];

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, brandsRes] = await Promise.all([
        axios.get(`${API_URL}/api/products${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`),
        axios.get(`${API_URL}/api/brands`)
      ]);
      setProducts(productsRes.data);
      setBrands(brandsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToWishlist = async (productId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/wishlist/add/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              selectedCategory === cat.id && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Ionicons 
              name={cat.icon as any} 
              size={20} 
              color={selectedCategory === cat.id ? '#000' : '#fff'} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === cat.id && styles.categoryTextActive
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {brands.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brands</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {brands.map(brand => (
              <View key={brand._id} style={styles.brandCard}>
                <View style={styles.brandLogo}>
                  <Ionicons name="pricetag" size={24} color="#666" />
                </View>
                <Text style={styles.brandName}>{brand.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <ScrollView style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.productsGrid}>
            {filteredProducts.map(product => (
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
                </View>
                <TouchableOpacity 
                  style={styles.wishlistButton}
                  onPress={() => handleAddToWishlist(product._id)}
                >
                  <Ionicons name="heart-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
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
  categoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryChipActive: {
    backgroundColor: '#fff',
  },
  categoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  brandCard: {
    alignItems: 'center',
    marginLeft: 24,
    width: 80,
  },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productsContainer: {
    flex: 1,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
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
    height: 160,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 160,
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
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
