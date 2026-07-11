'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  FileText, Search, Printer, Download, Share2, 
  Trash2, RefreshCw, Eye, CheckCircle2, AlertCircle, X,
  ExternalLink, Edit
} from 'lucide-react';
import { localDb } from '@/lib/supabase';
import { numberToWords } from '@/utils/numberToWords';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentModeFilter, setPaymentModeFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [businessSettings, setBusinessSettings] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState('/logo.png');

  useEffect(() => {
    loadInvoices();
    if (typeof window !== 'undefined') {
      setLogoUrl(`${window.location.origin}/logo.png`);
    }
    const settings = localDb.getAll('business_settings')[0] || {
      name: "Hetvi's Creation",
      tagline: 'Art & Craft Studio',
      instagram: '@hetvi.creation_',
      phone: '+91 98765 43210',
      thankYouMsg: 'Thank you for supporting handmade creations! ❤️'
    };
    setBusinessSettings(settings);
  }, []);

  const loadInvoices = () => {
    const list = localDb.getAll('invoices');
    if (list.length === 0) {
      // Seed default invoice
      const defaultInv = [
        {
          id: 'inv1',
          invoice_no: 'HC-003',
          customer_id: 'c1',
          customer_name: 'Niyati Amin',
          customer_phone: '9825012345',
          invoice_date: '2026-07-11',
          due_date: '2026-07-18',
          order_no: 'ORD-9304',
          order_source: 'Instagram',
          invoice_status: 'Confirmed',
          payment_status: 'Paid',
          shipping_method: 'Courier',
          tracking_no: 'TRK920192',
          subtotal: 430,
          discount_amount: 0,
          packing_charges: 0,
          shipping_charges: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          grand_total: 430,
          paid_amount: 430,
          balance_amount: 0,
          items: [
            { product_id: 'p1', name: 'Duo Rakhi Premium', qty: 2, rate: 140, discount: 0, tax_percent: 0, total: 280 },
            { product_id: 'p2', name: 'Shrinathji Regular Pack of 3', qty: 1, rate: 150, discount: 0, tax_percent: 0, total: 150 }
          ],
          is_deleted: false,
          created_at: new Date().toISOString()
        }
      ];
      localDb.saveAll('invoices', defaultInv);
      setInvoices(defaultInv);
    } else {
      setInvoices(list.filter(inv => !inv.is_deleted));
    }
  };

  const handleCancelInvoice = (id: string) => {
    const confirm = window.confirm('Are you sure you want to cancel this invoice? This will restore stock.');
    if (!confirm) return;

    const inv = invoices.find(i => i.id === id);
    if (!inv) return;

    // Restore stock if it was confirmed
    if (inv.invoice_status === 'Confirmed') {
      const products = localDb.getAll('products');
      inv.items.forEach((item: any) => {
        if (!item.product_id) return;
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          const restoredStock = prod.current_stock + item.qty;
          localDb.update('products', prod.id, { current_stock: restoredStock });

          localDb.insert('stock_movements', {
            product_id: prod.id,
            product_name: prod.name,
            movement_type: 'Sales Return',
            qty_in: item.qty,
            qty_out: 0,
            reference_no: inv.invoice_no,
            running_balance: restoredStock,
            notes: `Restored stock from cancelled invoice ${inv.invoice_no}`
          });
        }
      });
    }

    localDb.update('invoices', id, { invoice_status: 'Cancelled', payment_status: 'Refunded', balance_amount: 0 });
    loadInvoices();
  };

  const handleMoveToTrash = (id: string) => {
    const confirm = window.confirm('Move this invoice to Trash?');
    if (!confirm) return;
    
    // Soft-delete this invoice
    localDb.update('invoices', id, { is_deleted: true });

    // Load business settings for prefix & starting no
    const savedSettings = localDb.getAll('business_settings')[0] || {
      invoicePrefix: 'HC',
      invoiceStartNo: 1
    };
    const prefix = savedSettings.invoicePrefix || 'HC';
    const startNo = Number(savedSettings.invoiceStartNo || 1);

    // Get all invoices and filter active ones
    const allInvoices = localDb.getAll('invoices');
    const activeInvoices = allInvoices.filter((inv: any) => !inv.is_deleted);
    
    // Sort them sequentially by current number
    activeInvoices.sort((a: any, b: any) => {
      return a.invoice_no.localeCompare(b.invoice_no);
    });

    // Rearrange invoice numbers sequentially
    activeInvoices.forEach((inv: any, idx: number) => {
      const nextNo = startNo + idx;
      const newNo = `${prefix}-${String(nextNo).padStart(3, '0')}`;
      if (inv.invoice_no !== newNo) {
        localDb.update('invoices', inv.id, { invoice_no: newNo });
      }
    });

    loadInvoices();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = (inv: any) => {
    setSelectedInvoice(inv);
    
    const tryDownload = (attempts = 0) => {
      const element = document.getElementById("print-invoice-content");
      if (element) {
        const triggerDownload = () => {
          const opt = {
            margin:       [10, 10, 10, 10],
            filename:     `${inv.invoice_no}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          // @ts-ignore
          window.html2pdf().from(element).set(opt).save();
        };

        // @ts-ignore
        if (window.html2pdf) {
          triggerDownload();
        } else {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = triggerDownload;
          document.body.appendChild(script);
        }
      } else if (attempts < 10) {
        setTimeout(() => tryDownload(attempts + 1), 100);
      }
    };

    tryDownload();
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.payment_status === statusFilter;
    const matchesPaymentMode = paymentModeFilter === 'ALL' || inv.payment_mode === paymentModeFilter;
    return matchesSearch && matchesStatus && matchesPaymentMode;
  });

  const getWhatsAppShareLink = (inv: any) => {
    const msg = `Hello ${inv.customer_name}, thank you for shopping with Hetvi’s Creation. Please find your invoice ${inv.invoice_no}. Total: ₹${inv.grand_total}. Paid: ₹${inv.paid_amount}. Balance: ₹${inv.balance_amount}.`;
    return `https://api.whatsapp.com/send?phone=${inv.customer_phone}&text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Hide page header during print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Invoices</h2>
          <p className="text-xs text-muted-foreground font-sans">View invoice records, process stock restoration, and share receipts.</p>
        </div>
      </div>

      {/* Filters bar - Hidden during print */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card border border-border p-4 rounded-xl shadow-sm print:hidden">
        <div className="relative col-span-1 md:col-span-2">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent text-muted-foreground"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        <div>
          <select
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent text-muted-foreground"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Main Listing Grid - Hidden during print */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 font-semibold border-b border-border">
                <th className="p-3">Invoice No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Invoice Status</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/5 transition-all">
                  <td className="p-3 font-semibold text-primary">{inv.invoice_no}</td>
                  <td className="p-3 text-muted-foreground">{inv.invoice_date}</td>
                  <td className="p-3 font-medium">{inv.customer_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.invoice_status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                    }`}>
                      {inv.invoice_status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.payment_status === 'Paid' 
                          ? 'bg-green-100 text-green-700' 
                          : inv.payment_status === 'Partially Paid' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {inv.payment_status}
                      </span>
                      {inv.payment_mode && (
                        <span className="text-[9px] font-semibold text-accent px-1.5 py-0.2 bg-secondary/20 rounded border border-accent/15">
                          {inv.payment_mode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right font-bold text-primary">₹{Number(inv.grand_total).toFixed(2)}</td>
                  <td className="p-3 text-right font-bold text-destructive">₹{Number(inv.balance_amount).toFixed(2)}</td>
                  <td className="p-3 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="p-1.5 hover:bg-muted rounded-lg text-primary transition-all"
                      title="View Invoice Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/invoices/edit/${inv.id}`}
                      className="p-1.5 hover:bg-muted rounded-lg text-primary transition-all"
                      title="Edit Invoice"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    
                    <button
                      onClick={() => handleDownloadPdf(inv)}
                      className="p-1.5 hover:bg-accent/15 rounded-lg text-accent transition-all cursor-pointer"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {inv.invoice_status !== 'Cancelled' && (
                      <button
                        onClick={() => handleCancelInvoice(inv.id)}
                        className="p-1.5 hover:bg-yellow-50 rounded-lg text-amber-600 transition-all"
                        title="Cancel Invoice"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleMoveToTrash(inv.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-destructive transition-all"
                      title="Delete Invoice"
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

      {/* Full Screen Branded A4 Invoice Preview Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 print:p-0 print:absolute print:inset-0 print:bg-white">
            
            {/* Backdrop - Hidden during print */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="fixed inset-0 bg-black print:hidden"
            />

            {/* A4 Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white text-stone-900 w-full max-w-4xl min-h-[297mm] p-8 md:p-12 shadow-2xl rounded-2xl print:shadow-none print:rounded-none print:p-0 print:w-full print:absolute z-10"
            >
              
              {/* Modal controls - Hidden during print */}
              <div className="absolute top-4 right-4 flex items-center gap-2 print:hidden">
                <Link
                  href={`/invoices/edit/${selectedInvoice.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-semibold shadow-sm hover:bg-stone-50"
                >
                  <Edit className="w-4 h-4" /> Edit Invoice
                </Link>
                <button
                  onClick={() => handleDownloadPdf(selectedInvoice)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Digitalized Invoice Template Layout - Designed exactly from excel */}
              <div id="print-invoice-content" className="w-full flex flex-col bg-white">
                  
                  {/* Brand Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#C98678] pb-6">
                    <div className="flex items-center gap-4">
                      {/* Brand Logo Image */}
                      <img 
                        src={logoUrl} 
                        alt="Hetvi's Creation Logo"
                        className="w-16 h-16 rounded-full border-2 border-[#C98678] object-cover flex-shrink-0 bg-[#FBF7F1]"
                      />
                      <div>
                        <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-[#5A3828] tracking-wide uppercase leading-none">
                          Hetvi's Creation
                        </h1>
                        <span className="text-xs text-[#C98678] font-semibold font-sans tracking-widest block mt-1">
                          ART & CRAFT STUDIO
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 text-right">
                      <div className="inline-block bg-[#F8ECE8] text-[#5A3828] font-serif text-sm font-bold px-3 py-1 rounded border border-[#E6D5C8]">
                        Invoice No: {selectedInvoice.invoice_no}
                      </div>
                      <div className="text-xs text-stone-500 font-medium mt-1.5">
                        Date: {new Date(selectedInvoice.invoice_date).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>

                  {/* Customer Information (Bill To) */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FBF7F1]/60 border border-[#E6D5C8]/70 p-4 rounded-xl">
                    <div>
                      <h4 className="text-[10px] font-bold text-[#765140] uppercase tracking-wider mb-1">
                        Bill To
                      </h4>
                      <h3 className="font-serif font-extrabold text-sm text-[#5A3828]">
                        {selectedInvoice.customer_name}
                      </h3>
                      <div className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                        Phone: {selectedInvoice.customer_phone}
                      </div>
                    </div>

                    <div className="md:text-right">
                      {selectedInvoice.order_no && (
                        <>
                          <h4 className="text-[10px] font-bold text-[#765140] uppercase tracking-wider mb-1">
                            Order Details
                          </h4>
                          <div className="text-[11px] text-stone-600">
                            <div>Order Ref: {selectedInvoice.order_no}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="mt-8 border border-[#765140]/30 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-[#D88E86] text-white font-bold border-b border-[#765140]/30">
                          <th className="p-3 text-center w-12">Sr.</th>
                          <th className="p-3">Description</th>
                          <th className="p-3 text-center w-16">Qty</th>
                          <th className="p-3 text-right w-24">Rate (₹)</th>
                          <th className="p-3 text-right w-24">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#765140]/10">
                        {selectedInvoice.items.map((item: any, idx: number) => (
                          <tr key={idx} className="bg-white">
                            <td className="p-3 text-center text-stone-500">{idx + 1}</td>
                            <td className="p-3 font-semibold text-[#5A3828]">{item.name}</td>
                            <td className="p-3 text-center">{item.qty}</td>
                            <td className="p-3 text-right font-medium">₹{Number(item.rate).toFixed(2)}</td>
                            <td className="p-3 text-right font-bold text-[#5A3828]">₹{Number(item.total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                {/* Footer and Calculations */}
                <div className="mt-6 pt-6 border-t border-stone-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    
                    {/* Thank you message / Brand values */}
                    <div className="text-stone-500 font-sans italic text-xs max-w-sm">
                      <p className="font-semibold text-[#5A3828]">{businessSettings?.thankYouMsg}</p>
                      <p className="text-[10px] text-stone-400 mt-1">Instagram: {businessSettings?.instagram_handle || '@hetvi.creation_'}</p>
                    </div>

                    {/* Total Summary Boxes */}
                    <div className="w-full md:w-80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-500">
                        <span>Subtotal:</span>
                        <span className="font-bold text-stone-800">₹{Number(selectedInvoice.subtotal).toFixed(2)}</span>
                      </div>
                      
                      {selectedInvoice.discount_amount > 0 && (
                        <div className="flex justify-between text-stone-500">
                          <span>Total Discount:</span>
                          <span className="font-bold text-green-700">-₹{Number(selectedInvoice.discount_amount).toFixed(2)}</span>
                        </div>
                      )}

                      {selectedInvoice.shipping_charges > 0 && (
                        <div className="flex justify-between text-stone-500">
                          <span>Shipping:</span>
                          <span className="font-bold text-stone-800">₹{Number(selectedInvoice.shipping_charges).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-extrabold border-t-2 border-[#765140] pt-2 text-[#5A3828] bg-[#FBF7F1] p-2 rounded border border-[#E6D5C8]">
                        <span>Grand Total:</span>
                        <span>₹{Number(selectedInvoice.grand_total).toFixed(2)}</span>
                      </div>

                      <div className="text-[9px] font-bold text-stone-500 leading-relaxed text-right mt-1 italic">
                        Amount in Words: {numberToWords(selectedInvoice.grand_total)}
                      </div>

                      <div className="flex justify-between text-stone-500 pt-1">
                        <span>Amount Paid:</span>
                        <span className="font-bold text-stone-800">₹{Number(selectedInvoice.paid_amount || 0).toFixed(2)}</span>
                      </div>

                      {selectedInvoice.payment_mode && (
                        <div className="flex justify-between items-center text-stone-500 pt-1 text-[10px]">
                          <span>Payment Mode:</span>
                          <span className="font-bold text-accent px-1.5 py-0.5 bg-secondary/20 rounded border border-accent/15 uppercase text-[9px] tracking-wider">{selectedInvoice.payment_mode}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-stone-500 border-t border-dashed border-stone-200 pt-1.5">
                        <span>Balance Due:</span>
                        <span className="font-bold text-destructive">₹{Number(selectedInvoice.balance_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
