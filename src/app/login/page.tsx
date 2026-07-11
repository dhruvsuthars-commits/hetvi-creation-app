'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Eye, EyeOff, Lock, Mail, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent, selectedRole?: 'ADMIN') => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    let userEmail = email;
    let userPassword = password;
    let name = 'Hetvi Suthar (Owner)';
    let role = 'ADMIN';

    if (selectedRole === 'ADMIN') {
      userEmail = 'admin@hetvicreation.com';
      userPassword = 'password123';
    }

    setTimeout(() => {
      // Enforce strict Admin Credentials Check
      if (userEmail !== 'admin@hetvicreation.com' || userPassword !== 'password123') {
        setError('Access Denied: Only the administrator can log in.');
        setIsLoading(false);
        return;
      }
      
      // Store session details in local storage
      const session = {
        id: crypto.randomUUID(),
        email: userEmail,
        name,
        role,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('hetvi_db_session', JSON.stringify(session));
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4 py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl border border-border shadow-md"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20 text-accent shadow-sm">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-primary">
            Hetvi's Creation
          </h2>
          <p className="mt-1 text-sm text-muted-foreground font-sans">
            Art & Craft Studio — Management Portal
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center border border-destructive/20 font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={(e) => handleLogin(e)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hetvicreation.com"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent bg-background"
              />
              <label htmlFor="remember-me" className="ml-2 block text-muted-foreground">
                Remember me
              </label>
            </div>

            <a href="/forgot-password" className="font-medium text-accent hover:underline">
              Forgot your password?
            </a>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-md hover:brightness-105 transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>


      </motion.div>
    </div>
  );
}
