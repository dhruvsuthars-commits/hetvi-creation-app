'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Tag, AlertTriangle, Edit, Trash2, Check, X } from 'lucide-react';
import { localDb } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  cost_price: number;
  selling_price: number;
  wholesale_price: number;
  opening_stock: number;
  current_stock: number;
  min_stock: number;
  unit: string;
  status: string;
  created_at: string;
}

const RAKHI_PRODUCTS = [
  'Male Rakhi Single - Regular',
  'Male Rakhi Pack of three - Regular',
  'Male Rakhi - Premium',
  'Male Rakhi Single - Basic',
  'Male Rakhi Pack of three - Basic',
  'Female Rakhi Single - Regular',
  'Female Rakhi Pack of three - Regular',
  'Female Rakhi - Premium',
  'Female Rakhi Single - Basic',
  'Female Rakhi Pack of three - Basic',
  'Couple Rakhi - Regular',
  'Couple Rakhi - Premium',
  'Couple Rakhi - Basic',
  'Kids Single',
  'Kids Duo',
  'Others'
];

const DEFAULT_UNITS = [
  'Piece', 'Pair', 'Set', 'Pack', 'Box', 'Dozen', 'Kilogram', 'Gram', 'Meter', 'Other'
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: RAKHI_PRODUCTS[0],
    sku: '',
    description: '',
    cost_price: 0,
    selling_price: 0,
    wholesale_price: 0,
    opening_stock: 0,
    min_stock: 5,
    unit: 'Piece',
    status: 'Active'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    let prodList = localDb.getAll('products');
    if (prodList.length === 0) {
      const defaultProducts: Product[] = [
        {
          id: 'p1',
          name: 'Regular Male Rakhi - Single',
          sku: 'HC-RAK-001',
          description: 'Handmade premium couple Rakhi set.',
          cost_price: 60,
          selling_price: 140,
          wholesale_price: 100,
          opening_stock: 50,
          current_stock: 12,
          min_stock: 10,
          unit: 'Piece',
          status: 'Active',
          created_at: new Date().toISOString()
        },
        {
          id: 'p2',
          name: 'Regular Female Rakhi - Single',
          sku: 'HC-RAK-002',
          description: 'Special religious themed Rakhi pack.',
          cost_price: 80,
          selling_price: 150,
          wholesale_price: 110,
          opening_stock: 30,
          current_stock: 2,
          min_stock: 5,
          unit: 'Piece',
          status: 'Active',
          created_at: new Date().toISOString()
        }
      ];
      localDb.saveAll('products', defaultProducts);
      prodList = defaultProducts;
    }
    setProducts(prodList);
  };

  const handleOpenAddModal = () => {
    setForm({
      name: RAKHI_PRODUCTS[0],
      sku: '',
      description: '',
      cost_price: 0,
      selling_price: 0,
      wholesale_price: 0,
      opening_stock: 0,
      min_stock: 5,
      unit: 'Piece',
      status: 'Active'
    });
    setEditingProductId(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setForm({
      name: prod.name,
      sku: prod.sku,
      description: prod.description || '',
      cost_price: prod.cost_price,
      selling_price: prod.selling_price,
      wholesale_price: prod.wholesale_price || 0,
      opening_stock: prod.opening_stock || 0,
      min_stock: prod.min_stock || 5,
      unit: prod.unit || 'Piece',
      status: prod.status || 'Active'
    });
    setEditingProductId(prod.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProductId) {
      // Update
      const oldProd = products.find(p => p.id === editingProductId);
      const updatedForm = {
        ...form,
        current_stock: oldProd ? oldProd.current_stock + (form.opening_stock - (oldProd.opening_stock || 0)) : form.opening_stock
      };
      const updated = localDb.update('products', editingProductId, updatedForm);
      localDb.logAudit('update', 'products', editingProductId, `Updated product details for ${form.name}`);
    } else {
      // Insert
      const nextNo = products.length + 1;
      const finalForm = {
        ...form,
        sku: form.sku || `HC-RAK-${String(nextNo).padStart(3, '0')}`,
        current_stock: form.opening_stock
      };
      const newProd = localDb.insert('products', finalForm);
      
      if (newProd.opening_stock > 0) {
        localDb.insert('stock_movements', {
          product_id: newProd.id,
          product_name: newProd.name,
          movement_type: 'Opening Stock',
          qty_in: newProd.opening_stock,
          qty_out: 0,
          reference_no: newProd.sku,
          running_balance: newProd.opening_stock,
          notes: 'Initial product opening stock load'
        });
      }
      localDb.logAudit('insert', 'products', newProd.id, `Created product details for ${form.name}`);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowModal(false);
      loadProducts();
    }, 1500);
  };

  const handleDelete = (id: string, name: string) => {
    const confirm = window.confirm(`Move ${name} to Trash?`);
    if (!confirm) return;

    localDb.delete('products', id);
    loadProducts();
  };

  const filteredProducts = products.filter(p => {
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Products</h2>
          <p className="text-xs text-muted-foreground font-sans">View, add and edit the stock pricing, SKU and descriptions.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filter search bar */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Products Table list */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 font-semibold border-b border-border">
                <th className="p-3">SKU</th>
                <th className="p-3">Product Name</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">No products found. Click "Add Product" to get started.</td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-muted/5 transition-all">
                      <td className="p-3 font-semibold text-[#5A3828] uppercase">{p.sku}</td>
                      <td className="p-3">
                        <div className="font-semibold text-primary">{p.name}</div>
                        {p.description && <div className="text-[10px] text-muted-foreground mt-0.5">{p.description}</div>}
                      </td>
                      <td className="p-3 text-right">₹{Number(p.cost_price).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-[#5A3828]">₹{Number(p.selling_price).toFixed(2)}</td>
                      <td className="p-3">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 hover:bg-muted rounded text-primary transition-all"
                            title="Edit Product details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 hover:bg-red-50 rounded text-destructive transition-all"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center px-5 py-4 border-b border-border bg-muted/20">
                <h3 className="font-serif font-bold text-base text-primary">
                  {editingProductId ? 'Modify Product Details' : 'Add New Product'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-muted rounded-full">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-secondary/20 border-b border-accent/10 text-accent text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" /> Saved Successfully!
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Product Name*</label>
                    <select
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs text-muted-foreground focus:outline-none"
                    >
                      {RAKHI_PRODUCTS.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">SKU Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="Auto-generated if empty"
                      value={form.sku}
                      onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Unit Type</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs text-muted-foreground"
                    >
                      {DEFAULT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Cost Price (₹)*</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.cost_price || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, cost_price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Selling Price (₹)*</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.selling_price || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, selling_price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Wholesale Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.wholesale_price || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, wholesale_price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                    />
                  </div>



                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:brightness-105 shadow-sm"
                  >
                    Save Product
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
