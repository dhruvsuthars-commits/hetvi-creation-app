'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Phone, Mail, MapPin, User, ChevronRight, FileText, CreditCard, ShieldAlert, Check, Trash2 } from 'lucide-react';
import { localDb } from '@/lib/supabase';

interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  billing_address: string;
  city: string;
  state: string;
  pin_code: string;
  type: 'RETAIL' | 'WHOLESALE' | 'RESELLER' | 'REGULAR' | 'OTHER';
  notes: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setForm({
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
      billing_address: '',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pin_code: '380015',
      type: 'RETAIL',
      notes: '',
    });
    setEditingCustomerId(null);
    setDuplicateWarning(false);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (cust: Customer) => {
    setForm({
      name: cust.name,
      phone: cust.phone,
      whatsapp: cust.whatsapp,
      email: cust.email,
      billing_address: cust.billing_address,
      city: cust.city,
      state: cust.state,
      pin_code: cust.pin_code,
      type: cust.type,
      notes: cust.notes,
    });
    setEditingCustomerId(cust.id);
    setDuplicateWarning(false);
    setShowAddModal(true);
  };
  
  
  // Form states
  const [form, setForm] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    billing_address: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pin_code: '380015',
    type: 'RETAIL' as Customer['type'],
    notes: '',
  });

  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    const list = localDb.getAll('customers');
    if (list.length === 0) {
      // Seed default customers for demo testing
      const defaultCustomers: Customer[] = [
        {
          id: 'c1',
          name: 'Niyati Amin',
          phone: '9825012345',
          whatsapp: '9825012345',
          email: 'niyati.amin@gmail.com',
          billing_address: 'A-402, Shaligram Apartments, Vastrapur',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pin_code: '380015',
          type: 'REGULAR',
          notes: 'Likes premium handmade couple Rakhis.',
          created_at: new Date().toISOString(),
        },
        {
          id: 'c2',
          name: 'Rohan Sharma',
          phone: '9988776655',
          whatsapp: '9988776655',
          email: 'rohan.sharma@yahoo.com',
          billing_address: '54, Rosewood Bunglows, Bodakdev',
          city: 'Ahmedabad',
          state: 'Gujarat',
          pin_code: '380054',
          type: 'RETAIL',
          notes: 'Always requests bubble wrap packaging.',
          created_at: new Date().toISOString(),
        },
      ];
      localDb.saveAll('customers', defaultCustomers);
      setCustomers(defaultCustomers);
    } else {
      setCustomers(list);
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCustomerId) {
      const updated = localDb.update('customers', editingCustomerId, form);
      setCustomers(prev => prev.map(c => c.id === editingCustomerId ? updated : c));
      setSelectedCustomer(updated);
    } else {
      const newCust = localDb.insert('customers', form);
      setCustomers(prev => [newCust, ...prev]);
    }
    
    // Reset form
    setForm({
      name: '',
      phone: '',
      whatsapp: '',
      email: '',
      billing_address: '',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pin_code: '380015',
      type: 'RETAIL',
      notes: '',
    });
    setDuplicateWarning(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowAddModal(false);
      setEditingCustomerId(null);
    }, 1500);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    const confirm = window.confirm(`Move ${name} to Trash?`);
    if (!confirm) return;
    localDb.delete('customers', id);
    const list = localDb.getAll('customers');
    setCustomers(list);
    setSelectedCustomer(list[0] || null);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.phone && c.phone.includes(searchTerm));
    
    const matchesType = selectedType === 'ALL' || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Calculate invoice statistics for selected customer
  const getCustomerStats = (customerId: string) => {
    const invoices = localDb.getAll('invoices').filter(inv => inv.customer_id === customerId && !inv.is_deleted);
    const payments = localDb.getAll('payments').filter(p => p.customer_id === customerId);
    
    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
    const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPending = invoices.reduce((sum, inv) => sum + Number(inv.balance_amount), 0);

    return {
      invoiceCount: invoices.length,
      totalSales,
      totalReceived,
      totalPending,
      invoices,
      payments
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Customers</h2>
          <p className="text-xs text-muted-foreground font-sans">Manage customer details, ledgers, and contact details.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search by name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent text-muted-foreground"
          >
            <option value="ALL">All Customer Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="RESELLER">Reseller</option>
            <option value="REGULAR">Regular Customer</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Main Customers List & Details Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Customers list */}
        <div className="lg:col-span-2 space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-card border border-border p-8 rounded-xl text-center text-muted-foreground text-xs font-sans">
              No customers found. Click "Add Customer" to get started.
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const stats = getCustomerStats(customer.id);
              const isSelected = selectedCustomer?.id === customer.id;

              return (
                <motion.div
                  layout
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer bg-card flex items-center justify-between shadow-sm hover:translate-x-1 ${
                    isSelected ? 'border-accent ring-2 ring-accent/15' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/35 text-accent flex items-center justify-center font-bold">
                      {customer.name[0]}
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-primary">{customer.name}</h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                        {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-accent" /> {customer.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent uppercase">
                      {customer.type}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Right Side: Customer Details Panel */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              (() => {
                const stats = getCustomerStats(selectedCustomer.id);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5 sticky top-6"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary/35 text-accent flex items-center justify-center font-serif text-lg font-bold">
                          {selectedCustomer.name[0]}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-base text-primary">{selectedCustomer.name}</h3>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                            {selectedCustomer.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(selectedCustomer)}
                          className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-[10px] font-semibold text-primary transition-all shadow-sm"
                        >
                          Edit Profile
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(selectedCustomer.id, selectedCustomer.name)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-destructive transition-all shadow-sm"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Sales Count</div>
                        <div className="font-serif font-bold text-lg text-primary mt-0.5">{stats.invoiceCount}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">Pending</div>
                        <div className="font-serif font-bold text-lg text-destructive mt-0.5">₹{stats.totalPending.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-2.5 text-xs text-muted-foreground font-sans">
                      {selectedCustomer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-accent" />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Invoice history mini-list */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5"><FileText className="w-4 h-4 text-accent" /> Invoice History</h4>
                      {stats.invoices.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground py-2">No invoices recorded.</div>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {stats.invoices.map(inv => (
                            <div key={inv.id} className="flex justify-between items-center p-2 rounded-lg bg-background border border-border text-[11px]">
                              <div>
                                <span className="font-semibold text-primary">{inv.invoice_no}</span>
                                <span className="text-muted-foreground block text-[9px]">{inv.invoice_date}</span>
                              </div>
                              <span className="font-bold text-primary">₹{Number(inv.grand_total).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()
            ) : (
              <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground text-xs font-sans sticky top-6">
                Select a customer from the list to view their ledger, profile stats, and invoice history.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Add Customer Modal */}
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
              className="relative bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-1.5"><User className="w-5 h-5 text-accent" /> Add New Customer</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground font-semibold">✕</button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-secondary/20 text-accent text-xs rounded-lg text-center border border-accent/20 font-bold mb-4 flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" /> Customer Saved Successfully!
                </div>
              )}

              {duplicateWarning && (
                <div className="p-3 bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs rounded-lg mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <span>Warning: A customer with this mobile number already exists in records.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Customer Full Name*</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter customer name"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone Number (Optional)</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Customer Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent text-muted-foreground"
                    >
                      <option value="RETAIL">Retail</option>
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="RESELLER">Reseller</option>
                      <option value="REGULAR">Regular Customer</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
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
