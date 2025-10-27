import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [gender, setGender] = useState('');
  const [sizes, setSizes] = useState('S,M,L,XL');
  const [colors, setColors] = useState('Black,White,Navy');
  const [images, setImages] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, brandsRes] = await Promise.all([
        axios.get(`${API_URL}/api/products?limit=100`),
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

  const handlePickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => 
          `data:image/jpeg;base64,${asset.base64}`
        );
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleSave = async () => {
    if (!name || !description || !price || !stock || !selectedBrand) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const productData = {
        brand_id: selectedBrand,
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        gender,
        sizes: sizes.split(',').map(s => s.trim()),
        colors: colors.split(',').map(c => c.trim()),
        images: images,
      };

      if (editingProduct) {
        await axios.put(
          `${API_URL}/api/products/${editingProduct._id}`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await axios.post(
          `${API_URL}/api/products`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Product created successfully');
      }

      resetForm();
      setShowModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (productId) => {
    Alert.alert(
      'Delete Product',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/products/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Product deleted');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setCategory(product.category || '');
    setSelectedBrand(product.brand_id);
    setGender(product.gender || '');
    setSizes(product.sizes?.join(',') || '');
    setColors(product.colors?.join(',') || '');
    setImages(product.images || []);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setStock('');
    setCategory('');
    setSelectedBrand('');
    setGender('');
    setSizes('S,M,L,XL');
    setColors('Black,White,Navy');
    setImages([]);
  };

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
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Products Management</Text>
          <TouchableOpacity onPress={loadData}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Product</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.stats}>{products.length} Total Products</Text>

          <View style={styles.productsGrid}>
            {products.map((product) => (
              <View key={product._id} style={styles.productCard}>
                {product.images?.[0] ? (
                  <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={32} color="#666" />
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productPrice}>${product.price}</Text>
                  <Text style={styles.productStock}>Stock: {product.stock}</Text>
                  
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEdit(product)}
                    >
                      <Ionicons name="create" size={16} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(product._id)}
                    >
                      <Ionicons name="trash" size={16} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal visible={showModal} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter description"
                placeholderTextColor="#666"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Price *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Stock *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#666"
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.label}>Brand *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandSelector}>
                {brands.map(brand => (
                  <TouchableOpacity
                    key={brand._id}
                    style={[
                      styles.brandOption,
                      selectedBrand === brand._id && styles.brandOptionSelected
                    ]}
                    onPress={() => setSelectedBrand(brand._id)}
                  >
                    <Text style={[
                      styles.brandOptionText,
                      selectedBrand === brand._id && styles.brandOptionTextSelected
                    ]}>
                      {brand.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Casual, Footwear"
                placeholderTextColor="#666"
                value={category}
                onChangeText={setCategory}
              />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderSelector}>
                {['men', 'women', 'unisex'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderButton, gender === g && styles.genderButtonSelected]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Sizes (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="S,M,L,XL"
                placeholderTextColor="#666"
                value={sizes}
                onChangeText={setSizes}
              />

              <Text style={styles.label}>Colors (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="Black,White,Navy"
                placeholderTextColor="#666"
                value={colors}
                onChangeText={setColors}
              />

              <Text style={styles.label}>Product Images</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImages}>
                <Ionicons name="images" size={32} color="#666" />
                <Text style={styles.imagePickerText}>Add Images</Text>
              </TouchableOpacity>

              <ScrollView horizontal style={styles.imagesPreview}>
                {images.map((img, idx) => (
                  <View key={idx} style={styles.imagePreviewContainer}>
                    <Image source={{ uri: img }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImages(images.filter((_, i) => i !== idx))}
                    >
                      <Ionicons name="close-circle" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, uploading && styles.disabledButton]}
                onPress={handleSave}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingProduct ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  addButtonContainer: { padding: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#9C27B0', paddingVertical: 14, borderRadius: 12 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16 },
  stats: { fontSize: 14, color: '#888', marginBottom: 16 },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCard: { width: (width - 48) / 2, backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  productImage: { width: '100%', height: 150 },
  productImagePlaceholder: { width: '100%', height: 150, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50', marginBottom: 2 },
  productStock: { fontSize: 12, color: '#888', marginBottom: 8 },
  productActions: { flexDirection: 'row', gap: 8 },
  editButton: { flex: 1, padding: 8, backgroundColor: '#2196F320', borderRadius: 6, alignItems: 'center' },
  deleteButton: { flex: 1, padding: 8, backgroundColor: '#f4433620', borderRadius: 6, alignItems: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  modalForm: { flex: 1, padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, fontSize: 16, color: '#fff', borderWidth: 1, borderColor: '#333' },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  brandSelector: { marginBottom: 12 },
  brandOption: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1a1a1a', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#333' },
  brandOptionSelected: { backgroundColor: '#fff', borderColor: '#fff' },
  brandOptionText: { fontSize: 14, color: '#fff' },
  brandOptionTextSelected: { color: '#000', fontWeight: '600' },
  genderSelector: { flexDirection: 'row', gap: 8 },
  genderButton: { flex: 1, paddingVertical: 12, backgroundColor: '#1a1a1a', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  genderButtonSelected: { backgroundColor: '#fff', borderColor: '#fff' },
  genderText: { fontSize: 14, color: '#fff' },
  genderTextSelected: { color: '#000', fontWeight: '600' },
  imagePickerButton: { padding: 40, backgroundColor: '#1a1a1a', borderRadius: 8, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', alignItems: 'center' },
  imagePickerText: { fontSize: 14, color: '#666', marginTop: 8 },
  imagesPreview: { flexDirection: 'row', marginTop: 12 },
  imagePreviewContainer: { marginRight: 12, position: 'relative' },
  imagePreview: { width: 100, height: 100, borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: -8, right: -8 },
  modalActions: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#333' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', backgroundColor: '#333' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', backgroundColor: '#9C27B0' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
});
