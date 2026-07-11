'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, RefreshCw, PlusCircle, Check, Trash2 } from 'lucide-react';
import { localDb } from '@/lib/supabase';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    invoice_id: '',
    product_id: '',
    qty: 0,
    refund_amount: 0,
    reason: '',
    stock_restored: true
  });

  useEffect(() => {
    loadSetupData();
  }, []);

  const loadSetupData = () => {
    const invs = localDb.getAll('invoices').filter(i => !i.is_deleted);
    setInvoices(invs);

    const prods = localDb.getAll('products');
    setProducts(prods);

    const retList = localDb.getAll('returns');
    const hasSeeded = typeof window !== 'undefined' ? localStorage.getItem('returns_seeded') : 'true';
    if (retList.length === 0 && !hasSeeded) {
      // Seed default return
      const defaultRet = [
        {
          id: 'ret1',
          return_no: 'RET-001',
          invoice_no: 'HC-003',
          customer_name: 'Niyati Amin',
          product_name: 'Duo Rakhi Premium',
          qty: 1,
          refund_amount: 140,
          reason: 'Size did not fit well',
          created_at: new Date().toISOString()
        }
      ];
      localDb.saveAll('returns', defaultRet);
      if (typeof window !== 'undefined') {
        localStorage.setItem('returns_seeded', 'true');
      }
      setReturns(defaultRet);
    } else if (retList.length === 0) {
      setReturns([]);
    } else {
      const mapped = retList.map(r => {
        const inv = invs.find(i => i.id === r.invoice_id);
        const prod = prods.find(p => p.id === r.product_id);
        return {
          ...r,
          invoice_no: inv?.invoice_no || r.invoice_no || 'Unknown Invoice',
          customer_name: inv?.customer_name || r.customer_name || 'Generic Customer',
          product_name: prod?.name || r.product_name || 'Returned Items'
        };
      });
      setReturns(mapped);
    }
  };

  const handleInvoiceChange = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId);
    setForm(prev => ({ 
      ...prev, 
      invoice_id: invoiceId,
      product_id: inv?.items?.[0]?.product_id || '',
      qty: 1,
      refund_amount: inv?.items?.[0]?.rate || 0
    }));
  };

  const handleProductChange = (productId: string) => {
    const inv = invoices.find(i => i.id === form.invoice_id);
    const item = inv?.items?.find((it: any) => it.product_id === productId);
    setForm(prev => ({
      ...prev,
      product_id: productId,
      qty: 1,
      refund_amount: item ? Number(item.rate) : 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const inv = invoices.find(i => i.id === form.invoice_id);
    const product = products.find(p => p.id === form.product_id);
    const return_no = `RET-${String(101 + returns.length).padStart(3, '0')}`;

    const newReturn = {
      return_no,
      invoice_id: form.invoice_id,
      invoice_no: inv?.invoice_no || '',
      customer_name: inv?.customer_name || '',
      product_id: form.product_id,
      product_name: product?.name || '',
      qty: form.qty,
      refund_amount: form.refund_amount,
      reason: form.reason,
      stock_restored: form.stock_restored
    };

    localDb.insert('returns', newReturn);

    // Restore stock if checked
    if (form.stock_restored && product) {
      const updatedStock = product.current_stock + form.qty;
      localDb.update('products', product.id, { current_stock: updatedStock });

      localDb.insert('stock_movements', {
        product_id: product.id,
        product_name: product.name,
        movement_type: 'Sales Return',
        qty_in: form.qty,
        qty_out: 0,
        reference_no: return_no,
        running_balance: updatedStock,
        notes: `Returned from invoice ${inv?.invoice_no} (${form.reason})`
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowAddModal(false);
      loadSetupData();
      
      setForm({
        invoice_id: '',
        product_id: '',
        qty: 0,
        refund_amount: 0,
        reason: '',
        stock_restored: true
      });
    }, 1500);
  };

  const handleDeleteReturn = (id: string, returnNo: string) => {
    const confirm = window.confirm(`Are you sure you want to delete return record ${returnNo}?`);
    if (!confirm) return;
    localDb.delete('returns', id);
    loadSetupData();
  };

  const filteredReturns = returns.filter(r => {
    return r.return_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
           r.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.invoice_no.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Returns</h2>
          <p className="text-xs text-muted-foreground font-sans">Process customer item returns, record refunds, and restock items.</p>
        </div>

        <button
          onClick={() => {
            if (invoices.length === 0) {
              alert('Please create at least one invoice before recording returns.');
              return;
            }
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Process Return
        </button>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search returns by customer name, receipt ID, or return ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Listing */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 font-semibold border-b border-border">
                <th className="p-3">Return ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Invoice Ref</th>
                <th className="p-3">Product</th>
                <th className="p-3 text-center">Returned Qty</th>
                <th className="p-3 text-right">Refund Paid</th>
                <th className="p-3">Reason</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredReturns.map(r => (
                <tr key={r.id} className="hover:bg-muted/5 transition-all">
                  <td className="p-3 font-semibold text-primary">{r.return_no}</td>
                  <td className="p-3 font-medium">{r.customer_name}</td>
                  <td className="p-3 text-primary font-semibold">{r.invoice_no}</td>
                  <td className="p-3 font-semibold text-primary">{r.product_name}</td>
                  <td className="p-3 text-center font-bold text-stone-700">{r.qty}</td>
                  <td className="p-3 text-right font-bold text-red-600">₹{Number(r.refund_amount).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground italic">{r.reason}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteReturn(r.id, r.return_no)}
                      className="p-1.5 hover:bg-red-50 rounded text-destructive transition-all cursor-pointer"
                      title="Delete Return Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
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
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-1.5"><RefreshCw className="w-5 h-5 text-accent" /> Process Sales Return</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground font-semibold">✕</button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-secondary/20 text-accent text-xs rounded-lg text-center border border-accent/20 font-bold mb-4 flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" /> Return Processed & Stock Restored!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Invoice Reference*</label>
                  <select
                    required
                    value={form.invoice_id}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none text-muted-foreground"
                  >
                    <option value="">-- Choose Invoice --</option>
                    {invoices.map(i => <option key={i.id} value={i.id}>{i.invoice_no} ({i.customer_name})</option>)}
                  </select>
                </div>

                {form.invoice_id && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Product to Return*</label>
                      <select
                        required
                        value={form.product_id}
                        onChange={(e) => handleProductChange(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none text-muted-foreground"
                      >
                        {invoices
                          .find(i => i.id === form.invoice_id)
                          ?.items?.map((item: any) => (
                            <option key={item.product_id} value={item.product_id}>
                              {item.name} (Sold Qty: {item.qty} | Rate: ₹{item.rate})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Return Quantity*</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={invoices.find(i => i.id === form.invoice_id)?.items?.find((item: any) => item.product_id === form.product_id)?.qty || 1}
                          value={form.qty || ''}
                          onChange={(e) => {
                            const rate = invoices.find(i => i.id === form.invoice_id)?.items?.find((item: any) => item.product_id === form.product_id)?.rate || 0;
                            setForm(prev => ({ 
                              ...prev, 
                              qty: Number(e.target.value),
                              refund_amount: Number(e.target.value) * Number(rate)
                            }));
                          }}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Refund Paid (₹)</label>
                        <input
                          type="number"
                          required
                          value={form.refund_amount || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, refund_amount: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Reason for Return*</label>
                  <input
                    type="text"
                    required
                    value={form.reason}
                    onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="E.g. Damaged thread or wrong color sent"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 py-1 select-none">
                  <input
                    type="checkbox"
                    id="stock_restored"
                    checked={form.stock_restored}
                    onChange={(e) => setForm(prev => ({ ...prev, stock_restored: e.target.checked }))}
                    className="h-4.5 w-4.5 rounded border-border text-accent focus:ring-accent bg-background"
                  />
                  <label htmlFor="stock_restored" className="text-xs text-muted-foreground">Restore returned quantity back to product stock</label>
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
                    Process Return
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
