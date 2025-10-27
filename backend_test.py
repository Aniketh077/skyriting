#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Skyriting V1
Tests all backend APIs according to priority: Auth -> Products -> Brands -> Users -> Orders -> Wishlist -> Posts -> Admin
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://outfit-discovery.preview.emergentagent.com/api"
ADMIN_EMAIL = "aniketh0701@gmail.com"
ADMIN_PASSWORD = "Admin@123"

class SkyratingAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.test_brand_id = None
        self.test_product_id = None
        self.test_order_id = None
        self.test_post_id = None
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }

    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        
        if success:
            self.results["passed"] += 1
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {message}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, token: str = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}{endpoint}"
        
        request_headers = {"Content-Type": "application/json"}
        if headers:
            request_headers.update(headers)
        if token:
            request_headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=request_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=request_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=request_headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}, 0
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}
            
            return response.status_code < 400, response_data, response.status_code
        
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    # ==================== AUTH TESTS (CRITICAL) ====================
    
    def test_auth_login_admin(self):
        """Test admin login"""
        data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        success, response, status_code = self.make_request("POST", "/auth/login", data)
        
        if success and "token" in response:
            self.admin_token = response["token"]
            self.log_result("Auth - Admin Login", True, f"Admin logged in successfully")
            return True
        else:
            self.log_result("Auth - Admin Login", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_auth_register_user(self):
        """Test user registration"""
        import time
        unique_email = f"testuser{int(time.time())}@example.com"
        data = {
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User",
            "gender": "female",
            "bio": "Fashion enthusiast"
        }
        
        success, response, status_code = self.make_request("POST", "/auth/register", data)
        
        if success and "token" in response:
            self.user_token = response["token"]
            self.test_user_id = response["user"]["id"]
            self.log_result("Auth - User Registration", True, f"User registered successfully")
            return True
        else:
            self.log_result("Auth - User Registration", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_auth_me_admin(self):
        """Test get current user info for admin"""
        if not self.admin_token:
            self.log_result("Auth - Get Admin Info", False, "No admin token available")
            return False
        
        success, response, status_code = self.make_request("GET", "/auth/me", token=self.admin_token)
        
        if success and "email" in response and response["email"] == ADMIN_EMAIL:
            self.log_result("Auth - Get Admin Info", True, f"Admin info retrieved successfully")
            return True
        else:
            self.log_result("Auth - Get Admin Info", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_auth_me_user(self):
        """Test get current user info for regular user"""
        if not self.user_token:
            self.log_result("Auth - Get User Info", False, "No user token available")
            return False
        
        success, response, status_code = self.make_request("GET", "/auth/me", token=self.user_token)
        
        if success and "email" in response:
            self.log_result("Auth - Get User Info", True, f"User info retrieved successfully")
            return True
        else:
            self.log_result("Auth - Get User Info", False, f"Status: {status_code}, Response: {response}")
            return False

    # ==================== PRODUCT TESTS (CRITICAL) ====================
    
    def test_products_list(self):
        """Test get all products"""
        success, response, status_code = self.make_request("GET", "/products")
        
        if success and isinstance(response, list):
            self.log_result("Products - List All", True, f"Retrieved {len(response)} products")
            if response:
                self.test_product_id = response[0]["_id"]
            return True
        else:
            self.log_result("Products - List All", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_products_trending(self):
        """Test get trending products"""
        success, response, status_code = self.make_request("GET", "/products/trending")
        
        if success and isinstance(response, list):
            self.log_result("Products - Trending", True, f"Retrieved {len(response)} trending products")
            return True
        else:
            self.log_result("Products - Trending", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_products_new_arrivals(self):
        """Test get new arrivals"""
        success, response, status_code = self.make_request("GET", "/products/new-arrivals")
        
        if success and isinstance(response, list):
            self.log_result("Products - New Arrivals", True, f"Retrieved {len(response)} new arrivals")
            return True
        else:
            self.log_result("Products - New Arrivals", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_products_single(self):
        """Test get single product"""
        if not self.test_product_id:
            self.log_result("Products - Get Single", False, "No product ID available")
            return False
        
        success, response, status_code = self.make_request("GET", f"/products/{self.test_product_id}")
        
        if success and "_id" in response:
            self.log_result("Products - Get Single", True, f"Retrieved product: {response.get('name', 'Unknown')}")
            return True
        else:
            self.log_result("Products - Get Single", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_products_create_admin(self):
        """Test create product (admin only)"""
        if not self.admin_token:
            self.log_result("Products - Create (Admin)", False, "No admin token available")
            return False
        
        # Use the brand ID we got from brands list, or create a fallback
        brand_id = self.test_brand_id if self.test_brand_id else "68ff1c7dd02e0fe94ba3a09d"
        
        data = {
            "brand_id": brand_id,
            "name": "Test Product",
            "description": "A test product for API testing",
            "price": 99.99,
            "stock": 50,
            "category": "clothing",
            "subcategory": "tops",
            "colors": ["red", "blue"],
            "sizes": ["S", "M", "L"],
            "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"],
            "gender": "unisex"
        }
        
        success, response, status_code = self.make_request("POST", "/products", data, token=self.admin_token)
        
        if success and "id" in response:
            self.log_result("Products - Create (Admin)", True, f"Product created with ID: {response['id']}")
            return True
        else:
            self.log_result("Products - Create (Admin)", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_products_create_user_forbidden(self):
        """Test create product as regular user (should fail)"""
        if not self.user_token:
            self.log_result("Products - Create (User Forbidden)", False, "No user token available")
            return False
        
        # Use the brand ID we got from brands list, or create a fallback
        brand_id = self.test_brand_id if self.test_brand_id else "68ff1c7dd02e0fe94ba3a09d"
        
        data = {
            "brand_id": brand_id,
            "name": "Unauthorized Product",
            "description": "This should fail",
            "price": 50.0,
            "stock": 10,
            "category": "clothing"
        }
        
        success, response, status_code = self.make_request("POST", "/products", data, token=self.user_token)
        
        if not success and status_code == 403:
            self.log_result("Products - Create (User Forbidden)", True, "Correctly denied access to regular user")
            return True
        else:
            self.log_result("Products - Create (User Forbidden)", False, f"Expected 403, got {status_code}: {response}")
            return False

    # ==================== BRAND TESTS (HIGH) ====================
    
    def test_brands_list(self):
        """Test get all brands"""
        success, response, status_code = self.make_request("GET", "/brands")
        
        if success and isinstance(response, list):
            self.log_result("Brands - List All", True, f"Retrieved {len(response)} brands")
            if response:
                self.test_brand_id = response[0]["_id"]
            return True
        else:
            self.log_result("Brands - List All", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_brands_single(self):
        """Test get single brand"""
        if not self.test_brand_id:
            self.log_result("Brands - Get Single", False, "No brand ID available")
            return False
        
        success, response, status_code = self.make_request("GET", f"/brands/{self.test_brand_id}")
        
        if success and "_id" in response:
            self.log_result("Brands - Get Single", True, f"Retrieved brand: {response.get('name', 'Unknown')}")
            return True
        else:
            self.log_result("Brands - Get Single", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_brands_create_admin(self):
        """Test create brand (admin only)"""
        if not self.admin_token:
            self.log_result("Brands - Create (Admin)", False, "No admin token available")
            return False
        
        data = {
            "name": "Test Brand",
            "description": "A test brand for API testing",
            "category": "fashion",
            "logo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
        }
        
        success, response, status_code = self.make_request("POST", "/brands", data, token=self.admin_token)
        
        if success and "id" in response:
            self.log_result("Brands - Create (Admin)", True, f"Brand created with ID: {response['id']}")
            return True
        else:
            self.log_result("Brands - Create (Admin)", False, f"Status: {status_code}, Response: {response}")
            return False

    # ==================== USER TESTS (HIGH) ====================
    
    def test_users_get_profile(self):
        """Test get user profile"""
        if not self.test_user_id:
            self.log_result("Users - Get Profile", False, "No user ID available")
            return False
        
        success, response, status_code = self.make_request("GET", f"/users/{self.test_user_id}")
        
        if success and "id" in response:
            self.log_result("Users - Get Profile", True, f"Retrieved profile for: {response.get('name', 'Unknown')}")
            return True
        else:
            self.log_result("Users - Get Profile", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_users_update_profile(self):
        """Test update own profile"""
        if not self.user_token:
            self.log_result("Users - Update Profile", False, "No user token available")
            return False
        
        data = {
            "bio": "Updated bio for testing",
            "interests": ["fashion", "style", "shopping"]
        }
        
        success, response, status_code = self.make_request("PUT", "/users/profile", data, token=self.user_token)
        
        if success and "message" in response:
            self.log_result("Users - Update Profile", True, "Profile updated successfully")
            return True
        else:
            self.log_result("Users - Update Profile", False, f"Status: {status_code}, Response: {response}")
            return False

    # ==================== ORDER TESTS (HIGH) ====================
    
    def test_orders_create(self):
        """Test create order"""
        if not self.user_token or not self.test_product_id:
            self.log_result("Orders - Create", False, "No user token or product ID available")
            return False
        
        data = {
            "items": [
                {
                    "product_id": self.test_product_id,
                    "quantity": 2,
                    "price": 99.99
                }
            ],
            "total_amount": 199.98,
            "shipping_address": {
                "street": "123 Test St",
                "city": "Test City",
                "state": "TS",
                "zip": "12345",
                "country": "Test Country"
            },
            "payment_method": "mock"
        }
        
        success, response, status_code = self.make_request("POST", "/orders", data, token=self.user_token)
        
        if success and "order_id" in response:
            self.test_order_id = response["order_id"]
            self.log_result("Orders - Create", True, f"Order created with ID: {self.test_order_id}")
            return True
        else:
            self.log_result("Orders - Create", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_orders_my_orders(self):
        """Test get user's orders"""
        if not self.user_token:
            self.log_result("Orders - My Orders", False, "No user token available")
            return False
        
        success, response, status_code = self.make_request("GET", "/orders/my-orders", token=self.user_token)
        
        if success and isinstance(response, list):
            self.log_result("Orders - My Orders", True, f"Retrieved {len(response)} orders")
            return True
        else:
            self.log_result("Orders - My Orders", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_orders_get_single(self):
        """Test get single order"""
        if not self.user_token or not self.test_order_id:
            self.log_result("Orders - Get Single", False, "No user token or order ID available")
            return False
        
        success, response, status_code = self.make_request("GET", f"/orders/{self.test_order_id}", token=self.user_token)
        
        if success and "_id" in response:
            self.log_result("Orders - Get Single", True, f"Retrieved order: {response['_id']}")
            return True
        else:
            self.log_result("Orders - Get Single", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_orders_admin_list(self):
        """Test get all orders (admin only)"""
        if not self.admin_token:
            self.log_result("Orders - Admin List", False, "No admin token available")
            return False
        
        success, response, status_code = self.make_request("GET", "/orders", token=self.admin_token)
        
        if success and isinstance(response, list):
            self.log_result("Orders - Admin List", True, f"Admin retrieved {len(response)} orders")
            return True
        else:
            self.log_result("Orders - Admin List", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_orders_update_status(self):
        """Test update order status (admin only)"""
        if not self.admin_token or not self.test_order_id:
            self.log_result("Orders - Update Status", False, "No admin token or order ID available")
            return False
        
        data = {"status": "shipped"}
        
        success, response, status_code = self.make_request("PUT", f"/orders/{self.test_order_id}/status", data, token=self.admin_token)
        
        if success and "message" in response:
            self.log_result("Orders - Update Status", True, "Order status updated successfully")
            return True
        else:
            self.log_result("Orders - Update Status", False, f"Status: {status_code}, Response: {response}")
            return False

    # ==================== WISHLIST TESTS (MEDIUM) ====================
    
    def test_wishlist_get(self):
        """Test get wishlist"""
        if not self.user_token:
            self.log_result("Wishlist - Get", False, "No user token available")
            return False
        
        success, response, status_code = self.make_request("GET", "/wishlist", token=self.user_token)
        
        if success and "products" in response:
            self.log_result("Wishlist - Get", True, f"Retrieved wishlist with {len(response['products'])} items")
            return True
        else:
            self.log_result("Wishlist - Get", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_wishlist_add(self):
        """Test add to wishlist"""
        if not self.user_token or not self.test_product_id:
            self.log_result("Wishlist - Add", False, "No user token or product ID available")
            return False
        
        success, response, status_code = self.make_request("POST", f"/wishlist/add/{self.test_product_id}", token=self.user_token)
        
        if success and "message" in response:
            self.log_result("Wishlist - Add", True, "Product added to wishlist")
            return True
        else:
            self.log_result("Wishlist - Add", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_wishlist_remove(self):
        """Test remove from wishlist"""
        if not self.user_token or not self.test_product_id:
            self.log_result("Wishlist - Remove", False, "No user token or product ID available")
            return False
        
        success, response, status_code = self.make_request("DELETE", f"/wishlist/remove/{self.test_product_id}", token=self.user_token)
        
        if success and "message" in response:
            self.log_result("Wishlist - Remove", True, "Product removed from wishlist")
            return True
        else:
            self.log_result("Wishlist - Remove", False, f"Status: {status_code}, Response: {response}")
            return False

    # ==================== POSTS/FEED TESTS (MEDIUM) ====================
    
    def test_posts_feed(self):
        """Test get feed"""
        success, response, status_code = self.make_request("GET", "/posts/feed")
        
        if success and isinstance(response, list):
            self.log_result("Posts - Feed", True, f"Retrieved {len(response)} posts")
            return True
        else:
            self.log_result("Posts - Feed", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_posts_create_unverified(self):
        """Test create post as unverified user (should work without product tagging)"""
        if not self.user_token:
            self.log_result("Posts - Create (Unverified)", False, "No user token available")
            return False
        
        data = {
            "content": "Test post from unverified user",
            "media": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"],
            "tagged_products": []
        }
        
        success, response, status_code = self.make_request("POST", "/posts", data, token=self.user_token)
        
        if success and "id" in response:
            self.test_post_id = response["id"]
            self.log_result("Posts - Create (Unverified)", True, f"Post created with ID: {self.test_post_id}")
            return True
        else:
            self.log_result("Posts - Create (Unverified)", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_posts_like(self):
        """Test like/unlike post"""
        if not self.user_token or not self.test_post_id:
            self.log_result("Posts - Like", False, "No user token or post ID available")
            return False
        
        success, response, status_code = self.make_request("POST", f"/posts/{self.test_post_id}/like", token=self.user_token)
        
        if success and "liked" in response:
            self.log_result("Posts - Like", True, f"Post like status: {response['liked']}")
            return True
        else:
            self.log_result("Posts - Like", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_posts_comment(self):
        """Test comment on post"""
        if not self.user_token or not self.test_post_id:
            self.log_result("Posts - Comment", False, "No user token or post ID available")
            return False
        
        data = {"content": "Great post! Love the style."}
        
        success, response, status_code = self.make_request("POST", f"/posts/{self.test_post_id}/comment", data, token=self.user_token)
        
        if success and "message" in response:
            self.log_result("Posts - Comment", True, "Comment added successfully")
            return True
        else:
            self.log_result("Posts - Comment", False, f"Status: {status_code}, Response: {response}")
            return False

    # ==================== ADMIN TESTS (MEDIUM) ====================
    
    def test_admin_analytics(self):
        """Test get analytics (admin only)"""
        if not self.admin_token:
            self.log_result("Admin - Analytics", False, "No admin token available")
            return False
        
        success, response, status_code = self.make_request("GET", "/admin/analytics", token=self.admin_token)
        
        if success and "users_count" in response:
            self.log_result("Admin - Analytics", True, f"Analytics: {response['users_count']} users, {response['products_count']} products")
            return True
        else:
            self.log_result("Admin - Analytics", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_admin_verify_influencer(self):
        """Test verify user as influencer (admin only)"""
        if not self.admin_token or not self.test_user_id:
            self.log_result("Admin - Verify Influencer", False, "No admin token or user ID available")
            return False
        
        success, response, status_code = self.make_request("PUT", f"/admin/verify-influencer/{self.test_user_id}", token=self.admin_token)
        
        if success and "message" in response:
            self.log_result("Admin - Verify Influencer", True, "User verified as influencer")
            return True
        else:
            self.log_result("Admin - Verify Influencer", False, f"Status: {status_code}, Response: {response}")
            return False

    def test_admin_list_users(self):
        """Test get all users (admin only)"""
        if not self.admin_token:
            self.log_result("Admin - List Users", False, "No admin token available")
            return False
        
        success, response, status_code = self.make_request("GET", "/admin/users", token=self.admin_token)
        
        if success and isinstance(response, list):
            self.log_result("Admin - List Users", True, f"Admin retrieved {len(response)} users")
            return True
        else:
            self.log_result("Admin - List Users", False, f"Status: {status_code}, Response: {response}")
            return False

    # ==================== ERROR CASE TESTS ====================
    
    def test_auth_without_token(self):
        """Test protected endpoint without token"""
        success, response, status_code = self.make_request("GET", "/auth/me")
        
        if not success and status_code == 401:
            self.log_result("Error Cases - No Token", True, "Correctly denied access without token")
            return True
        else:
            self.log_result("Error Cases - No Token", False, f"Expected 401, got {status_code}: {response}")
            return False

    def test_invalid_product_id(self):
        """Test get product with invalid ID"""
        success, response, status_code = self.make_request("GET", "/products/invalid_id")
        
        if not success and status_code == 400:
            self.log_result("Error Cases - Invalid Product ID", True, "Correctly handled invalid product ID")
            return True
        else:
            self.log_result("Error Cases - Invalid Product ID", False, f"Expected 400, got {status_code}: {response}")
            return False

    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run all tests in priority order"""
        print("=" * 60)
        print("SKYRITING V1 BACKEND API TESTING")
        print("=" * 60)
        print(f"Testing against: {self.base_url}")
        print()

        # CRITICAL TESTS - Auth APIs
        print("🔐 CRITICAL: AUTH TESTS")
        print("-" * 30)
        self.test_auth_login_admin()
        self.test_auth_register_user()
        self.test_auth_me_admin()
        self.test_auth_me_user()
        print()

        # CRITICAL TESTS - Product APIs
        print("📦 CRITICAL: PRODUCT TESTS")
        print("-" * 30)
        self.test_products_list()
        self.test_products_trending()
        self.test_products_new_arrivals()
        self.test_products_single()
        self.test_products_create_admin()
        self.test_products_create_user_forbidden()
        print()

        # HIGH PRIORITY - Brand APIs
        print("🏷️ HIGH: BRAND TESTS")
        print("-" * 30)
        self.test_brands_list()
        self.test_brands_single()
        self.test_brands_create_admin()
        print()

        # HIGH PRIORITY - User APIs
        print("👤 HIGH: USER TESTS")
        print("-" * 30)
        self.test_users_get_profile()
        self.test_users_update_profile()
        print()

        # HIGH PRIORITY - Order APIs
        print("🛒 HIGH: ORDER TESTS")
        print("-" * 30)
        self.test_orders_create()
        self.test_orders_my_orders()
        self.test_orders_get_single()
        self.test_orders_admin_list()
        self.test_orders_update_status()
        print()

        # MEDIUM PRIORITY - Wishlist APIs
        print("❤️ MEDIUM: WISHLIST TESTS")
        print("-" * 30)
        self.test_wishlist_get()
        self.test_wishlist_add()
        self.test_wishlist_remove()
        print()

        # MEDIUM PRIORITY - Posts/Feed APIs
        print("📱 MEDIUM: POSTS/FEED TESTS")
        print("-" * 30)
        self.test_posts_feed()
        self.test_posts_create_unverified()
        self.test_posts_like()
        self.test_posts_comment()
        print()

        # MEDIUM PRIORITY - Admin APIs
        print("⚙️ MEDIUM: ADMIN TESTS")
        print("-" * 30)
        self.test_admin_analytics()
        self.test_admin_verify_influencer()
        self.test_admin_list_users()
        print()

        # ERROR CASE TESTS
        print("⚠️ ERROR CASE TESTS")
        print("-" * 30)
        self.test_auth_without_token()
        self.test_invalid_product_id()
        print()

        # FINAL RESULTS
        print("=" * 60)
        print("TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"✅ PASSED: {self.results['passed']}")
        print(f"❌ FAILED: {self.results['failed']}")
        print(f"📊 TOTAL:  {self.results['passed'] + self.results['failed']}")
        
        if self.results['failed'] > 0:
            print("\n🚨 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        print("\n" + "=" * 60)
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = SkyratingAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)