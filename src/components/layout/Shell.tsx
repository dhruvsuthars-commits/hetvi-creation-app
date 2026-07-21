'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, FileText, Users, ShoppingBag, 
  Layers, CreditCard, Truck, RefreshCw, BarChart2, 
  Bell, Settings, FileSpreadsheet, Trash2, Menu, X, 
  ChevronLeft, ChevronRight, LogOut, Sun, Moon, Plus,
  Sparkles, Smartphone, Monitor, TrendingUp
} from 'lucide-react';
import { localDb } from '@/lib/supabase';

// Sidebar items configuration
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create Invoice', href: '/invoices/create', icon: Plus, isAction: true },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Sales & Expenses', href: '/sales', icon: TrendingUp },
  { name: 'Products', href: '/products', icon: ShoppingBag },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Returns', href: '/returns', icon: RefreshCw },
  { name: 'Reports', href: '/reports', icon: BarChart2 },
  { name: 'Trash', href: '/trash', icon: Trash2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Load session & notifications
  useEffect(() => {
    // Load mobile mode simulator configuration
    const storedMobileMode = localStorage.getItem('isMobileMode');
    if (storedMobileMode === 'true') {
      setIsMobileMode(true);
    }

    // Set default theme from system or preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkTheme(true);
      document.documentElement.classList.add('dark');
    }

    const sessionUser = localDb.getCurrentUser();
    setUser(sessionUser);

    // Initial mock notifications
    const mockNotifs = localDb.getAll('notifications');
    if (mockNotifs.length === 0) {
      const initialNotifs = [
        { id: '1', title: 'Welcome!', message: 'Welcome to Hetvi\'s Creation Management Portal.', read: false, created_at: new Date().toISOString() },
        { id: '2', title: 'Low Stock Alert', message: 'Duo Rakhi Premium is running low (3 remaining).', read: false, created_at: new Date().toISOString() }
      ];
      localDb.saveAll('notifications', initialNotifs);
      setNotifications(initialNotifs);
    } else {
      setNotifications(mockNotifs);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkTheme) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkTheme(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkTheme(true);
    }
  };

  const toggleMobileMode = () => {
    const nextMode = !isMobileMode;
    setIsMobileMode(nextMode);
    localStorage.setItem('isMobileMode', nextMode ? 'true' : 'false');
  };

  const handleLogout = () => {
    localStorage.removeItem('hetvi_db_session');
    router.push('/login');
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    localDb.saveAll('notifications', updated);
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <motion.aside 
        animate={{ width: isSidebarCollapsed ? '72px' : '260px' }}
        className="hidden md:flex flex-col flex-shrink-0 border-r border-border bg-card shadow-sm z-20 relative print:hidden"
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-4 border-b border-border gap-3">
          {!logoError ? (
            <img 
              src="/logo.png" 
              alt="Hetvi's Creation Logo"
              onError={() => setLogoError(true)}
              className="w-8 h-8 rounded-full flex-shrink-0 object-cover border border-accent shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent border border-accent shadow-sm flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          )}
          {!isSidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="font-serif font-semibold text-primary leading-tight">Hetvi's Creation</span>
              <span className="text-xs text-muted-foreground font-sans">Art & Craft Studio</span>
            </motion.div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            if (item.isAction) {
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-accent text-accent-foreground shadow-sm hover:brightness-105 transition-all mb-2"
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-secondary/20 text-accent font-semibold border-l-2 border-accent' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-accent' : 'text-muted-foreground'
                }`} />
                {!isSidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-border space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            {isDarkTheme ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
            {!isSidebarCollapsed && <span>{isDarkTheme ? 'Light Theme' : 'Dark Theme'}</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>

          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border items-center justify-center hover:bg-muted transition-all shadow-sm"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header bar */}
        <header className={`h-16 border-b border-border bg-card flex items-center justify-between px-4 z-10 shadow-sm flex-shrink-0 print:hidden transition-all duration-300 ${
          isMobileMode ? 'max-w-[480px] w-full mx-auto border-x border-border' : ''
        }`}>
          <div className="flex items-center gap-3">
            <h1 className="font-serif font-semibold text-sm md:text-xl text-primary flex items-center gap-1.5">
              {!logoError ? (
                <img 
                  src="/logo.png" 
                  alt="Hetvi's Creation Logo"
                  onError={() => setLogoError(true)}
                  className="w-7 h-7 rounded-full object-cover border border-accent shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent border border-accent shadow-sm flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <span>Hetvi's Creation</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-muted transition-all relative cursor-pointer"
              >
                <motion.div
                  animate={unreadCount > 0 ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <Bell className="w-5 h-5 text-muted-foreground" />
                </motion.div>
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 max-h-96 rounded-xl border border-border bg-card shadow-lg overflow-y-auto py-2 z-30"
                  >
                    <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                      <span className="font-semibold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-accent hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-border">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">No notifications</div>
                      ) : (
                        notifications.map((n) => (
                          <div key={n.id} className={`p-3 text-xs ${n.read ? 'opacity-70' : 'bg-secondary/5 font-semibold'}`}>
                            <div className="font-medium text-foreground">{n.title}</div>
                            <div className="text-muted-foreground mt-0.5">{n.message}</div>
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {new Date(n.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Mode Simulator Toggle */}
            <button 
              onClick={toggleMobileMode}
              title={isMobileMode ? "Switch to Desktop View" : "Switch to Mobile View"}
              className="p-2 rounded-full hover:bg-muted transition-all text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isMobileMode ? (
                <>
                  <Monitor className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold text-[#5A3828]">Desktop View</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold text-[#5A3828]">Mobile View</span>
                </>
              )}
            </button>

            {/* Profile info */}
            <div className="flex items-center gap-2">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 rounded-full bg-[#D88E87]/20 flex items-center justify-center text-sm font-semibold border border-border cursor-pointer transition-all hover:ring-2 hover:ring-[#D88E87]/40"
              >
                {user?.name?.[0] || 'H'}
              </motion.div>
              <span className="hidden sm:inline text-sm font-medium">{user?.name || 'Hetvi Suthar'}</span>
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className={`flex-1 overflow-y-auto bg-background p-4 md:p-6 custom-scrollbar print:p-0 print:bg-white transition-all duration-300 ${
          isMobileMode 
            ? 'max-w-[480px] w-full mx-auto border-x border-border shadow-2xl relative bg-card mt-4 mb-0 rounded-t-3xl min-h-[calc(100vh-8rem)] pb-24' 
            : 'pb-24 md:pb-6'
        }`}>
          {children}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <div className={`md:hidden bg-card border-t border-border py-2 px-6 flex justify-between items-center z-20 print:hidden ${
          isMobileMode ? 'max-w-[480px] w-full mx-auto border-x border-border rounded-b-3xl mb-4 shadow-xl' : 'fixed bottom-0 left-0 right-0'
        }`}>
          {/* Dashboard Tab */}
          <Link href="/dashboard" className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${pathname === '/dashboard' ? 'text-accent scale-105 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          
          {/* Invoices Tab */}
          <Link href="/invoices" className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${pathname.startsWith('/invoices') && pathname !== '/invoices/create' ? 'text-accent scale-105 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Invoices</span>
          </Link>

          {/* Quick Action Floating Tab */}
          <div className="relative -mt-6">
            <button 
              onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
              className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-card"
            >
              <Plus className={`w-6 h-6 transition-transform duration-300 ${isQuickActionOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {/* Customers Tab */}
          <Link href="/customers" className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${pathname.startsWith('/customers') ? 'text-accent scale-105 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Customers</span>
          </Link>

          {/* More Tab */}
          <button 
            onClick={() => setIsMoreSheetOpen(true)}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${isMoreSheetOpen ? 'text-accent scale-105 font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* Mobile Quick Action Overlay Menu */}
      <AnimatePresence>
        {isQuickActionOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickActionOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
              animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
              exit={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
              className={`fixed z-50 md:hidden bg-card border border-border p-4 rounded-2xl shadow-2xl flex flex-col gap-3 left-1/2 bottom-20 w-[90%] max-w-[340px]`}
            >
              <h3 className="text-sm font-semibold text-center pb-2 border-b border-border text-primary font-serif">Quick Actions</h3>
              <Link 
                href="/invoices/create" 
                onClick={() => setIsQuickActionOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all cursor-pointer text-foreground"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">New Invoice</span>
                  <span className="text-[10px] text-muted-foreground">Create a fresh sales bill</span>
                </div>
              </Link>
              <Link 
                href="/customers" 
                onClick={() => setIsQuickActionOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all cursor-pointer text-foreground"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Add Customer</span>
                  <span className="text-[10px] text-muted-foreground">Add to client directory</span>
                </div>
              </Link>
              <Link 
                href="/products" 
                onClick={() => setIsQuickActionOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-all cursor-pointer text-foreground"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E8B1A8]/20 flex items-center justify-center text-[#5A3828]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Add Product</span>
                  <span className="text-[10px] text-muted-foreground">Register new catalog item</span>
                </div>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile More Sheets Navigation */}
      <AnimatePresence>
        {isMoreSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreSheetOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border rounded-t-3xl shadow-2xl p-6 pb-8 flex flex-col gap-4 ${
                isMobileMode ? 'max-w-[480px] mx-auto border-x' : ''
              }`}
            >
              <div className="w-12 h-1.5 rounded-full bg-muted mx-auto -mt-2 mb-2 cursor-pointer" onClick={() => setIsMoreSheetOpen(false)} />
              
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  {!logoError ? (
                    <img 
                      src="/logo.png" 
                      onError={() => setLogoError(true)}
                      className="w-7 h-7 rounded-full object-cover" 
                      alt="Logo" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent border border-accent shadow-sm flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-serif font-bold text-primary text-lg">Hetvi's Creation</span>
                </div>
                <button 
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: 'Products', href: '/products', icon: ShoppingBag },
                  { name: 'Payments', href: '/payments', icon: CreditCard },
                  { name: 'Returns', href: '/returns', icon: RefreshCw },
                  { name: 'Reports', href: '/reports', icon: BarChart2 },
                  { name: 'Trash', href: '/trash', icon: Trash2 },
                  { name: 'Settings', href: '/settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMoreSheetOpen(false)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                        isActive 
                          ? 'bg-accent/15 border-accent text-accent' 
                          : 'border-border bg-muted/35 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium text-center">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="h-[1px] bg-border my-2" />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsMoreSheetOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-muted/20 hover:bg-muted text-sm font-medium transition-all"
                >
                  {isDarkTheme ? <Sun className="w-4 h-4 text-accent" /> : <Moon className="w-4 h-4 text-primary" />}
                  <span>{isDarkTheme ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMoreSheetOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive text-sm font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
