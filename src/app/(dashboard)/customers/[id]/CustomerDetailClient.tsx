'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, User, FileText, CreditCard, Layers } from 'lucide-react';
import { localDb } from '@/lib/supabase';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  useEffect(() => {
    const cust = localDb.getById('customers', customerId);
    if (!cust) {
      router.push('/customers');
      return;
    }
    setCustomer(cust);

    // Calculate customer ledger log
    const invoices = localDb.getAll('invoices').filter(i => i.customer_id === customerId && !i.is_deleted);
    const payments = localDb.getAll('payments').filter(p => p.customer_id === customerId);

    // Map into ledger transactions
    const entries: any[] = [];
    
    invoices.forEach(inv => {
      entries.push({
        id: inv.id,
        date: inv.invoice_date,
        type: 'Invoice',
        reference: inv.invoice_no,
        debit: Number(inv.grand_total), // customer owes us
        credit: 0,
        notes: inv.invoice_status === 'Cancelled' ? 'Invoice Cancelled' : 'Products Purchased'
      });
      
      // If invoice was cancelled, add reversal credit
      if (inv.invoice_status === 'Cancelled') {
        entries.push({
          id: `${inv.id}-rev`,
          date: inv.updated_at.split('T')[0],
          type: 'Invoice Cancel Reversal',
          reference: inv.invoice_no,
          debit: 0,
          credit: Number(inv.grand_total),
          notes: 'Invoice cancellation reversal credit'
        });
      }
    });

    payments.forEach(p => {
      entries.push({
        id: p.id,
        date: p.payment_date.split('T')[0],
        type: 'Payment Received',
        reference: p.receipt_no,
        debit: 0,
        credit: Number(p.amount), // customer paid us
        notes: p.notes || `Paid via ${p.payment_mode}`
      });
    });

    // Sort by date ascending
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let balance = 0;
    const ledgerWithBalance = entries.map(entry => {
      balance = balance + entry.debit - entry.credit;
      return {
        ...entry,
        running_balance: balance
      };
    });

    setLedgerEntries(ledgerWithBalance.reverse()); // Show latest first
  }, [customerId, router]);

  if (!customer) return null;

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex items-center gap-2">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">{customer.name} Ledger</h2>
          <p className="text-xs text-muted-foreground">Historical records of invoices, payments, and balances.</p>
        </div>
      </div>

      {/* Customer profile card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-1 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-sm text-primary flex items-center gap-1.5"><User className="w-4 h-4 text-accent" /> Profile Info</h3>
          
          <div className="space-y-2 text-xs text-muted-foreground">
            <div><span className="font-bold text-primary">Phone:</span> {customer.phone}</div>
            <div><span className="font-bold text-primary">WhatsApp:</span> {customer.whatsapp || '-'}</div>
            <div><span className="font-bold text-primary">Email:</span> {customer.email || '-'}</div>
            <div><span className="font-bold text-primary">Address:</span> {customer.billing_address}, {customer.city}, {customer.state}</div>
            <div><span className="font-bold text-primary">Customer Type:</span> {customer.type}</div>
            {customer.notes && <div className="p-2.5 rounded-lg bg-muted/40 italic mt-2">{customer.notes}</div>}
          </div>
        </div>

        {/* Ledger Details List */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-serif text-sm font-bold text-primary">Customer Ledger entries</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 font-semibold border-b border-border">
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3 text-right">Debit (Owed)</th>
                  <th className="p-3 text-right">Credit (Paid)</th>
                  <th className="p-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledgerEntries.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/5 transition-all">
                    <td className="p-3 text-muted-foreground">{new Date(log.date).toLocaleDateString('en-GB')}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.type === 'Invoice' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-primary">{log.reference}</td>
                    <td className="p-3 text-right font-bold text-stone-700">{log.debit > 0 ? `₹${log.debit.toFixed(2)}` : '-'}</td>
                    <td className="p-3 text-right font-bold text-green-600">{log.credit > 0 ? `₹${log.credit.toFixed(2)}` : '-'}</td>
                    <td className="p-3 text-right font-bold text-primary">₹{log.running_balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
