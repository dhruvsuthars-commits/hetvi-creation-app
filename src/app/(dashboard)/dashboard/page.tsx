'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Users, Calendar, ChevronLeft, ChevronRight, CheckCircle2,
  ShieldAlert, CreditCard, ShoppingBag, ArrowRight, Plus, Sparkles, RefreshCw
} from 'lucide-react';
import { localDb } from '@/lib/supabase';

const COLORS = ['#5A3828', '#D88E86', '#C98678', '#E8B1A8', '#8C8A64'];

// Custom count-up animation hook for decimal values
const AnimatedCounter = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(2));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut" });
    return () => controls.stop();
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
};

// Custom count-up animation hook for integer values
const AnimatedIntCounter = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.floor(latest).toString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut" });
    return () => controls.stop();
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
};

// Animation config variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring' as const, 
      stiffness: 100, 
      damping: 15 
    } 
  }
} as const;

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    calculateStats();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    totalInvoices: 0,
    paidCount: 0,
    unpaidCount: 0,
    partialCount: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    outStockCount: 0,
    totalReceived: 0,
    totalPending: 0,
    totalSales: 0
  });

  const [pieData, setPieData] = useState<any[]>([]);
  const [lowStockProds, setLowStockProds] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    calculateStats();
  }, []);

  const calculateStats = () => {
    const allInvoices = localDb.getAll('invoices').filter(i => !i.is_deleted);
    setInvoices(allInvoices);

    const payments = localDb.getAll('payments');
    const customers = localDb.getAll('customers');
    const products = localDb.getAll('products');

    const todayStr = new Date().toISOString().split('T')[0];
    const curMonth = new Date().getMonth();
    const curYear = new Date().getFullYear();

    let todaySales = 0;
    let monthSales = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let partialCount = 0;
    let totalPending = 0;
    let totalSales = 0;

    allInvoices.forEach(inv => {
      const invDate = new Date(inv.invoice_date);
      const isToday = inv.invoice_date === todayStr;
      const isThisMonth = invDate.getMonth() === curMonth && invDate.getFullYear() === curYear;

      if (inv.invoice_status !== 'Cancelled') {
        if (isToday) todaySales += Number(inv.grand_total);
        if (isThisMonth) monthSales += Number(inv.grand_total);
        totalPending += Number(inv.balance_amount);
        totalSales += Number(inv.grand_total);
      }

      if (inv.payment_status === 'Paid') paidCount++;
      else if (inv.payment_status === 'Partially Paid') partialCount++;
      else if (inv.payment_status === 'Unpaid') unpaidCount++;
    });

    const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const lowStockCount = products.filter(p => p.current_stock <= p.min_stock && p.current_stock > 0).length;
    const outStockCount = products.filter(p => p.current_stock === 0).length;

    setStats({
      todaySales,
      monthSales,
      totalInvoices: allInvoices.length,
      paidCount,
      unpaidCount,
      partialCount,
      totalCustomers: customers.length,
      totalProducts: products.length,
      lowStockCount,
      outStockCount,
      totalReceived,
      totalPending,
      totalSales
    });

    setLowStockProds(products.filter(p => p.current_stock <= p.min_stock).slice(0, 5));

    // TOTAL SALE Breakdown (Paid portion vs Remaining Outstanding portion)
    const totalPaid = totalSales - totalPending;
    const chartPie = [
      { name: 'Paid Amount', value: totalPaid },
      { name: 'Remaining Amount', value: totalPending }
    ];

    setPieData(chartPie);
  };

  // Calendar Helpers
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Fill previous month offsets
    const firstDayIndex = date.getDay(); // 0 is Sunday
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    // Fill current month days
    const totalDays = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    return days;
  };

  const getSalesSumForDate = (date: Date) => {
    const formatted = date.toISOString().split('T')[0];
    return invoices
      .filter(inv => inv.invoice_date === formatted && inv.invoice_status !== 'Cancelled')
      .reduce((sum, inv) => sum + Number(inv.grand_total), 0);
  };

  const calendarDays = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get Invoices for the clicked date
  const getSelectedInvoices = () => {
    if (!selectedDate) return [];
    return invoices.filter(inv => inv.invoice_date === selectedDate);
  };

  const selectedDayInvoices = getSelectedInvoices();

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 relative"
    >
      
      {/* 1. Welcome Header (Creative Surprise) */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.15, duration: 0.5 }}
            className="flex items-center gap-1.5 text-[10px] font-bold text-accent tracking-wider uppercase"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" style={{ animationDuration: '6s' }} /> Welcome back, Hetvi
          </motion.div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary mt-0.5">Overview</h2>
          <p className="text-xs text-muted-foreground font-sans">Hetvi's Creation — Art & Craft Studio Dashboard</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-semibold shadow-sm hover:bg-muted/50 disabled:opacity-50 transition-all cursor-pointer h-9"
            title="Recalculate All Sales Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <motion.div
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link 
              href="/invoices/create" 
              className="inline-block px-4 py-2.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:brightness-105 transition-all shadow-sm cursor-pointer"
            >
              Create Invoice
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* 2. Handmade Thread Motif (Creative Surprise) */}
      <div className="h-1.5 overflow-hidden pointer-events-none opacity-20 print:hidden hidden md:block">
        <svg viewBox="0 0 100 10" className="w-full h-full stroke-accent fill-none" strokeWidth="0.5" strokeDasharray="3,3">
          <path d="M 0 5 Q 25 10 50 5 T 100 5" />
        </svg>
      </div>

      {/* KPI Cards Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div 
          whileHover={{ y: -3, borderColor: '#C98678', boxShadow: '0 4px 12px rgba(201,134,120,0.12)' }}
          className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between transition-all duration-300 min-h-[100px]"
        >
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Today's Sales</span>
          <h3 className="font-serif font-extrabold text-xl text-primary mt-2">
            ₹{mounted ? <AnimatedCounter value={stats.todaySales} /> : stats.todaySales.toFixed(2)}
          </h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, borderColor: '#C98678', boxShadow: '0 4px 12px rgba(201,134,120,0.12)' }}
          className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between transition-all duration-300 min-h-[100px]"
        >
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">This Month's Sales</span>
          <h3 className="font-serif font-extrabold text-xl text-primary mt-2">
            ₹{mounted ? <AnimatedCounter value={stats.monthSales} /> : stats.monthSales.toFixed(2)}
          </h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, borderColor: '#C98678', boxShadow: '0 4px 12px rgba(201,134,120,0.12)' }}
          className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between transition-all duration-300 min-h-[100px]"
        >
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Sales</span>
          <h3 className="font-serif font-extrabold text-xl text-[#8C8A64] mt-2">
            ₹{mounted ? <AnimatedCounter value={stats.totalSales} /> : stats.totalSales.toFixed(2)}
          </h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3, borderColor: '#C98678', boxShadow: '0 4px 12px rgba(201,134,120,0.12)' }}
          className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col justify-between transition-all duration-300 min-h-[100px]"
        >
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Outstanding Pending</span>
          <h3 className="font-serif font-extrabold text-xl text-red-600 mt-2">
            ₹{mounted ? <AnimatedCounter value={stats.totalPending} /> : stats.totalPending.toFixed(2)}
          </h3>
        </motion.div>
      </motion.div>

      {/* Main Section */}
      {mounted && (
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Sales Datewise Calendar */}
          <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-sm md:text-base text-primary flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-accent animate-pulse" /> Datewise Sales Calendar
              </h3>
              
              <div className="flex items-center gap-3 bg-muted/40 px-3 py-1 rounded-full border border-border/60">
                <button onClick={prevMonth} className="p-1 hover:bg-background rounded-full transition-all text-primary cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-primary tracking-wide min-w-[120px] text-center font-serif">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-background rounded-full transition-all text-primary cursor-pointer">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Calendar Grid Container (Responsive compact agenda fallback included below) */}
            <div className="overflow-x-auto pb-1">
              <div className="grid grid-cols-7 gap-2 border-t border-border pt-4 min-w-[280px]">
                {weekDays.map(day => (
                  <div key={day} className="text-center font-serif font-bold text-[9px] uppercase tracking-wider text-[#5A3828] bg-[#5A3828]/5 py-1.5 rounded-lg border border-[#5A3828]/5">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((d, index) => {
                  const salesTotal = getSalesSumForDate(d.date);
                  const dateStr = d.date.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateStr;
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.03, y: -1 }}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`min-h-[62px] p-2 border rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-300 relative ${
                        d.isCurrentMonth 
                          ? isSelected 
                            ? 'bg-[#5A3828] text-[#FFFDF9] border-transparent shadow-lg font-bold' 
                            : isToday
                            ? 'bg-[#F8ECE8]/60 border-[#D88E86] border-2 shadow-[0_0_12px_rgba(216,142,134,0.25)] text-primary font-bold'
                            : 'bg-[#FFFDF9] hover:bg-[#F8ECE8]/20 border-border/60 text-primary' 
                          : 'bg-muted/5 border-transparent text-muted-foreground/30 opacity-30 pointer-events-none'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${
                          isToday ? isSelected ? 'text-white' : 'text-[#5A3828] font-black' : ''
                        }`}>
                          {d.date.getDate()}
                          {isToday && (
                            <span className={`text-[7px] tracking-wide px-1 py-0.2 rounded font-sans uppercase font-extrabold ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-[#D88E86] text-white'
                            }`}>
                              Today
                            </span>
                          )}
                        </span>
                        
                        {/* Calendar Sales Spark (Creative Surprise) */}
                        {salesTotal > 0 && (
                          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C98678] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D88E86]"></span>
                          </span>
                        )}
                      </div>
                      
                      {salesTotal > 0 && (
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md leading-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                          isSelected 
                            ? 'bg-white/20 border border-white/30 text-white' 
                            : 'bg-gradient-to-r from-accent/15 to-accent/5 border border-accent/20 text-[#5A3828]'
                        }`}>
                          ₹{salesTotal}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Clicked Date Details Panel */}
            <AnimatePresence mode="wait">
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="bg-muted/20 border border-border/70 p-4.5 rounded-2xl mt-4 space-y-3 shadow-inner"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-serif font-bold text-primary flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-accent" /> Invoices on {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </h4>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10">
                      {selectedDayInvoices.length} {selectedDayInvoices.length === 1 ? 'Invoice' : 'Invoices'}
                    </span>
                  </div>
                  
                  {selectedDayInvoices.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic pl-6">No sales transactions logged on this date.</p>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {selectedDayInvoices.map((inv) => (
                        <div key={inv.id} className="flex justify-between items-center py-2.5 text-xs first:pt-1 last:pb-1 hover:bg-muted/10 px-2 rounded-lg transition-all duration-200">
                          <div>
                            <span className="font-semibold text-primary block">{inv.customer_name}</span>
                            <span className="text-[10px] text-muted-foreground font-sans">Inv: <span className="font-semibold">{inv.invoice_no}</span></span>
                          </div>
                          <div className="text-right">
                            <span className="font-serif font-bold text-primary block">₹{Number(inv.grand_total).toFixed(2)}</span>
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.2 mt-0.5 rounded-full ${
                              inv.payment_status === 'Paid' 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : inv.payment_status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {inv.payment_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Payment Modes Pie Chart with Donut Center Total (Creative Surprise) */}
          <div className="lg:col-span-1 bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-sm text-primary flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-accent" /> TOTAL SALE</h3>
            <div className="h-64 flex flex-col justify-center items-center relative">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => {
                      let fill = COLORS[index % COLORS.length];
                      if (entry.name === 'Paid Amount') fill = '#8C8A64';
                      else if (entry.name === 'Remaining Amount') fill = '#D88E86';
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Donut Chart Center Value (Creative Surprise) */}
              <div className="absolute top-[38%] flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">Total Sales</span>
                <span className="font-serif font-extrabold text-primary text-sm mt-0.5">
                  ₹{mounted ? <AnimatedCounter value={stats.totalSales} /> : stats.totalSales.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] mt-2">
                {pieData.map((d, i) => {
                  let fill = COLORS[i % COLORS.length];
                  if (d.name === 'Paid Amount') fill = '#8C8A64';
                  else if (d.name === 'Remaining Amount') fill = '#D88E86';
                  return (
                    <span key={d.name} className="flex items-center gap-1 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: fill }} />
                      {d.name} (₹{Number(d.value).toFixed(2)})
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* System Summary */}
      <motion.div 
        variants={itemVariants}
        className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 max-w-2xl"
      >
        <h3 className="font-serif font-bold text-sm text-primary flex items-center gap-1.5"><ShieldAlert className="w-4 h-4 text-accent" /> System Summary</h3>
        
        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          <motion.div 
            whileHover={{ scale: 1.02, borderColor: '#C98678' }}
            className="p-3 bg-background border border-border rounded-xl transition-all duration-300"
          >
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Total Customers</span>
            <span className="font-serif font-bold text-lg text-primary block mt-1">
              {mounted ? <AnimatedIntCounter value={stats.totalCustomers} /> : stats.totalCustomers}
            </span>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02, borderColor: '#C98678' }}
            className="p-3 bg-background border border-border rounded-xl transition-all duration-300"
          >
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider">Total Products</span>
            <span className="font-serif font-bold text-lg text-primary block mt-1">
              {mounted ? <AnimatedIntCounter value={stats.totalProducts} /> : stats.totalProducts}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Floating Action Button (Creative Surprise) */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/invoices/create"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[#D88E86] text-white shadow-lg border border-white/20 active:bg-[#C98678] transition-all cursor-pointer"
            aria-label="Create New Invoice"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </motion.div>
      </div>

    </motion.div>
  );
}
