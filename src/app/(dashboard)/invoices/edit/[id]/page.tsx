'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Trash2, Save, ArrowLeft, ShoppingCart } from 'lucide-react';
import { localDb } from '@/lib/supabase';
import { numberToWords } from '@/utils/numberToWords';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;
  
  // Database States
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [businessSettings, setBusinessSettings] = useState<any>(null);

  // Form States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');
  const [trackingNo, setTrackingNo] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'Draft' | 'Confirmed'>('Draft');
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
  const [originalInvoice, setOriginalInvoice] = useState<any>(null);

  useEffect(() => {
    // Load setup data
    const savedCusts = localDb.getAll('customers');
    setCustomers(savedCusts);

    const savedProds = localDb.getAll('products');
    setProducts(savedProds);

    const savedSettings = localDb.getAll('business_settings')[0] || {
      name: "Hetvi's Creation",
      cgst: 9,
      sgst: 9,
      igst: 18
    };
    setBusinessSettings(savedSettings);

    // Load original invoice
    const inv = localDb.getById('invoices', invoiceId);
    if (!inv) {
      router.push('/invoices');
      return;
    }
    setOriginalInvoice(inv);

    // Populate form states
    setSelectedCustomerId(inv.customer_id);
    setInvoiceNo(inv.invoice_no);
    setInvoiceDate(inv.invoice_date);
    setDueDate(inv.due_date || '');
    setOrderNo(inv.order_no || '');
    setShippingMethod(inv.shipping_method || '');
    setTrackingNo(inv.tracking_no || '');
    setInvoiceStatus(inv.invoice_status === 'Confirmed' ? 'Confirmed' : 'Draft');
    setItems(inv.items || []);
    setOverallDiscount(inv.discount_amount - (inv.items?.reduce((sum: number, i: any) => sum + Number(i.discount), 0) || 0));
    setPackingCharges(Number(inv.packing_charges || 0));
    setShippingCharges(Number(inv.shipping_charges || 0));
    setAdvanceReceived(Number(inv.paid_amount || 0));
    setPaymentMode(inv.payment_mode || 'UPI');
    setPaymentStatus(inv.payment_status || 'Unpaid');
    
    setTaxType('NONE');
  }, [invoiceId, router]);

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

    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        updated[index].name = prod.name;
        updated[index].rate = prod.selling_price;
        updated[index].tax_percent = taxType === 'GST' ? (businessSettings?.cgst + businessSettings?.sgst || 18) : (taxType === 'IGST' ? (businessSettings?.igst || 18) : 0);
      }
    }

    const item = updated[index];
    const baseAmt = item.qty * item.rate - item.discount;
    const taxAmt = baseAmt * (item.tax_percent / 100);
    item.total = baseAmt + taxAmt;

    setItems(updated);
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalItemDiscount = items.reduce((sum, item) => sum + Number(item.discount), 0);
  
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

  const handleUpdateInvoice = () => {
    if (!selectedCustomerId) {
      alert('Please select a customer first');
      return;
    }

    // Rollback stock levels first if original invoice was Confirmed
    if (originalInvoice && originalInvoice.invoice_status === 'Confirmed') {
      const dbProds = localDb.getAll('products');
      originalInvoice.items.forEach((item: any) => {
        if (!item.product_id) return;
        const prod = dbProds.find(p => p.id === item.product_id);
        if (prod) {
          const rolledBackStock = prod.current_stock + item.qty;
          localDb.update('products', prod.id, { current_stock: rolledBackStock });
        }
      });
    }

    const customer = customers.find(c => c.id === selectedCustomerId);

    const invoiceData = {
      ...originalInvoice,
      customer_id: selectedCustomerId,
      customer_name: customer?.name || '',
      customer_phone: customer?.phone || '',
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      order_no: orderNo,
      invoice_status: invoiceStatus,
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
      items
    };

    // Save updated invoice
    localDb.update('invoices', invoiceId, invoiceData);

    // Apply new stock deductions if Status is Confirmed
    if (invoiceStatus === 'Confirmed') {
      const dbProds = localDb.getAll('products');
      items.forEach(item => {
        if (!item.product_id) return;
        const prod = dbProds.find(p => p.id === item.product_id);
        if (prod) {
          const newStock = prod.current_stock - item.qty;
          localDb.update('products', prod.id, { current_stock: newStock });

          localDb.insert('stock_movements', {
            product_id: prod.id,
            product_name: prod.name,
            movement_type: 'Sale',
            qty_in: 0,
            qty_out: item.qty,
            reference_no: invoiceNo,
            running_balance: newStock,
            notes: `Sold via Edited Invoice ${invoiceNo}`
          });
        }
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
      
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">Edit Invoice {invoiceNo}</h2>
          <p className="text-xs text-muted-foreground">Modify products, customer mappings, or totals and save changes.</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-secondary/20 text-accent text-xs rounded-lg text-center border border-accent/20 font-bold flex items-center justify-center gap-1.5 animate-pulse">
          Changes Saved Successfully! Redirecting...
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-6 bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Customer*</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs text-muted-foreground"
              >
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Invoice Number</label>
              <input
                type="text"
                disabled
                value={invoiceNo}
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
              />
            </div>

          </div>

          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-primary border-b border-border pb-1.5 flex items-center gap-1.5"><ShoppingCart className="w-4 h-4 text-accent" /> Product Items</h3>
            
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Product Name*</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs text-muted-foreground"
                  >
                    <option value="">-- Choose Product Name --</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.selling_price})</option>)}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Description</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs"
                  />
                </div>

                <div className="md:col-span-1.5">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs"
                  />
                </div>

                <div className="md:col-span-1.5">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    value={item.rate || ''}
                    onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs"
                  />
                </div>

                <div className="md:col-span-1 text-right">
                  <span className="text-[10px] text-muted-foreground block mb-2">Total</span>
                  <span className="font-semibold text-xs text-primary pr-2">₹{item.total?.toFixed(2)}</span>
                </div>

                <div className="md:col-span-1 text-center">
                  <button 
                    onClick={() => handleRemoveRow(index)}
                    className="p-1.5 hover:bg-red-50 text-destructive rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddRow}
              className="text-accent text-xs font-semibold hover:underline pt-2"
            >
              + Add Item Row
            </button>
          </div>
        </div>

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
                className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Packing Charges (₹)</label>
              <input
                type="number"
                value={packingCharges || ''}
                onChange={(e) => setPackingCharges(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Shipping Charges (₹)</label>
              <input
                type="number"
                value={shippingCharges || ''}
                onChange={(e) => setShippingCharges(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs"
              />
            </div>



            <div className="flex justify-between text-base font-bold border-t border-border pt-2 text-primary">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-[10px] italic">
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
            
            <div>
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Invoice Status</label>
              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-border rounded-lg bg-background text-xs text-muted-foreground"
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleUpdateInvoice}
              className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all"
            >
              Save Invoice Changes
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
