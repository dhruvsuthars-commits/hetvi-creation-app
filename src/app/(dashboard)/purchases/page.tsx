'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, FileSpreadsheet, PlusCircle, Check, HelpCircle } from 'lucide-react';
import { localDb } from '@/lib/supabase';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier_invoice_no: '',
    product_id: '',
    qty: 0,
    rate: 0,
    notes: ''
  });

  useEffect(() => {
    loadSetupData();
  }, []);

  const loadSetupData = () => {
    const supps = localDb.getAll('suppliers');
    setSuppliers(supps);

    const prods = localDb.getAll('products');
    setProducts(prods);

    const purchList = localDb.getAll('purchases');
    if (purchList.length === 0) {
      // Seed default purchase
      const defaultPurch = [
        {
          id: 'pur1',
          purchase_no: 'PUR-001',
          supplier_id: 's1',
          supplier_name: 'Shreeji Crafts Raw Materials',
          purchase_date: '2026-07-11',
          supplier_invoice_no: 'SHR-920491',
          product_name: 'Duo Rakhi Premium',
          qty: 50,
          rate: 60,
          total_amount: 3000,
          notes: 'Opening stock purchase threads and beads',
          created_at: new Date().toISOString()
        }
      ];
      localDb.saveAll('purchases', defaultPurch);
      setPurchases(defaultPurch);
    } else {
      const mapped = purchList.map(p => {
        const sup = supps.find(s => s.id === p.supplier_id);
        const prod = prods.find(pr => pr.id === p.product_id);
        return {
          ...p,
          supplier_name: sup?.name || p.supplier_name || 'Generic Supplier',
          product_name: prod?.name || p.product_name || 'Raw Materials'
        };
      });
      setPurchases(mapped);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const supplier = suppliers.find(s => s.id === form.supplier_id);
    const product = products.find(p => p.id === form.product_id);

    const total_amount = form.qty * form.rate;
    const purchase_no = `PUR-${String(101 + purchases.length).padStart(3, '0')}`;

    const newPurch = {
      purchase_no,
      supplier_id: form.supplier_id,
      supplier_name: supplier?.name || '',
      purchase_date: form.purchase_date,
      supplier_invoice_no: form.supplier_invoice_no,
      product_id: form.product_id,
      product_name: product?.name || '',
      qty: form.qty,
      rate: form.rate,
      total_amount,
      notes: form.notes
    };

    localDb.insert('purchases', newPurch);

    // Automatically increase product stock on purchase
    if (product) {
      const updatedStock = product.current_stock + form.qty;
      localDb.update('products', product.id, { current_stock: updatedStock });

      // Add stock movement ledger log
      localDb.insert('stock_movements', {
        product_id: product.id,
        product_name: product.name,
        movement_type: 'Purchase',
        qty_in: form.qty,
        qty_out: 0,
        reference_no: purchase_no,
        running_balance: updatedStock,
        notes: `Purchased from ${supplier?.name}`
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowAddModal(false);
      loadSetupData();
      
      setForm({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        supplier_invoice_no: '',
        product_id: '',
        qty: 0,
        rate: 0,
        notes: ''
      });
    }, 1500);
  };

  const filteredPurchases = purchases.filter(p => {
    return p.purchase_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Purchases</h2>
          <p className="text-xs text-muted-foreground font-sans">Track supplier invoices and automatically update product stocks.</p>
        </div>

        <button
          onClick={() => {
            if (suppliers.length === 0 || products.length === 0) {
              alert('Please add at least one supplier and one product before logging purchases.');
              return;
            }
            setForm(prev => ({ 
              ...prev, 
              supplier_id: suppliers[0].id,
              product_id: products[0].id
            }));
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Log Purchase
        </button>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search purchases by company, product or receipt ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Purchases listing */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 font-semibold border-b border-border">
                <th className="p-3">Purchase ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Product</th>
                <th className="p-3 text-center">Qty Purchased</th>
                <th className="p-3 text-right">Cost Rate</th>
                <th className="p-3 text-right">Total Outlay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPurchases.map(p => (
                <tr key={p.id} className="hover:bg-muted/5 transition-all">
                  <td className="p-3 font-semibold text-primary">{p.purchase_no}</td>
                  <td className="p-3 text-muted-foreground">{new Date(p.purchase_date).toLocaleDateString('en-GB')}</td>
                  <td className="p-3 font-medium">{p.supplier_name}</td>
                  <td className="p-3 text-primary font-semibold">{p.product_name}</td>
                  <td className="p-3 text-center font-bold text-stone-700">{p.qty}</td>
                  <td className="p-3 text-right font-medium">₹{Number(p.rate).toFixed(2)}</td>
                  <td className="p-3 text-right font-bold text-primary">₹{Number(p.total_amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Purchase Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-1.5"><PlusCircle className="w-5 h-5 text-accent" /> Log Supplier Purchase</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground font-semibold">✕</button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-secondary/20 text-accent text-xs rounded-lg text-center border border-accent/20 font-bold mb-4 flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" /> Purchase Logged & Stock Added!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Supplier*</label>
                  <select
                    value={form.supplier_id}
                    onChange={(e) => setForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                  >
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Purchase Date</label>
                    <input
                      type="date"
                      value={form.purchase_date}
                      onChange={(e) => setForm(prev => ({ ...prev, purchase_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Supplier Invoice Ref</label>
                    <input
                      type="text"
                      value={form.supplier_invoice_no}
                      onChange={(e) => setForm(prev => ({ ...prev, supplier_invoice_no: e.target.value }))}
                      placeholder="SHR-10293"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Product to Stock Up*</label>
                  <select
                    value={form.product_id}
                    onChange={(e) => setForm(prev => ({ ...prev, product_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none text-muted-foreground"
                  >
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Purchase Qty*</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={form.qty || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, qty: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Cost Rate (₹)*</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={form.rate || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, rate: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="E.g. Threads and beads restocked"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:brightness-105 text-xs font-semibold shadow-sm"
                  >
                    Log Purchase
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
