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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Brand {
  _id: string;
  name: string;
  description: string;
  category: string;
  logo?: string;
  banner?: string;
  status: string;
}

export default function AdminBrandsScreen() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/brands?status=all`);
      setBrands(response.data);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async (type: 'logo' | 'banner') => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === 'logo' ? [1, 1] : [16, 9],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (type === 'logo') {
          setLogo(base64Image);
        } else {
          setBanner(base64Image);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    if (!name || !description || !category) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const brandData = {
        name,
        description,
        category,
        logo: logo || undefined,
        banner: banner || undefined,
      };

      if (editingBrand) {
        await axios.put(
          `${API_URL}/api/brands/${editingBrand._id}`,
          brandData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Brand updated successfully');
      } else {
        await axios.post(
          `${API_URL}/api/brands`,
          brandData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Brand created successfully');
      }

      resetForm();
      setShowModal(false);
      loadBrands();
    } catch (error: any) {
      console.error('Error saving brand:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save brand');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    Alert.alert(
      'Delete Brand',
      'Are you sure you want to delete this brand?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/brands/${brandId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Brand deleted successfully');
              loadBrands();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete brand');
            }
          }
        }
      ]
    );
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setDescription(brand.description);
    setCategory(brand.category);
    setLogo(brand.logo || '');
    setBanner(brand.banner || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingBrand(null);
    setName('');
    setDescription('');
    setCategory('');
    setLogo('');
    setBanner('');
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
          <Text style={styles.headerTitle}>Brands Management</Text>
          <TouchableOpacity onPress={loadBrands}>
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
            <Text style={styles.addButtonText}>Add New Brand</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.stats}>{brands.length} Total Brands</Text>

          {brands.map((brand) => (
            <View key={brand._id} style={styles.brandCard}>
              <View style={styles.brandHeader}>
                {brand.logo ? (
                  <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
                ) : (
                  <View style={styles.brandLogoPlaceholder}>
                    <Ionicons name="pricetag" size={24} color="#666" />
                  </View>
                )}
                <View style={styles.brandInfo}>
                  <Text style={styles.brandName}>{brand.name}</Text>
                  <Text style={styles.brandCategory}>{brand.category}</Text>
                </View>
              </View>

              <Text style={styles.brandDescription} numberOfLines={2}>
                {brand.description}
              </Text>

              <View style={styles.brandActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEdit(brand)}
                >
                  <Ionicons name="create" size={16} color="#2196F3" />
                  <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(brand._id)}
                >
                  <Ionicons name="trash" size={16} color="#f44336" />
                  <Text style={[styles.actionButtonText, { color: '#f44336' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingBrand ? 'Edit Brand' : 'Add New Brand'}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalForm}>
                <Text style={styles.label}>Brand Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter brand name"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter brand description"
                  placeholderTextColor="#666"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                />

                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Streetwear, Formal, Sports"
                  placeholderTextColor="#666"
                  value={category}
                  onChangeText={setCategory}
                />

                <Text style={styles.label}>Brand Logo</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => handlePickImage('logo')}
                >
                  {logo ? (
                    <Image source={{ uri: logo }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="image" size={32} color="#666" />
                      <Text style={styles.imagePickerText}>Tap to upload logo</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>Brand Banner (Optional)</Text>
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={() => handlePickImage('banner')}
                >
                  {banner ? (
                    <Image source={{ uri: banner }} style={styles.previewImageWide} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="image" size={32} color="#666" />
                      <Text style={styles.imagePickerText}>Tap to upload banner</Text>
                    </View>
                  )}
                </TouchableOpacity>
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
                      {editingBrand ? 'Update' : 'Create'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButtonContainer: {
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stats: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  brandCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  brandLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  brandCategory: {
    fontSize: 13,
    color: '#888',
  },
  brandDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
    lineHeight: 20,
  },
  brandActions: {
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
    borderWidth: 1,
  },
  editButton: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F320',
  },
  deleteButton: {
    borderColor: '#f44336',
    backgroundColor: '#f4433620',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalForm: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  imagePickerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  previewImageWide: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#333',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});