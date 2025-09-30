-- Create credit_sales table
CREATE TABLE credit_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  receipt_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  remaining_amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partially_paid', 'paid')),
  sold_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sold_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE credit_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON credit_sales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON credit_sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON credit_sales
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create credit_sale_items table to store items sold on credit
CREATE TABLE credit_sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  credit_sale_id UUID REFERENCES credit_sales(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies for credit_sale_items
ALTER TABLE credit_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON credit_sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON credit_sale_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updating timestamps
CREATE TRIGGER update_credit_sales_updated_at
  BEFORE UPDATE ON credit_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_sale_items_updated_at
  BEFORE UPDATE ON credit_sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();