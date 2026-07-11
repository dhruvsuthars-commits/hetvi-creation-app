'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Calendar, BarChart3, TrendingUp, DollarSign, Wallet, RefreshCw } from 'lucide-react';
import { localDb } from '@/lib/supabase';

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [auditPeriod, setAuditPeriod] = useState<'date' | 'week' | 'month' | 'total'>('date');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    const invs = localDb.getAll('invoices').filter(i => !i.is_deleted && i.invoice_status !== 'Cancelled');
    setInvoices(invs);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInvoices();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Helper date parsing
  const getStartOfWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  // 1. Audit By Specific Date
  const dateInvoices = invoices.filter(i => i.invoice_date === selectedDate);
  
  // 2. Audit By Current Week
  const today = new Date();
  const startOfWeek = getStartOfWeek(new Date(today));
  startOfWeek.setHours(0,0,0,0);
  const weekInvoices = invoices.filter(i => {
    if (!i.invoice_date) return false;
    const invDate = new Date(i.invoice_date);
    invDate.setHours(0,0,0,0);
    return invDate >= startOfWeek && invDate <= today;
  });

  // 3. Audit By Current Month
  const currentMonthStr = selectedDate.slice(0, 7); // YYYY-MM
  const monthInvoices = invoices.filter(i => i.invoice_date && i.invoice_date.startsWith(currentMonthStr));

  // 4. Audit By Total (All-time)
  const totalInvoices = invoices;

  // Calculators
  const calculateAudit = (list: any[]) => {
    let paid = 0;
    let unpaid = 0;
    let total = 0;
    const byMode: { [key: string]: number } = {
      'Cash': 0,
      'UPI': 0,
      'Card': 0,
      'Net Banking': 0
    };

    list.forEach(inv => {
      const invTotal = Number(inv.grand_total || 0);
      const invUnpaid = Number(inv.balance_amount || 0);
      const invPaid = invTotal - invUnpaid;

      total += invTotal;
      unpaid += invUnpaid;
      paid += invPaid;

      const mode = inv.payment_mode || 'Cash';
      if (byMode[mode] === undefined) {
        byMode[mode] = 0;
      }
      byMode[mode] += invPaid;
    });

    return { paid, unpaid, total, byMode };
  };

  const dateAudit = calculateAudit(dateInvoices);
  const weekAudit = calculateAudit(weekInvoices);
  const monthAudit = calculateAudit(monthInvoices);
  const totalAudit = calculateAudit(totalInvoices);

  // Month Display Name
  const getMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const renderAuditCard = (title: string, subtitle: string, audit: ReturnType<typeof calculateAudit>, customHeader?: React.ReactNode) => {
    return (
      <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex justify-between items-start border-b border-border pb-3">
          <div>
            <h3 className="font-serif text-base font-bold text-primary">{title}</h3>
            <span className="text-[10px] text-muted-foreground block mt-0.5">{subtitle}</span>
          </div>
          {customHeader}
        </div>

        {/* Paid / Unpaid Split */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 rounded-xl p-3.5">
            <span className="text-[9px] uppercase font-bold text-green-700 dark:text-green-400 block">Amount Paid</span>
            <h4 className="font-serif font-extrabold text-lg text-green-800 dark:text-green-300 mt-1">₹{audit.paid.toFixed(2)}</h4>
          </div>
          <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-xl p-3.5">
            <span className="text-[9px] uppercase font-bold text-red-700 dark:text-red-400 block">Amount Unpaid</span>
            <h4 className="font-serif font-extrabold text-lg text-red-800 dark:text-red-300 mt-1">₹{audit.unpaid.toFixed(2)}</h4>
          </div>
        </div>

        {/* Billing Total */}
        <div className="bg-secondary/5 rounded-xl p-3 border border-border/50 flex justify-between items-center text-xs">
          <span className="font-semibold text-muted-foreground">Total Invoiced Amount</span>
          <span className="font-serif font-extrabold text-primary">₹{audit.total.toFixed(2)}</span>
        </div>

        {/* Payment Modes Breakdown */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Payment Mode Audits (Paid Portion)</span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {Object.entries(audit.byMode).map(([mode, amt]) => (
              <div key={mode} className="flex justify-between items-center bg-background/50 border border-border/50 rounded-lg p-2">
                <span className="font-medium text-stone-600">{mode}</span>
                <span className="font-bold text-primary">₹{amt.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
            <Wallet className="w-7 h-7 text-accent" /> Sales & Payments Audit
          </h2>
          <p className="text-xs text-muted-foreground font-sans">Audit collection and outstanding balances by Date, Week, Month, and Payment Mode.</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-semibold shadow-sm hover:bg-muted/50 disabled:opacity-50 transition-all cursor-pointer h-9 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Audit'}
        </button>
      </div>

      {/* Filter Selector Options */}
      <div className="flex border-b border-border gap-2 pb-2 print:hidden">
        <button
          onClick={() => setAuditPeriod('date')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            auditPeriod === 'date' ? 'bg-accent text-accent-foreground shadow-sm' : 'hover:bg-muted/50 text-muted-foreground'
          }`}
        >
          By Date
        </button>
        <button
          onClick={() => setAuditPeriod('week')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            auditPeriod === 'week' ? 'bg-accent text-accent-foreground shadow-sm' : 'hover:bg-muted/50 text-muted-foreground'
          }`}
        >
          By Week
        </button>
        <button
          onClick={() => setAuditPeriod('month')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            auditPeriod === 'month' ? 'bg-accent text-accent-foreground shadow-sm' : 'hover:bg-muted/50 text-muted-foreground'
          }`}
        >
          By Month
        </button>
        <button
          onClick={() => setAuditPeriod('total')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            auditPeriod === 'total' ? 'bg-accent text-accent-foreground shadow-sm' : 'hover:bg-muted/50 text-muted-foreground'
          }`}
        >
          By Total
        </button>
      </div>

      {/* Active Selected Audit Card Display */}
      <div className="max-w-2xl">
        {auditPeriod === 'date' && renderAuditCard(
          "By Selected Date", 
          `Auditing for single date: ${selectedDate}`, 
          dateAudit,
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 border border-border rounded-lg bg-background text-xs text-stone-700 font-semibold focus:outline-none h-8"
          />
        )}

        {auditPeriod === 'week' && renderAuditCard(
          "By Current Week", 
          `Auditing from ${startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} to Today`, 
          weekAudit
        )}

        {auditPeriod === 'month' && renderAuditCard(
          "By Current Month", 
          `Auditing month: ${getMonthName(currentMonthStr)}`, 
          monthAudit
        )}

        {auditPeriod === 'total' && renderAuditCard(
          "By Total (All Time)", 
          "Auditing all-time transactions in database", 
          totalAudit
        )}
      </div>

    </div>
  );
}
