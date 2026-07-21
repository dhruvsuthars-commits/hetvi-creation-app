'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Plus, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { localDb } from '@/lib/supabase';

export default function SalesPage() {
  const [totalSales, setTotalSales] = useState<number>(0);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simple Expense Form State
  const [form, setForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // 1. Calculate Total Earned from all invoice item multiplications (qty * rate) & grand_totals
    const invoices = localDb.getAll('invoices').filter(inv => !inv.is_deleted);
    const earned = invoices.reduce((sum, inv) => {
      // Calculate total by summing item multiplication (qty * rate) or using grand_total
      let invSum = 0;
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        invSum = inv.items.reduce((itemTotal: number, item: any) => {
          const qty = Number(item.qty || item.quantity || 1);
          const rate = Number(item.rate || item.price || item.unit_price || 0);
          const total = Number(item.total) || (qty * rate);
          return itemTotal + total;
        }, 0);
      } else {
        invSum = Number(inv.grand_total || inv.total_amount || inv.subtotal || 0);
      }
      return sum + invSum;
    }, 0);
    setTotalSales(earned);

    // 2. Fetch Expenses list
    let list = localDb.getAll('app_expenses');
    if (list.length === 0) {
      // Demo initial expenses
      list = [
        {
          id: 'exp-1',
          title: 'Raw Material Purchase (Silk Threads & Beads)',
          amount: 10500,
          date: '2026-07-12',
          notes: 'Threads, Kundan stones and craft items',
          created_at: new Date().toISOString()
        },
        {
          id: 'exp-2',
          title: 'Velvet Packaging Boxes',
          amount: 5000,
          date: '2026-07-15',
          notes: 'Branded gift boxes',
          created_at: new Date().toISOString()
        }
      ];
      localDb.saveAll('app_expenses', list);
    }
    setExpenses(list);
  };

  // Calculations
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netEarnings = totalSales - totalSpent;

  // Add Expense Handler
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || Number(form.amount) <= 0) return;

    const newExpense = {
      title: form.title,
      amount: Number(form.amount),
      date: form.date,
      notes: form.notes
    };

    localDb.insert('app_expenses', newExpense);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowAddModal(false);
      setForm({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      loadData();
    }, 1000);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (id: string) => {
    if (confirm('Delete this expense?')) {
      localDb.delete('app_expenses', id);
      loadData();
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-accent" />
            Sales & Expenses
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track total sales earnings, money spent on expenses, and net profit.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 shadow-xs transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* 3 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Earned */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-gray-900 p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Total Earned (Sales)
            </span>
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/50 p-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-serif text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            ₹{totalSales.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Sum of all invoice items (Quantity × Rate)
          </div>
        </motion.div>

        {/* Card 2: Total Spent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/60 to-white dark:from-rose-950/20 dark:to-gray-900 p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Total Spent (Expenses)
            </span>
            <div className="rounded-xl bg-rose-100 dark:bg-rose-900/50 p-2 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 font-serif text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
        </motion.div>

        {/* Card 3: Net Amount (Profit) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/60 to-white dark:from-indigo-950/20 dark:to-gray-900 p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Net Amount (Earned - Spent)
            </span>
            <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/50 p-2 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className={`mt-3 font-serif text-2xl md:text-3xl font-bold ${netEarnings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            ₹{netEarnings.toLocaleString('en-IN')}
          </div>
        </motion.div>
      </div>

      {/* Expenses Table Container */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-white">
            Expenses List
          </h2>

          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-accent/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <p className="text-base font-medium">No expenses added yet.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 text-sm font-semibold text-accent hover:underline"
              >
                + Add your first expense
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Expense Name / Reason</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Amount Spent</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {item.title}
                      {item.notes && (
                        <span className="block text-xs text-gray-400 font-normal mt-0.5">{item.notes}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      -₹{Number(item.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="font-serif text-xl font-bold text-gray-900 dark:text-white mb-4">
              Add New Expense
            </h2>

            {saveSuccess ? (
              <div className="py-6 text-center text-emerald-600">
                <CheckCircle2 className="mx-auto h-10 w-10 animate-bounce mb-2" />
                <p className="font-bold">Expense Saved Successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 mb-1">
                    Expense Name / Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Raw Material Purchase, Thread, Transport"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 mb-1">
                    Amount Spent (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 2500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 mb-1">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Additional details..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent/90 rounded-xl shadow-xs"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
