from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "skyriting-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="Skyriting API")
api_router = APIRouter(prefix="/api")

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    gender: Optional[str] = None
    bio: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    profile_photo: Optional[str] = None
    interests: Optional[List[str]] = None
    style_preferences: Optional[List[str]] = None
    gender: Optional[str] = None

class BrandCreate(BaseModel):
    name: str
    description: str
    category: str
    logo: Optional[str] = None
    banner: Optional[str] = None

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    logo: Optional[str] = None
    banner: Optional[str] = None
    status: Optional[str] = None

class ProductCreate(BaseModel):
    brand_id: str
    name: str
    description: str
    price: float
    stock: int
    category: str
    subcategory: Optional[str] = None
    colors: List[str] = []
    sizes: List[str] = []
    images: List[str] = []
    gender: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    colors: Optional[List[str]] = None
    sizes: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    gender: Optional[str] = None

class PostCreate(BaseModel):
    content: str
    media: List[str] = []
    tagged_products: List[str] = []

class OrderCreate(BaseModel):
    items: List[Dict[str, Any]]
    total_amount: float
    shipping_address: Dict[str, str]
    payment_method: str = "mock"

class CommentCreate(BaseModel):
    content: str

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = {
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "gender": user_data.gender,
        "bio": user_data.bio,
        "profile_photo": None,
        "interests": [],
        "style_preferences": [],
        "role": "user",
        "is_verified": False,
        "followers": [],
        "following": [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id = str(result.inserted_id)
    
    # Create token
    token = create_access_token({"sub": user_id})
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": "user"
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": str(user["_id"])})
    
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user"),
            "is_verified": user.get("is_verified", False)
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user.get("role", "user"),
        "profile_photo": current_user.get("profile_photo"),
        "bio": current_user.get("bio"),
        "is_verified": current_user.get("is_verified", False),
        "followers_count": len(current_user.get("followers", [])),
        "following_count": len(current_user.get("following", []))
    }

# User Routes
@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": str(user["_id"]),
            "name": user["name"],
            "bio": user.get("bio"),
            "profile_photo": user.get("profile_photo"),
            "role": user.get("role", "user"),
            "is_verified": user.get("is_verified", False),
            "followers_count": len(user.get("followers", [])),
            "following_count": len(user.get("following", []))
        }
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

@api_router.put("/users/profile")
async def update_profile(profile_data: UserProfile, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in profile_data.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_dict}
    )
    
    return {"message": "Profile updated successfully"}

@api_router.post("/users/follow/{user_id}")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if str(current_user["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    try:
        target_user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Add to following list
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$addToSet": {"following": user_id}}
        )
        
        # Add to followers list
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"followers": str(current_user["_id"])}}
        )
        
        return {"message": "User followed successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

@api_router.post("/users/unfollow/{user_id}")
async def unfollow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Remove from following list
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$pull": {"following": user_id}}
        )
        
        # Remove from followers list
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"followers": str(current_user["_id"])}}
        )
        
        return {"message": "User unfollowed successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

# Brand Routes
@api_router.get("/brands")
async def get_brands(status: Optional[str] = "approved"):
    query = {} if status == "all" else {"status": status}
    brands = await db.brands.find(query).to_list(1000)
    return [{**brand, "_id": str(brand["_id"])} for brand in brands]

@api_router.get("/brands/{brand_id}")
async def get_brand(brand_id: str):
    try:
        brand = await db.brands.find_one({"_id": ObjectId(brand_id)})
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        return {**brand, "_id": str(brand["_id"])}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid brand ID")

@api_router.post("/brands")
async def create_brand(brand_data: BrandCreate, current_user: dict = Depends(get_admin_user)):
    brand_dict = brand_data.dict()
    brand_dict.update({
        "status": "approved",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    result = await db.brands.insert_one(brand_dict)
    return {"id": str(result.inserted_id), "message": "Brand created successfully"}

@api_router.put("/brands/{brand_id}")
async def update_brand(brand_id: str, brand_data: BrandUpdate, current_user: dict = Depends(get_admin_user)):
    try:
        update_dict = {k: v for k, v in brand_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await db.brands.update_one(
            {"_id": ObjectId(brand_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        return {"message": "Brand updated successfully"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid brand ID")

@api_router.delete("/brands/{brand_id}")
async def delete_brand(brand_id: str, current_user: dict = Depends(get_admin_user)):
    try:
        result = await db.brands.delete_one({"_id": ObjectId(brand_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Brand not found")
        return {"message": "Brand deleted successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid brand ID")

# Product Routes
@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    brand_id: Optional[str] = None,
    gender: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    query = {"is_active": True}
    if category:
        query["category"] = category
    if brand_id:
        query["brand_id"] = brand_id
    if gender:
        query["gender"] = gender
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    return [{**product, "_id": str(product["_id"])} for product in products]

@api_router.get("/products/trending")
async def get_trending_products():
    # For now, return most recently added products
    products = await db.products.find({"is_active": True}).sort("created_at", -1).limit(20).to_list(20)
    return [{**product, "_id": str(product["_id"])} for product in products]

@api_router.get("/products/new-arrivals")
async def get_new_arrivals():
    products = await db.products.find({"is_active": True}).sort("created_at", -1).limit(20).to_list(20)
    return [{**product, "_id": str(product["_id"])} for product in products]

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return {**product, "_id": str(product["_id"])}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")

@api_router.post("/products")
async def create_product(product_data: ProductCreate, current_user: dict = Depends(get_admin_user)):
    product_dict = product_data.dict()
    product_dict.update({
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    result = await db.products.insert_one(product_dict)
    return {"id": str(result.inserted_id), "message": "Product created successfully"}

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: ProductUpdate, current_user: dict = Depends(get_admin_user)):
    try:
        update_dict = {k: v for k, v in product_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"message": "Product updated successfully"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_admin_user)):
    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deleted successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")

# Posts Routes
@api_router.get("/posts/feed")
async def get_feed(limit: int = 20, skip: int = 0):
    posts = await db.posts.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user data
    result = []
    for post in posts:
        user = await db.users.find_one({"_id": ObjectId(post["user_id"])})
        result.append({
            **post,
            "_id": str(post["_id"]),
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "profile_photo": user.get("profile_photo"),
                "is_verified": user.get("is_verified", False)
            } if user else None,
            "likes_count": len(post.get("likes", [])),
            "comments_count": len(post.get("comments", []))
        })
    
    return result

@api_router.post("/posts")
async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
    # Check if user is verified influencer for product tagging
    if post_data.tagged_products and not current_user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Only verified influencers can tag products")
    
    post_dict = post_data.dict()
    post_dict.update({
        "user_id": str(current_user["_id"]),
        "likes": [],
        "comments": [],
        "views_count": 0,
        "created_at": datetime.utcnow()
    })
    
    result = await db.posts.insert_one(post_dict)
    return {"id": str(result.inserted_id), "message": "Post created successfully"}

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    try:
        user_id = str(current_user["_id"])
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        likes = post.get("likes", [])
        if user_id in likes:
            # Unlike
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$pull": {"likes": user_id}}
            )
            return {"message": "Post unliked", "liked": False}
        else:
            # Like
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$addToSet": {"likes": user_id}}
            )
            return {"message": "Post liked", "liked": True}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

@api_router.post("/posts/{post_id}/comment")
async def comment_on_post(post_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    try:
        comment = {
            "user_id": str(current_user["_id"]),
            "user_name": current_user["name"],
            "content": comment_data.content,
            "created_at": datetime.utcnow()
        }
        
        await db.posts.update_one(
            {"_id": ObjectId(post_id)},
            {"$push": {"comments": comment}}
        )
        
        return {"message": "Comment added successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid post ID")

# Order Routes
@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_dict = order_data.dict()
    order_dict.update({
        "user_id": str(current_user["_id"]),
        "status": "pending",
        "payment_status": "completed",  # Mock payment
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    result = await db.orders.insert_one(order_dict)
    return {"id": str(result.inserted_id), "message": "Order placed successfully", "order_id": str(result.inserted_id)}

@api_router.get("/orders/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": str(current_user["_id"])}).sort("created_at", -1).to_list(100)
    return [{**order, "_id": str(order["_id"])} for order in orders]

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check if user owns the order or is admin
        if order["user_id"] != str(current_user["_id"]) and current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {**order, "_id": str(order["_id"])}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")

@api_router.get("/orders")
async def get_all_orders(current_user: dict = Depends(get_admin_user)):
    orders = await db.orders.find().sort("created_at", -1).to_list(1000)
    return [{**order, "_id": str(order["_id"])} for order in orders]

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str = Body(..., embed=True), current_user: dict = Depends(get_admin_user)):
    try:
        result = await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")
        
        return {"message": "Order status updated successfully"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order ID")

# Wishlist Routes
@api_router.get("/wishlist")
async def get_wishlist(current_user: dict = Depends(get_current_user)):
    wishlist = await db.wishlists.find_one({"user_id": str(current_user["_id"])})
    if not wishlist:
        return {"products": []}
    
    # Get product details
    product_ids = [ObjectId(pid) for pid in wishlist.get("product_ids", [])]
    products = await db.products.find({"_id": {"$in": product_ids}}).to_list(100)
    
    return {"products": [{**product, "_id": str(product["_id"])} for product in products]}

@api_router.post("/wishlist/add/{product_id}")
async def add_to_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    try:
        # Check if product exists
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Add to wishlist
        await db.wishlists.update_one(
            {"user_id": str(current_user["_id"])},
            {"$addToSet": {"product_ids": product_id}},
            upsert=True
        )
        
        return {"message": "Product added to wishlist"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")

@api_router.delete("/wishlist/remove/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: dict = Depends(get_current_user)):
    try:
        await db.wishlists.update_one(
            {"user_id": str(current_user["_id"])},
            {"$pull": {"product_ids": product_id}}
        )
        
        return {"message": "Product removed from wishlist"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product ID")

# Admin Routes
@api_router.get("/admin/analytics")
async def get_analytics(current_user: dict = Depends(get_admin_user)):
    users_count = await db.users.count_documents({})
    influencers_count = await db.users.count_documents({"is_verified": True})
    brands_count = await db.brands.count_documents({"status": "approved"})
    products_count = await db.products.count_documents({"is_active": True})
    orders_count = await db.orders.count_documents({})
    
    # Calculate total revenue
    orders = await db.orders.find({"payment_status": "completed"}).to_list(10000)
    total_revenue = sum(order.get("total_amount", 0) for order in orders)
    
    return {
        "users_count": users_count,
        "influencers_count": influencers_count,
        "brands_count": brands_count,
        "products_count": products_count,
        "orders_count": orders_count,
        "total_revenue": total_revenue
    }

@api_router.put("/admin/verify-influencer/{user_id}")
async def verify_influencer(user_id: str, current_user: dict = Depends(get_admin_user)):
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_verified": True, "role": "influencer"}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User verified as influencer"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

@api_router.put("/admin/ban-user/{user_id}")
async def ban_user(user_id: str, current_user: dict = Depends(get_admin_user)):
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_banned": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User banned successfully"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_admin_user)):
    users = await db.users.find().to_list(1000)
    return [{
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "is_verified": user.get("is_verified", False),
        "created_at": user.get("created_at")
    } for user in users]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
