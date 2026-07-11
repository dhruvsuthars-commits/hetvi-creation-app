'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import { localDb } from '@/lib/supabase';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLogs(localDb.getAll('audit_logs'));
  }, []);

  const filteredLogs = logs.filter(log => {
    return log.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
           log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.record_type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Audit Log</h2>
        <p className="text-xs text-muted-foreground font-sans">Trace all database insertions, updates, and settings changes.</p>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 font-semibold border-b border-border">
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">No audit logs recorded yet.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-muted/5 transition-all">
                    <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleString('en-GB')}</td>
                    <td className="p-3 font-semibold text-primary">{log.user_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        log.action === 'insert' ? 'bg-green-100 text-green-700' : log.action === 'update' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground font-medium">{log.record_type}</td>
                    <td className="p-3 font-medium text-stone-700">{log.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
