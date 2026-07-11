'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft, Search, PlusCircle, ShoppingCart, X, Check } from 'lucide-react';
import { localDb } from '@/lib/supabase';
import { numberToWords } from '@/utils/numberToWords';

export default function CreateInvoicePage() {
  const router = useRouter();
  
  // Database States
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  // Inline Customer Modal States
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [custSuccess, setCustSuccess] = useState(false);
  const [custForm, setCustForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    billing_address: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pin_code: '380015',
    type: 'RETAIL',
    notes: ''
  });

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  
  // Items State
  const [items, setItems] = useState<any[]>([
    { product_id: '', name: '', qty: 1, rate: 0, discount: 0, tax_percent: 0, total: 0 }
  ]);

  // Overall charges
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [packingCharges, setPackingCharges] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [taxType, setTaxType] = useState<'GST' | 'IGST' | 'NONE'>('NONE');
  const [advanceReceived, setAdvanceReceived] = useState(0);
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Load setup database
    const savedCusts = localDb.getAll('customers');
    setCustomers(savedCusts);

    const savedProds = localDb.getAll('products');
    setProducts(savedProds);

    const savedSettings = localDb.getAll('business_settings')[0] || {
      name: "Hetvi's Creation",
      invoicePrefix: 'HC',
      invoiceStartNo: 1,
      cgst: 9,
      sgst: 9,
      igst: 18,
      thankYouMsg: 'Thank you for supporting handmade creations! ❤️'
    };
    setBusinessSettings(savedSettings);

    // Auto-generate invoice number
    const activeInvoices = localDb.getAll('invoices').filter((inv: any) => !inv.is_deleted);
    const nextNo = savedSettings.invoiceStartNo + activeInvoices.length;
    setInvoiceNo(`${savedSettings.invoicePrefix}-${String(nextNo).padStart(3, '0')}`);
  }, []);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name) {
      alert('Please fill in Customer Name');
      return;
    }
    const newCust = localDb.insert('customers', custForm);
    
    const updatedCusts = localDb.getAll('customers');
    setCustomers(updatedCusts);
    setSelectedCustomerId(newCust.id);
    
    setCustSuccess(true);
    setTimeout(() => {
      setCustSuccess(false);
      setShowAddCustomerModal(false);
    }, 1500);
  };

  const handleAddRow = () => {
    setItems([...items, { product_id: '', name: '', qty: 1, rate: 0, discount: 0, tax_percent: 0, total: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;

    // Auto fill details if product is selected
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].name = prod.name;
        updated[index].rate = prod.selling_price;
        // Default tax config based on business settings
        updated[index].tax_percent = taxType === 'GST' ? (businessSettings?.cgst + businessSettings?.sgst || 18) : (taxType === 'IGST' ? (businessSettings?.igst || 18) : 0);
      }
    }

    // Recalculate row total
    const item = updated[index];
    const baseAmt = item.qty * item.rate - item.discount;
    const taxAmt = baseAmt * (item.tax_percent / 100);
    item.total = baseAmt + taxAmt;

    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalItemDiscount = items.reduce((sum, item) => sum + Number(item.discount), 0);
  
  // Tax distribution
  const cgstRate = taxType === 'GST' ? (businessSettings?.cgst || 9) : 0;
  const sgstRate = taxType === 'GST' ? (businessSettings?.sgst || 9) : 0;
  const igstRate = taxType === 'IGST' ? (businessSettings?.igst || 18) : 0;

  const baseForTax = subtotal - totalItemDiscount - overallDiscount + packingCharges;
  const cgstAmount = baseForTax * (cgstRate / 100);
  const sgstAmount = baseForTax * (sgstRate / 100);
  const igstAmount = baseForTax * (igstRate / 100);
  const totalTax = cgstAmount + sgstAmount + igstAmount;

  const grandTotal = baseForTax + totalTax + shippingCharges;
  const balanceDue = grandTotal - advanceReceived;

  const handleSaveInvoice = (status: 'Draft' | 'Confirmed') => {
    if (!selectedCustomerId) {
      alert('Please select a customer first');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    
    const invoiceData = {
      invoice_no: invoiceNo,
      customer_id: selectedCustomerId,
      customer_name: customer?.name || '',
      customer_phone: customer?.phone || '',
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      order_no: orderNo,
      invoice_status: status,
      payment_status: paymentStatus,
      shipping_method: shippingMethod,
      tracking_no: trackingNo,
      subtotal,
      discount_amount: totalItemDiscount + overallDiscount,
      packing_charges: packingCharges,
      shipping_charges: shippingCharges,
      cgst: cgstAmount,
      sgst: sgstAmount,
      igst: igstAmount,
      grand_total: grandTotal,
      paid_amount: paymentStatus === 'Paid' ? grandTotal : (paymentStatus === 'Unpaid' ? 0 : advanceReceived),
      balance_amount: paymentStatus === 'Paid' ? 0 : (paymentStatus === 'Unpaid' ? grandTotal : balanceDue),
      payment_mode: paymentStatus === 'Unpaid' ? null : paymentMode,
      items,
      is_deleted: false,
    };

    // Save invoice
    const savedInv = localDb.insert('invoices', invoiceData);

    // Save stock movement details IF invoice is Confirmed
    if (status === 'Confirmed') {
      items.forEach(item => {
        if (!item.product_id) return;
        const prod = products.find(p => p.id === item.product_id);
        if (!prod) return;

        const newStock = prod.current_stock - item.qty;
        localDb.update('products', prod.id, { current_stock: newStock });

        // Save movement ledger entry
        localDb.insert('stock_movements', {
          product_id: prod.id,
          product_name: prod.name,
          movement_type: 'Sale',
          qty_in: 0,
          qty_out: item.qty,
          reference_no: invoiceNo,
          running_balance: newStock,
          notes: `Sold via Invoice ${invoiceNo}`
        });
      });
    }

    // Save payment record if paid
    const finalPaid = paymentStatus === 'Paid' ? grandTotal : (paymentStatus === 'Unpaid' ? 0 : advanceReceived);
    if (finalPaid > 0) {
      localDb.insert('payments', {
        receipt_no: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_id: selectedCustomerId,
        invoice_id: savedInv.id,
        amount: finalPaid,
        payment_mode: paymentMode,
        notes: `Payment for invoice ${invoiceNo}`
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      router.push('/invoices');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">Create Invoice</h2>
          <p className="text-xs text-muted-foreground">Log Rakhi or custom items sales and generate tax invoices.</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-secondary/20 text-accent text-xs rounded-lg text-center border border-accent/20 font-bold flex items-center justify-center gap-1.5 animate-pulse">
          Invoice Saved Successfully! Redirecting...
        </div>
      )}

      {/* Invoice Grid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Invoice details, customer, and product rows */}
        <div className="lg:col-span-2 space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
          
          {/* Customer and General Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Customer*</label>
              <div className="flex gap-2">
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent text-muted-foreground"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setCustForm({
                      name: '',
                      phone: '',
                      whatsapp: '',
                      email: '',
                      billing_address: '',
                      city: 'Ahmedabad',
                      state: 'Gujarat',
                      pin_code: '380015',
                      type: 'RETAIL',
                      notes: ''
                    });
                    setShowAddCustomerModal(true);
                  }}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-xs font-semibold text-accent hover:bg-muted transition-all whitespace-nowrap"
                  title="Add New Customer"
                >
                  + Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Invoice Number</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
              />
            </div>

          </div>

          {/* Product Items Table */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-primary border-b border-border pb-1.5 flex items-center gap-1.5"><ShoppingCart className="w-4 h-4 text-accent" /> Product Items</h3>
            
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end border-b border-dashed border-border/60 pb-3 md:pb-0 md:border-0">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Product Name*</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs focus:outline-none text-muted-foreground"
                  >
                    <option value="">-- Choose Product Name --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.selling_price})</option>)}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Item Description</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    placeholder="Custom design or details"
                    className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1.5">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1.5">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    value={item.rate || ''}
                    onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1 text-right">
                  <span className="text-[10px] text-muted-foreground block mb-2">Total</span>
                  <span className="font-semibold text-xs text-primary pr-2">₹{item.total.toFixed(2)}</span>
                </div>

                <div className="md:col-span-1 text-center">
                  <button 
                    onClick={() => handleRemoveRow(index)}
                    className="p-1.5 hover:bg-red-50 text-destructive hover:text-red-700 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1 text-accent text-xs font-semibold hover:underline pt-2"
            >
              <Plus className="w-4 h-4" /> Add Item Row
            </button>
          </div>
        </div>

        {/* Calculations / Summary Panel */}
        <div className="lg:col-span-1 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 h-fit">
          <h3 className="font-serif font-bold text-sm text-primary border-b border-border pb-1.5">Invoice Summary</h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-bold text-primary">₹{subtotal.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Overall Discount (₹)</label>
              <input
                type="number"
                value={overallDiscount || ''}
                onChange={(e) => setOverallDiscount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Packing Charges (₹)</label>
              <input
                type="number"
                value={packingCharges || ''}
                onChange={(e) => setPackingCharges(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Shipping Charges (₹)</label>
              <input
                type="number"
                value={shippingCharges || ''}
                onChange={(e) => setShippingCharges(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs focus:outline-none"
              />
            </div>



            <div className="flex justify-between text-base font-bold border-t border-border pt-2 text-primary">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[10px] font-medium leading-relaxed italic">
              <strong>Words:</strong> {numberToWords(grandTotal)}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => {
                  const status = e.target.value;
                  setPaymentStatus(status);
                  if (status === 'Paid') {
                    setAdvanceReceived(grandTotal);
                  } else if (status === 'Unpaid') {
                    setAdvanceReceived(0);
                  }
                }}
                className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs text-muted-foreground focus:outline-none"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
            </div>

            {paymentStatus !== 'Unpaid' && (
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs text-muted-foreground focus:outline-none"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            {paymentStatus === 'Partially Paid' && (
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  value={advanceReceived || ''}
                  onChange={(e) => setAdvanceReceived(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-between border-t border-border pt-2 text-xs font-bold text-destructive">
              <span>Balance Due</span>
              <span>₹{balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={() => handleSaveInvoice('Confirmed')}
              className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all"
            >
              Confirm & Decrease Stock
            </button>
            
            <button
              onClick={() => handleSaveInvoice('Draft')}
              className="w-full py-2.5 rounded-lg border border-border bg-card text-primary text-xs font-semibold hover:bg-muted/30 transition-all"
            >
              Save as Draft (No Stock Change)
            </button>
          </div>
        </div>

      </div>

      {/* Inline Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCustomerModal(false)}
              className="fixed inset-0 bg-black"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted/20">
                <h3 className="font-serif font-bold text-base text-primary">Add New Customer</h3>
                <button onClick={() => setShowAddCustomerModal(false)} className="p-1.5 hover:bg-muted rounded-full">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {custSuccess && (
                <div className="p-3 bg-secondary/20 border-b border-accent/10 text-accent text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" /> Saved & Selected Successfully!
                </div>
              )}

              <form onSubmit={handleSaveCustomer} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Customer Name*</label>
                  <input
                    type="text"
                    required
                    value={custForm.name}
                    onChange={(e) => setCustForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={custForm.phone}
                    onChange={(e) => setCustForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:brightness-105 shadow-sm"
                  >
                    Save Customer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
