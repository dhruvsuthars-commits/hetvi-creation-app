-- Initial Supabase Schema for Hetvi's Creation

-- Drop existing tables/types if they exist (for clean setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS business_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS customer_type CASCADE;
DROP TYPE IF EXISTS order_source_type CASCADE;
DROP TYPE IF EXISTS invoice_status_type CASCADE;
DROP TYPE IF EXISTS payment_status_type CASCADE;
DROP TYPE IF EXISTS payment_mode_type CASCADE;
DROP TYPE IF EXISTS movement_type_enum CASCADE;
DROP TYPE IF EXISTS return_status_type CASCADE;

-- Custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'STAFF');
CREATE TYPE customer_type AS ENUM ('RETAIL', 'WHOLESALE', 'RESELLER', 'REGULAR', 'OTHER');
CREATE TYPE order_source_type AS ENUM ('Instagram', 'WhatsApp', 'Facebook', 'Website', 'Offline', 'Exhibition', 'Referral', 'Repeat Customer', 'Other');
CREATE TYPE invoice_status_type AS ENUM ('Draft', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned');
CREATE TYPE payment_status_type AS ENUM ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded');
CREATE TYPE payment_mode_type AS ENUM ('Cash', 'UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Bank Transfer', 'NEFT', 'RTGS', 'IMPS', 'Credit Card', 'Debit Card', 'Cheque', 'Cash on Delivery', 'Customer Credit', 'Other');
CREATE TYPE movement_type_enum AS ENUM ('Opening Stock', 'Purchase', 'Sale', 'Sales Return', 'Purchase Return', 'Damage', 'Lost', 'Sample', 'Manual Adjustment', 'Other');
CREATE TYPE return_status_type AS ENUM ('Pending', 'Approved', 'Cancelled');

-- 1. Profiles Table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role user_role DEFAULT 'STAFF' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Business Settings Table
CREATE TABLE business_settings (
  id INT PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'Hetvi''s Creation' NOT NULL,
  tagline TEXT DEFAULT 'Art & Craft Studio' NOT NULL,
  owner_name TEXT,
  mobile_no TEXT,
  whatsapp_no TEXT,
  email TEXT,
  instagram_handle TEXT DEFAULT '@hetvi.creation_',
  address TEXT,
  city TEXT,
  state TEXT,
  pin_code TEXT,
  gst_in TEXT,
  bank_name TEXT,
  account_no TEXT,
  ifsc TEXT,
  upi_id TEXT,
  qr_code_url TEXT,
  signature_url TEXT,
  stamp_url TEXT,
  invoice_prefix TEXT DEFAULT 'HC' NOT NULL,
  invoice_start_no INT DEFAULT 1 NOT NULL,
  terms TEXT,
  thank_you_msg TEXT DEFAULT 'Thank you for supporting handmade creations! ❤️' NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  currency_symbol TEXT DEFAULT '₹' NOT NULL,
  date_format TEXT DEFAULT 'DD/MM/YYYY' NOT NULL,
  logo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 3. Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  whatsapp TEXT,
  email TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  city TEXT,
  state TEXT,
  pin_code TEXT,
  gst_in TEXT,
  type customer_type DEFAULT 'RETAIL' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Product Categories Table
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  display_order INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Suppliers Table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  gst_in TEXT,
  opening_balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  current_balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  description TEXT,
  cost_price DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  selling_price DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  wholesale_price DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  opening_stock INT DEFAULT 0 NOT NULL,
  current_stock INT DEFAULT 0 NOT NULL,
  min_stock INT DEFAULT 5 NOT NULL,
  unit TEXT DEFAULT 'Piece' NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Active' NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  invoice_date DATE DEFAULT CURRENT_DATE NOT NULL,
  due_date DATE,
  order_no TEXT,
  order_source order_source_type DEFAULT 'Offline' NOT NULL,
  invoice_status invoice_status_type DEFAULT 'Draft' NOT NULL,
  payment_status payment_status_type DEFAULT 'Unpaid' NOT NULL,
  shipping_method TEXT,
  tracking_no TEXT,
  salesperson TEXT,
  subtotal DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
  discount_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  packing_charges DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  shipping_charges DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  cgst DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  sgst DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  igst DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  other_charges DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  round_off DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
  grand_total DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  balance_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE NOT NULL
);

-- 8. Invoice Items Table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  custom_name TEXT,
  sku TEXT,
  qty INT NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  tax_percent DECIMAL(5, 2) DEFAULT 0.00 NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  payment_mode payment_mode_type DEFAULT 'Cash' NOT NULL,
  transaction_no TEXT,
  bank_name TEXT,
  attachment_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Purchases Table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_no TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE NOT NULL,
  supplier_invoice_no TEXT,
  total_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  paid_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  balance_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  payment_mode payment_mode_type DEFAULT 'Cash' NOT NULL,
  attachment_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Confirmed' NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Purchase Items Table
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  qty INT NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  discount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Stock Movements Table
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  movement_type movement_type_enum NOT NULL,
  qty_in INT DEFAULT 0 NOT NULL,
  qty_out INT DEFAULT 0 NOT NULL,
  reference_no TEXT,
  running_balance INT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Returns Table
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_no TEXT UNIQUE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  refund_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
  refund_method payment_mode_type DEFAULT 'Cash' NOT NULL,
  status return_status_type DEFAULT 'Approved' NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Return Items Table
CREATE TABLE return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  qty INT NOT NULL,
  rate DECIMAL(12, 2) NOT NULL,
  reason TEXT,
  stock_restored BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id TEXT,
  record_no TEXT,
  previous_state JSONB,
  new_state JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Setup RLS Policies
CREATE POLICY "Allow public read of settings" ON business_settings FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access to settings" ON business_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write profiles" ON profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write customers" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write categories" ON product_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write suppliers" ON suppliers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write products" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write invoices" ON invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write items" ON invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write purchases" ON purchases FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write purchase_items" ON purchase_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write movements" ON stock_movements FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write returns" ON returns FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write return_items" ON return_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read/write logs" ON audit_logs FOR ALL TO authenticated USING (true);
