'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Truck, Phone, Mail, MapPin, Check, PlusCircle } from 'lucide-react';
import { localDb } from '@/lib/supabase';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gst_in: string;
  notes: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    gst_in: '',
    notes: ''
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = () => {
    const list = localDb.getAll('suppliers');
    if (list.length === 0) {
      const defaultSuppliers = [
        {
          id: 's1',
          name: 'Shreeji Crafts Raw Materials',
          contact_person: 'Ramesh Bhai',
          phone: '9898012345',
          email: 'shreeji.crafts@gmail.com',
          address: 'G-12, Kalupur Market',
          city: 'Ahmedabad',
          state: 'Gujarat',
          gst_in: '24BBBBB1111B1Z2',
          notes: 'Primary supplier for threads and beads.'
        }
      ];
      localDb.saveAll('suppliers', defaultSuppliers);
      setSuppliers(defaultSuppliers);
    } else {
      setSuppliers(list);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSupp = localDb.insert('suppliers', form);
    setSuppliers(prev => [newSupp, ...prev]);

    setForm({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: 'Ahmedabad',
      state: 'Gujarat',
      gst_in: '',
      notes: ''
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowAddModal(false);
    }, 1500);
  };

  const filteredSuppliers = suppliers.filter(s => {
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           s.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Suppliers</h2>
          <p className="text-xs text-muted-foreground font-sans">Manage raw material suppliers and contact details.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search suppliers by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <div className="w-8 h-8 rounded-full bg-secondary/35 text-accent flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-sm text-primary">{s.name}</h3>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground font-sans">
              <div><span className="font-bold text-primary">Contact:</span> {s.contact_person}</div>
              <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-accent" /> {s.phone}</div>
              {s.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-accent" /> {s.email}</div>}
              <div className="flex items-start gap-1.5"><MapPin className="w-3.5 h-3.5 text-accent mt-0.5" /> {s.address}, {s.city}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
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
                <h3 className="font-serif text-lg font-bold text-primary flex items-center gap-1.5"><PlusCircle className="w-5 h-5 text-accent" /> Add Supplier</h3>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground font-semibold">✕</button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-secondary/20 text-accent text-xs rounded-lg text-center border border-accent/20 font-bold mb-4 flex items-center justify-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" /> Supplier Saved Successfully!
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Supplier Company Name*</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Contact Person*</label>
                    <input
                      type="text"
                      required
                      value={form.contact_person}
                      onChange={(e) => setForm(prev => ({ ...prev, contact_person: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone Number*</label>
                    <input
                      type="text"
                      required
                      value={form.phone}
                      onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">GSTIN</label>
                    <input
                      type="text"
                      value={form.gst_in}
                      onChange={(e) => setForm(prev => ({ ...prev, gst_in: e.target.value }))}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Address</label>
                  <textarea
                    rows={2}
                    value={form.address}
                    onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
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
                    Save Supplier
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
