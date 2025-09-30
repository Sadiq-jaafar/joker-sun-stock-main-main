# Joker Solar Stock - Backend Setup Guide

This guide will help you set up the complete backend for the Joker Solar Stock management system using Supabase.

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in your project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development
```

### 2. Database Setup

Run the SQL script `supabase-setup.sql` in your Supabase SQL editor. This script will:

- ✅ Fix schema inconsistencies
- ✅ Add missing columns for dual pricing and length-based items
- ✅ Create all required RPC functions
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create storage bucket for product images
- ✅ Add performance indexes
- ✅ Create useful database views
- ✅ Insert sample categories

### 3. Storage Setup

The script automatically creates a storage bucket called `product-images` for inventory item photos.

## 📊 Database Schema

### Core Tables

#### Users
- `id` (uuid, primary key)
- `name` (varchar)
- `email` (varchar, unique)
- `role` (admin | user)
- `password_hash` (varchar - managed by Supabase Auth)
- `created_at`, `updated_at` (timestamps)

#### Inventory Items
- `id` (uuid, primary key)
- `name`, `category`, `brand`, `model` (varchar)
- `min_price`, `max_price`, `cost` (decimal)
- `quantity` (decimal - supports length-based items)
- `length` (decimal, nullable)
- `measure_type` (standard | length)
- `description` (text, nullable)
- `image_url` (varchar, nullable)
- `created_at`, `updated_at` (timestamps)

#### Sales
- `id` (uuid, primary key)
- `receipt_number` (varchar, unique)
- `customer_name` (varchar)
- `total` (decimal)
- `sold_by` (uuid, references users)
- `sold_at`, `created_at` (timestamps)

#### Sale Items
- `id` (uuid, primary key)
- `sale_id` (uuid, references sales)
- `item_id` (uuid, references inventory_items)
- `quantity` (decimal)
- `unit_price`, `subtotal` (decimal)
- `item_type` (standard | length)
- `created_at` (timestamp)

#### Categories
- `id` (uuid, primary key)
- `name` (varchar, unique)
- `description` (text, nullable)
- `created_at`, `updated_at` (timestamps)

#### Audit Logs
- `id` (uuid, primary key)
- `user_id` (uuid, references users)
- `action` (varchar)
- `entity_type` (varchar)
- `entity_id` (uuid)
- `changes` (jsonb, nullable)
- `created_at` (timestamp)

## 🔧 RPC Functions

### `update_inventory_quantity(item_id, quantity_change)`
Updates inventory quantity and logs the change.

### `get_top_selling_items(limit_count)`
Returns top selling items with sales statistics.

### `generate_receipt_number()`
Generates unique receipt numbers in format: REC-YYYYMMDD-XXXX

### `create_sale_with_items(customer_name, total, items)`
Creates a complete sale transaction atomically with inventory updates.

## 🔒 Security Features

### Row Level Security (RLS)
- Users can view all inventory and sales
- Authenticated users can create and manage data
- Admins have full access to user management
- Audit logs are automatically created for all changes

### Storage Security
- Public read access for product images
- Authenticated users can upload/update/delete images

## 📈 Database Views

### `sales_with_details`
Sales data with seller information joined.

### `sale_items_with_details`
Sale items with product details joined.

### `inventory_with_category_details`
Inventory items with category information joined.

## 🚀 API Services

The backend provides these service modules:

### Auth Service (`src/services/auth.ts`)
- `signIn(email, password)`
- `signUp(email, password, userData)`
- `signOut()`
- `getCurrentUser()`
- `updateProfile(id, updates)`
- `resetPassword(email)`
- `updatePassword(newPassword)`
- `getAllUsers()`

### Inventory Service (`src/services/inventory.ts`)
- `getAll()` - Get all inventory items
- `getById(id)` - Get item by ID
- `create(item)` - Create new item
- `update(id, updates)` - Update item
- `delete(id)` - Delete item
- `uploadImage(file)` - Upload product image
- `updateStock(id, quantity)` - Update stock quantity
- `getByCategory(category)` - Get items by category
- `getLowStock(threshold)` - Get low stock items

### Sales Service (`src/services/sales.ts`)
- `getAll()` - Get all sales
- `getById(id)` - Get sale by ID
- `create(saleData)` - Create new sale
- `getSalesByDateRange(startDate, endDate)` - Get sales by date range
- `getTopSellingItems(limit)` - Get top selling items
- `getSalesByUser(userId)` - Get sales by user
- `getSalesStats()` - Get sales statistics

### Categories Service (`src/services/categories.ts`)
- `getAll()` - Get all categories
- `getById(id)` - Get category by ID
- `getByName(name)` - Get category by name
- `create(category)` - Create new category
- `update(id, updates)` - Update category
- `delete(id)` - Delete category
- `isUsed(categoryName)` - Check if category is in use

## 🔄 Authentication Flow

1. **Login**: User enters email/password → Supabase Auth → Get user profile
2. **Signup**: User creates account → Supabase Auth → Create user profile
3. **Session Management**: Automatic session handling with AuthContext
4. **Route Protection**: ProtectedRoute component handles access control
5. **Role-based Access**: Admin vs User permissions

## 📱 Frontend Integration

### AuthContext
- Manages user authentication state
- Provides login/logout/signup functions
- Handles session persistence
- Automatic redirects

### Protected Routes
- `ProtectedRoute` component wraps sensitive pages
- Role-based access control
- Automatic redirects for unauthorized access

## 🛠️ Development Tips

### Environment Variables
Make sure to set up your `.env` file with the correct Supabase credentials.

### Database Migrations
If you need to modify the schema, update both the SQL script and TypeScript types.

### Error Handling
All services include proper error handling with try/catch blocks.

### Type Safety
Full TypeScript support with generated types from Supabase schema.

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Found**
   - Ensure `.env` file is in project root
   - Check variable names match exactly
   - Restart development server after changes

2. **Authentication Errors**
   - Verify Supabase project settings
   - Check email confirmation settings
   - Ensure RLS policies are properly configured

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure database is accessible

4. **Storage Upload Failures**
   - Verify storage bucket exists
   - Check storage policies
   - Ensure file size limits are respected

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Verify your Supabase project settings
3. Ensure all SQL scripts have been executed
4. Check the network tab for failed requests

## 🎉 You're Ready!

Your backend is now fully set up with:
- ✅ Complete database schema
- ✅ Authentication system
- ✅ API services
- ✅ Security policies
- ✅ File storage
- ✅ Real-time capabilities

Start your development server and begin building your solar inventory management system!



