import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="wishlist" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="brand/[id]" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="admin/dashboard" />
        <Stack.Screen name="admin/orders" />
        <Stack.Screen name="admin/brands" />
        <Stack.Screen name="admin/products" />
      </Stack>
    </GestureHandlerRootView>
  );
}
