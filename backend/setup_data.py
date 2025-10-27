import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup_initial_data():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tlsAllowInvalidCertificates=True)
    db = client[os.environ['DB_NAME']]
    
    print("Setting up initial data...")
    
    # Get admin credentials from env
    admin_email = os.getenv("ADMIN_EMAIL", "admin@skyriting.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": admin_email})
    if not admin_exists:
        admin = {
            "email": "admin@skyriting.com",
            "password_hash": pwd_context.hash("admin123"),
            "name": "Admin User",
            "gender": None,
            "bio": "System Administrator",
            "profile_photo": None,
            "interests": [],
            "style_preferences": [],
            "role": "admin",
            "is_verified": True,
            "followers": [],
            "following": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.users.insert_one(admin)
        print("✓ Admin user created (admin@skyriting.com / admin123)")
    else:
        print("✓ Admin user already exists")
    
    # Create sample brands
    brands_exist = await db.brands.count_documents({})
    if brands_exist == 0:
        sample_brands = [
            {
                "name": "Urban Style",
                "description": "Contemporary urban fashion",
                "category": "Streetwear",
                "status": "approved",
                "logo": None,
                "banner": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "name": "Elegant Collection",
                "description": "Sophisticated and elegant designs",
                "category": "Formal",
                "status": "approved",
                "logo": None,
                "banner": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "name": "Sport Plus",
                "description": "Athletic and comfortable sportswear",
                "category": "Sports",
                "status": "approved",
                "logo": None,
                "banner": None,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        result = await db.brands.insert_many(sample_brands)
        print(f"✓ Created {len(result.inserted_ids)} sample brands")
        
        # Create sample products for each brand
        brand_ids = result.inserted_ids
        sample_products = []
        
        product_templates = [
            ("Classic White Tee", "Essential white t-shirt for everyday wear", 29.99, "Casual", ["men", "women"]),
            ("Denim Jacket", "Vintage denim jacket with modern fit", 89.99, "Outerwear", ["men", "women"]),
            ("Running Shoes", "Lightweight running shoes for optimal performance", 119.99, "Footwear", ["men", "women"]),
            ("Casual Sneakers", "Comfortable sneakers for daily activities", 79.99, "Footwear", ["men", "women"]),
            ("Hoodie Premium", "Soft premium cotton hoodie", 59.99, "Casual", ["men", "women"]),
            ("Slim Fit Jeans", "Classic slim fit denim jeans", 69.99, "Pants", ["men", "women"]),
        ]
        
        for idx, (name, desc, price, category, genders) in enumerate(product_templates):
            brand_idx = idx % len(brand_ids)
            for gender in genders:
                sample_products.append({
                    "brand_id": str(brand_ids[brand_idx]),
                    "name": f"{name} - {gender.capitalize()}",
                    "description": desc,
                    "price": price,
                    "stock": 50,
                    "category": category,
                    "subcategory": None,
                    "colors": ["Black", "White", "Navy"],
                    "sizes": ["S", "M", "L", "XL"],
                    "images": [],
                    "gender": gender,
                    "is_active": True,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                })
        
        await db.products.insert_many(sample_products)
        print(f"✓ Created {len(sample_products)} sample products")
    else:
        print("✓ Brands and products already exist")
    
    print("\nSetup complete!")
    print("\nYou can login with:")
    print("Email: admin@skyriting.com")
    print("Password: admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(setup_initial_data())
