'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Printer, BarChart2, TrendingUp, DollarSign, RefreshCw } from 'lucide-react';
import { localDb } from '@/lib/supabase';

export default function ReportsPage() {
  const [salesReport, setSalesReport] = useState<any[]>([]);
  const [productSalesReport, setProductSalesReport] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profitEstimate, setProfitEstimate] = useState({
    grossSales: 0,
    costOfGoods: 0,
    grossProfit: 0,
    profitMargin: 0
  });

  useEffect(() => {
    generateReports();
  }, []);

  const generateReports = () => {
    const invoices = localDb.getAll('invoices').filter(i => !i.is_deleted && i.invoice_status !== 'Cancelled');
    const products = localDb.getAll('products');

    // 1. Sales Report
    setSalesReport(invoices);

    // 2. Product-wise Selling Report
    const productSalesMap: { [key: string]: { name: string, qtySold: number, totalRevenue: number } } = {};
    invoices.forEach(inv => {
      inv.items.forEach((item: any) => {
        const nameKey = item.name || 'Unknown Item';
        if (!productSalesMap[nameKey]) {
          productSalesMap[nameKey] = { name: nameKey, qtySold: 0, totalRevenue: 0 };
        }
        productSalesMap[nameKey].qtySold += Number(item.qty || 0);
        productSalesMap[nameKey].totalRevenue += Number(item.total || 0);
      });
    });
    setProductSalesReport(Object.values(productSalesMap));

    // 3. Profit Estimations
    let grossSales = 0;
    let costOfGoods = 0;

    invoices.forEach(inv => {
      grossSales += Number(inv.grand_total);
      
      inv.items.forEach((item: any) => {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          costOfGoods += item.qty * prod.cost_price;
        } else {
          costOfGoods += item.qty * (item.rate * 0.5);
        }
      });
    });

    const grossProfit = grossSales - costOfGoods;
    const profitMargin = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;

    setProfitEstimate({
      grossSales,
      costOfGoods,
      grossProfit,
      profitMargin
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    generateReports();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Reports & Analytics</h2>
          <p className="text-xs text-muted-foreground font-sans">Analyze sales history, estimated margins, and selling summary of products.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-semibold shadow-sm hover:bg-muted/50 disabled:opacity-50 transition-all cursor-pointer h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Report'}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold shadow-sm hover:brightness-105 transition-all cursor-pointer h-9"
          >
            <Printer className="w-3.5 h-3.5" /> Print Reports
          </button>
        </div>
      </div>

      {/* Whole Sales Till Current Date Card */}
      <div className="p-6 rounded-2xl bg-card border-2 border-accent/20 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] bg-accent/10 text-accent font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Cumulative Sales
          </span>
          <h3 className="font-serif text-sm font-semibold text-muted-foreground uppercase mt-2.5">
            Whole Sales Till Current Date
          </h3>
          <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
            Summarized sales totals of all active invoices up to {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
        <h4 className="font-serif font-extrabold text-3xl md:text-4xl text-accent self-start md:self-auto">
          ₹{profitEstimate.grossSales.toFixed(2)}
        </h4>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales ledger list */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
          <h3 className="font-serif text-sm font-bold text-primary border-b border-border pb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-accent" /> Sales Summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 font-semibold border-b border-border">
                  <th className="p-2">Invoice No</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {salesReport.map(inv => (
                  <tr key={inv.id} className="hover:bg-muted/5">
                    <td className="p-2 font-semibold text-primary">{inv.invoice_no}</td>
                    <td className="p-2 text-muted-foreground">{inv.invoice_date}</td>
                    <td className="p-2 font-medium">{inv.customer_name}</td>
                    <td className="p-2 text-right font-bold text-primary">₹{Number(inv.grand_total).toFixed(2)}</td>
                  </tr>
                ))}
                {salesReport.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">No invoices generated yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Selling report */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
          <h3 className="font-serif text-sm font-bold text-primary border-b border-border pb-1.5 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-accent" /> Product Selling Report
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 font-semibold border-b border-border">
                  <th className="p-2">Product Name</th>
                  <th className="p-2 text-center">Quantity Sold</th>
                  <th className="p-2 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {productSalesReport.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-muted/5">
                    <td className="p-2 font-semibold text-primary">{prod.name}</td>
                    <td className="p-2 text-center font-medium">{prod.qtySold} units</td>
                    <td className="p-2 text-right font-bold text-primary">₹{Number(prod.totalRevenue).toFixed(2)}</td>
                  </tr>
                ))}
                {productSalesReport.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">No sales data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
