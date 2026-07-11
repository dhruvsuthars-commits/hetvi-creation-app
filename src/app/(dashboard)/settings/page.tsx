'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Building, CreditCard, Receipt, Users, ShieldAlert, Check, Database } from 'lucide-react';
import { localDb } from '@/lib/supabase';
import { getStaffPermissions, saveStaffPermissions, UserPermission } from '@/lib/permissions';

const ALL_PERMISSION_KEYS: { key: UserPermission; label: string }[] = [
  { key: 'create_invoice', label: 'Create Invoice' },
  { key: 'edit_invoice', label: 'Edit Invoice' },
  { key: 'view_invoice', label: 'View Invoice' },
  { key: 'download_invoice', label: 'Download Invoice' },
  { key: 'record_payment', label: 'Record Payment' },
  { key: 'manage_products', label: 'Manage Products' },
  { key: 'adjust_stock', label: 'Adjust Stock' },
  { key: 'view_reports', label: 'View Reports' },
  { key: 'manage_customers', label: 'Manage Customers' },
  { key: 'delete_records', label: 'Delete Records' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'business' | 'bank' | 'invoice' | 'staff' | 'backup'>('business');
  const [userRole, setUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Settings states
  const [settings, setSettings] = useState({
    name: "Hetvi's Creation",
    tagline: 'Art & Craft Studio',
    instagram: '@hetvi.creation_',
    owner: 'Hetvi Suthar',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'info@hetvicreation.com',
    address: '102, Shrinathji Complex, Satellite',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pin: '380015',
    gstin: '24AAAAA1111A1Z1',
    // Bank
    bankName: 'State Bank of India',
    accountNo: '30491029304',
    ifsc: 'SBIN0003045',
    upiId: 'hetvicreation@oksbi',
    // Invoice configs
    invoicePrefix: 'HC',
    invoiceStartNo: 1,
    cgst: 9,
    sgst: 9,
    igst: 18,
    thankYouMsg: 'Thank you for supporting handmade creations! ❤️',
  });

  // Staff permissions state
  const [staffPerms, setStaffPerms] = useState<UserPermission[]>([]);

  useEffect(() => {
    const user = localDb.getCurrentUser() as any;
    if (user) {
      setUserRole(user.role || 'STAFF');
    }
    
    // Load saved settings
    const saved = localDb.getAll('business_settings')[0];
    if (saved) {
      setSettings(prev => ({ ...prev, ...saved }));
    } else {
      localDb.saveAll('business_settings', [settings]);
    }

    // Load staff perms
    setStaffPerms(getStaffPermissions());
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localDb.saveAll('business_settings', [settings]);
    localDb.logAudit('update', 'settings', '1', 'Updated business settings');
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLoadDemoData = () => {
    const confirm = window.confirm('This will reset transaction history and load demo records. Proceed?');
    if (!confirm) return;
    
    const keysToClear = [
      'hetvi_db_invoices',
      'hetvi_db_payments',
      'hetvi_db_customers',
      'hetvi_db_suppliers',
      'hetvi_db_purchases',
      'hetvi_db_returns',
      'hetvi_db_audit_logs',
      'hetvi_db_trash',
      'hetvi_db_stock_movements',
      'hetvi_db_notifications'
    ];
    keysToClear.forEach(key => localStorage.removeItem(key));

    // Seed default product stocks for demo testing
    const prods = localDb.getAll('products');
    const seededProducts = prods.map((p, idx) => ({
      ...p,
      opening_stock: idx === 0 ? 50 : 30,
      current_stock: idx === 0 ? 12 : 2
    }));
    localDb.saveAll('products', seededProducts);

    window.location.reload();
  };

  const handleClearAll = () => {
    const confirm = window.confirm('Are you sure you want to clear all invoices, payments, returns, suppliers, purchases, and customers? Products and business settings will not be modified.');
    if (!confirm) return;
    
    const keysToClear = [
      'hetvi_db_invoices',
      'hetvi_db_payments',
      'hetvi_db_customers',
      'hetvi_db_suppliers',
      'hetvi_db_purchases',
      'hetvi_db_returns',
      'hetvi_db_audit_logs',
      'hetvi_db_trash',
      'hetvi_db_stock_movements',
      'hetvi_db_notifications'
    ];
    keysToClear.forEach(key => localStorage.removeItem(key));

    window.location.reload();
  };

  const handlePermToggle = (perm: UserPermission) => {
    let updated: UserPermission[];
    if (staffPerms.includes(perm)) {
      updated = staffPerms.filter(p => p !== perm);
    } else {
      updated = [...staffPerms, perm];
    }
    setStaffPerms(updated);
    saveStaffPermissions(updated);
  };

  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Settings</h2>
          <p className="text-xs text-muted-foreground font-sans">Manage business details, invoice config, and staff authorization.</p>
        </div>

        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/20 text-accent text-xs font-semibold border border-accent/20"
          >
            <Check className="w-4 h-4" /> Settings Saved Successfully!
          </motion.div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Navigation Tabs */}
        <div className="w-full md:w-60 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'business' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Building className="w-4 h-4" /> Business Profile
          </button>
          
          <button
            onClick={() => setActiveTab('bank')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'bank' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Bank & Signature
          </button>
          
          <button
            onClick={() => setActiveTab('invoice')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'invoice' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Receipt className="w-4 h-4" /> Invoice Customization
          </button>
          
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'staff' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" /> Staff Authorization
          </button>
          
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'backup' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Database className="w-4 h-4" /> Backup & Demo Data
          </button>
        </div>

        {/* Content Form Panel */}
        <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-6">
            
            {activeTab === 'business' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2 border-b border-border pb-2 mb-2">
                  <h3 className="font-serif text-lg font-bold text-primary">Business Profile</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Business Name</label>
                  <input
                    type="text"
                    name="name"
                    value={settings.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Tagline</label>
                  <input
                    type="text"
                    name="tagline"
                    value={settings.tagline}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Owner Name</label>
                  <input
                    type="text"
                    name="owner"
                    value={settings.owner}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Instagram Handle</label>
                  <input
                    type="text"
                    name="instagram"
                    value={settings.instagram}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Contact Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={settings.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={settings.whatsapp}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={settings.gstin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Billing Address</label>
                  <textarea
                    rows={2}
                    name="address"
                    value={settings.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={settings.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Pin Code</label>
                  <input
                    type="text"
                    name="pin"
                    value={settings.pin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2 border-b border-border pb-2 mb-2">
                  <h3 className="font-serif text-lg font-bold text-primary">Bank Account & Signature Details</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Bank Name</label>
                  <input
                    type="text"
                    name="bankName"
                    value={settings.bankName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Account Number</label>
                  <input
                    type="text"
                    name="accountNo"
                    value={settings.accountNo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc"
                    value={settings.ifsc}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">UPI ID (e.g. upi@bank)</label>
                  <input
                    type="text"
                    name="upiId"
                    value={settings.upiId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2 border-b border-border pb-2 mb-2">
                  <h3 className="font-serif text-lg font-bold text-primary">Invoice Numbering & Defaults</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    name="invoicePrefix"
                    value={settings.invoicePrefix}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Invoice Starting Number</label>
                  <input
                    type="number"
                    name="invoiceStartNo"
                    value={settings.invoiceStartNo}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">CGST (%)</label>
                  <input
                    type="number"
                    name="cgst"
                    value={settings.cgst}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">SGST (%)</label>
                  <input
                    type="number"
                    name="sgst"
                    value={settings.sgst}
                    onChange={handleNumberChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Thank You Message</label>
                  <input
                    type="text"
                    name="thankYouMsg"
                    value={settings.thankYouMsg}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="font-serif text-lg font-bold text-primary">Staff Access Controls</h3>
                </div>

                {!isAdmin ? (
                  <div className="flex gap-2.5 p-3 rounded-lg bg-yellow-50 border border-yellow-100 text-yellow-800 text-xs font-medium items-center">
                    <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                    <span>Access Denied. You must be an administrator to configure staff permissions.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Select the permissions permitted for staff logins:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {ALL_PERMISSION_KEYS.map(({ key, label }) => {
                        const isGranted = staffPerms.includes(key);
                        return (
                          <label 
                            key={key} 
                            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background cursor-pointer hover:bg-muted/30 transition-all text-xs font-semibold select-none"
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => handlePermToggle(key)}
                              className="h-4.5 w-4.5 rounded border-border text-accent focus:ring-accent"
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'backup' && (
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <h3 className="font-serif text-lg font-bold text-primary">Database & Seeder Controls</h3>
                </div>

                <div className="p-3 bg-secondary/10 border border-secondary/20 text-[#5A3828] text-xs rounded-lg">
                  <span>Note: Loading demo data will seed sample products, customers, invoices, and payments to instantly test the platform.</span>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="px-4 py-2.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:brightness-105 transition-all shadow-sm"
                  >
                    Reset & Load Demo Data
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-4 py-2.5 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-all"
                  >
                    Clear All Records
                  </button>
                </div>
              </div>
            )}


          {/* Save Buttons */}
          {activeTab !== 'staff' && activeTab !== 'backup' && (
            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all"
              >
                <Save className="w-4 h-4" /> Save Settings
              </button>
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}
