'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { localDb } from '@/lib/supabase';

export default function TrashPage() {
  const [trashItems, setTrashItems] = useState<any[]>([]);

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = () => {
    if (typeof window !== 'undefined') {
      const trash = localStorage.getItem('hetvi_db_trash');
      setTrashItems(trash ? JSON.parse(trash) : []);
    }
  };

  const handleRestore = (item: any) => {
    const table = item.original_table;
    const list = localDb.getAll(table);
    
    // Check if item is already back or restore it
    list.unshift(item.data);
    localDb.saveAll(table, list);

    // Remove from trash list
    const updatedTrash = trashItems.filter(t => t.id !== item.id);
    localStorage.setItem('hetvi_db_trash', JSON.stringify(updatedTrash));
    setTrashItems(updatedTrash);
    
    localDb.logAudit('restore', table, item.original_id, `Restored ${table} from trash`);
    alert(`Successfully restored ${table} record!`);
  };

  const handleEmptyTrash = () => {
    const confirm = window.confirm('Are you sure you want to permanently empty the trash? This action is irreversible.');
    if (!confirm) return;

    localStorage.setItem('hetvi_db_trash', JSON.stringify([]));
    setTrashItems([]);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">Trash & Soft Deletions</h2>
          <p className="text-xs text-muted-foreground font-sans">Restore deleted customers, invoices, products, or suppliers.</p>
        </div>

        {trashItems.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-red-600 text-white text-xs font-semibold shadow-sm hover:bg-red-700 transition-all self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" /> Empty Trash
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 font-semibold border-b border-border">
                <th className="p-3">Deleted Date</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Record Details</th>
                <th className="p-3 text-center">Restore</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trashItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs">Trash is currently empty.</td>
                </tr>
              ) : (
                trashItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/5 transition-all">
                    <td className="p-3 text-muted-foreground">{new Date(item.deleted_at).toLocaleString('en-GB')}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        {item.original_table}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-primary">
                      {item.data?.name || item.data?.invoice_no || item.data?.receipt_no || 'Record ID: ' + item.original_id}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleRestore(item)}
                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-all"
                        title="Restore Record"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </td>
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
