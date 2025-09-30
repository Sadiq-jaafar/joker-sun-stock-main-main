-- ============================================
-- SUPABASE BACKEND SETUP FOR JOKER SOLAR STOCK
-- ============================================

-- 1. Fix existing schema inconsistencies
-- ============================================

-- Fix the sales table buyer_name typo and add customer_name
ALTER TABLE sales 
  DROP COLUMN IF EXISTS buyer_name,
  ADD COLUMN customer_name varchar;

-- Remove duplicate buyer_name from sale_items (if it exists)
ALTER TABLE sale_items DROP COLUMN IF EXISTS buyer_name;

-- 2. Add missing columns for dual pricing and length-based items
-- ============================================

-- Add columns for dual pricing and length-based items
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS min_price decimal(10,2),
ADD COLUMN IF NOT EXISTS max_price decimal(10,2),
ADD COLUMN IF NOT EXISTS length decimal(10,2),
ADD COLUMN IF NOT EXISTS measure_type varchar check (measure_type in ('standard', 'length')) not null default 'standard';

-- Update price to min_price for existing records (if price column exists)
UPDATE inventory_items SET min_price = price, max_price = price * 1.2 WHERE price IS NOT NULL;

-- Add constraints for prices and length
ALTER TABLE inventory_items
ADD CONSTRAINT IF NOT EXISTS valid_prices check (min_price <= max_price and cost <= min_price),
ALTER COLUMN quantity TYPE decimal(10,2), -- Change from integer to decimal for length-based items
ADD CONSTRAINT IF NOT EXISTS valid_quantity check (quantity >= 0),
ADD CONSTRAINT IF NOT EXISTS valid_length check (
  (measure_type = 'length' and length is not null and length >= 0) or
  (measure_type = 'standard' and length is null)
);

-- Drop the old price column after migration (if it exists)
ALTER TABLE inventory_items DROP COLUMN IF EXISTS price;

-- Update quantity to handle decimals for length-based items
ALTER TABLE sale_items
ALTER COLUMN quantity TYPE decimal(10,2),
ADD COLUMN IF NOT EXISTS item_type varchar check (item_type in ('standard', 'length')) not null default 'standard',
ADD CONSTRAINT IF NOT EXISTS valid_sale_quantity check (quantity > 0);

-- 3. Create required RPC functions
-- ============================================

-- Function to update inventory quantity
CREATE OR REPLACE FUNCTION update_inventory_quantity(
  item_id uuid,
  quantity_change decimal(10,2)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory_items 
  SET quantity = quantity + quantity_change,
      updated_at = timezone('utc'::text, now())
  WHERE id = item_id;
  
  -- Log the inventory change
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'update_quantity',
    'inventory_items',
    item_id,
    jsonb_build_object('quantity_change', quantity_change)
  );
END;
$$;

-- Function to get top selling items
CREATE OR REPLACE FUNCTION get_top_selling_items(limit_count integer DEFAULT 10)
RETURNS TABLE (
  item_id uuid,
  item_name varchar,
  total_quantity_sold decimal(10,2),
  total_revenue decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.id as item_id,
    ii.name as item_name,
    SUM(si.quantity) as total_quantity_sold,
    SUM(si.subtotal) as total_revenue
  FROM sale_items si
  JOIN inventory_items ii ON si.item_id = ii.id
  GROUP BY ii.id, ii.name
  ORDER BY total_quantity_sold DESC
  LIMIT limit_count;
END;
$$;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS varchar
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  receipt_num varchar;
BEGIN
  -- Generate receipt number with format: REC-YYYYMMDD-XXXX
  receipt_num := 'REC-' || to_char(now(), 'YYYYMMDD') || '-' || 
                 LPAD(nextval('receipt_sequence')::text, 4, '0');
  RETURN receipt_num;
END;
$$;

-- Create sequence for receipt numbers
CREATE SEQUENCE IF NOT EXISTS receipt_sequence START 1;

-- Function to create a complete sale with items
CREATE OR REPLACE FUNCTION create_sale_with_items(
  p_customer_name varchar,
  p_total decimal(10,2),
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sale_id uuid;
  receipt_number varchar;
  item_record jsonb;
BEGIN
  -- Generate receipt number
  receipt_number := generate_receipt_number();
  
  -- Create the sale
  INSERT INTO sales (receipt_number, customer_name, total, sold_by, sold_at)
  VALUES (receipt_number, p_customer_name, p_total, auth.uid(), now())
  RETURNING id INTO sale_id;
  
  -- Insert sale items
  FOR item_record IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO sale_items (sale_id, item_id, quantity, unit_price, subtotal, item_type)
    VALUES (
      sale_id,
      (item_record->>'item_id')::uuid,
      (item_record->>'quantity')::decimal(10,2),
      (item_record->>'unit_price')::decimal(10,2),
      (item_record->>'subtotal')::decimal(10,2),
      COALESCE(item_record->>'item_type', 'standard')
    );
    
    -- Update inventory quantity
    PERFORM update_inventory_quantity(
      (item_record->>'item_id')::uuid,
      -((item_record->>'quantity')::decimal(10,2))
    );
  END LOOP;
  
  -- Log the sale creation
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'create_sale',
    'sales',
    sale_id,
    jsonb_build_object('customer_name', p_customer_name, 'total', p_total, 'items_count', jsonb_array_length(p_items))
  );
  
  RETURN sale_id;
END;
$$;

-- 4. Create indexes for performance
-- ============================================

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_measure_type ON inventory_items(measure_type);
CREATE INDEX IF NOT EXISTS idx_inventory_brand ON inventory_items(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_measure_type_length ON inventory_items(measure_type, length);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_sold_by ON sales(sold_by);
CREATE INDEX IF NOT EXISTS idx_sales_customer_name ON sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales(sold_at);
CREATE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON sale_items(item_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 5. Setup Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Inventory policies
CREATE POLICY "Anyone can view inventory" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage inventory" ON inventory_items FOR ALL USING (auth.role() = 'authenticated');

-- Sales policies
CREATE POLICY "Users can view all sales" ON sales FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create sales" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own sales" ON sales FOR UPDATE USING (sold_by = auth.uid());

-- Sale items policies
CREATE POLICY "Users can view sale items" ON sale_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create sale items" ON sale_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Categories policies
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');

-- Audit logs policies
CREATE POLICY "Users can view audit logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "System can create audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- 6. Setup Storage for product images
-- ============================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Anyone can view product images" ON storage.objects 
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update product images" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete product images" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

-- 7. Create useful views
-- ============================================

-- View for sales with customer and seller info
CREATE OR REPLACE VIEW sales_with_details AS
SELECT 
  s.*,
  u.name as seller_name,
  u.email as seller_email
FROM sales s
LEFT JOIN users u ON s.sold_by = u.id;

-- View for sale items with product details
CREATE OR REPLACE VIEW sale_items_with_details AS
SELECT 
  si.*,
  ii.name as item_name,
  ii.brand,
  ii.model,
  ii.category,
  ii.measure_type
FROM sale_items si
LEFT JOIN inventory_items ii ON si.item_id = ii.id;

-- View for inventory with category details
CREATE OR REPLACE VIEW inventory_with_category_details AS
SELECT 
  ii.*,
  c.name as category_name,
  c.description as category_description
FROM inventory_items ii
LEFT JOIN categories c ON ii.category = c.name;

-- 8. Insert sample categories
-- ============================================

INSERT INTO categories (name, description) VALUES
('Solar Panels', 'Photovoltaic panels for solar energy generation'),
('Batteries', 'Energy storage solutions for solar systems'),
('Inverters', 'Power conversion equipment'),
('Wire', 'Electrical wiring and cables'),
('Lighting', 'Solar-powered lighting solutions'),
('Mounting', 'Solar panel mounting and installation hardware')
ON CONFLICT (name) DO NOTHING;

-- 9. Create triggers for automatic timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant necessary permissions
-- ============================================

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE receipt_sequence TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION update_inventory_quantity(uuid, decimal) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_selling_items(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_receipt_number() TO authenticated;
GRANT EXECUTE ON FUNCTION create_sale_with_items(varchar, decimal, jsonb) TO authenticated;

-- Grant access to views
GRANT SELECT ON sales_with_details TO authenticated;
GRANT SELECT ON sale_items_with_details TO authenticated;
GRANT SELECT ON inventory_with_category_details TO authenticated;


