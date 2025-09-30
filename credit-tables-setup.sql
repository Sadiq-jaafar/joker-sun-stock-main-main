-- Create credit_sales table
CREATE TABLE credit_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  receipt_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,  -- Added customer phone for contact
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

-- Create credit_sale_items table
CREATE TABLE credit_sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  credit_sale_id UUID REFERENCES credit_sales(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create credit_payments table to track payment history
CREATE TABLE credit_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  credit_sale_id UUID REFERENCES credit_sales(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  payment_method TEXT NOT NULL,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies for credit_sales
ALTER TABLE credit_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON credit_sales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON credit_sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON credit_sales
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Add RLS policies for credit_sale_items
ALTER TABLE credit_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON credit_sale_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON credit_sale_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add RLS policies for credit_payments
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON credit_payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON credit_payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create function to update credit_sales status based on payments
CREATE OR REPLACE FUNCTION update_credit_sale_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the amount_paid and remaining_amount
  WITH payment_totals AS (
    SELECT credit_sale_id, SUM(amount) as total_paid
    FROM credit_payments
    WHERE credit_sale_id = NEW.credit_sale_id
    GROUP BY credit_sale_id
  )
  UPDATE credit_sales cs
  SET 
    amount_paid = pt.total_paid,
    remaining_amount = cs.total - pt.total_paid,
    status = CASE 
      WHEN pt.total_paid >= cs.total THEN 'paid'
      WHEN pt.total_paid > 0 THEN 'partially_paid'
      ELSE 'pending'
    END,
    updated_at = CURRENT_TIMESTAMP
  FROM payment_totals pt
  WHERE cs.id = pt.credit_sale_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update credit_sales status when payment is added
CREATE TRIGGER update_credit_sale_status_on_payment
  AFTER INSERT OR UPDATE ON credit_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_sale_status();

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

CREATE TRIGGER update_credit_payments_updated_at
  BEFORE UPDATE ON credit_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();