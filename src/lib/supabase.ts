import { createClient } from '@supabase/supabase-js';
import { db } from './firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

// Environment variables check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fully functional Local Storage-based mock database for seamless offline/standalone support
class LocalDbService {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const data = localStorage.getItem(`hetvi_db_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  }

  private setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`hetvi_db_${key}`, JSON.stringify(value));
    
    // Auto-sync to Supabase if config is present
    if (supabaseUrl && supabaseAnonKey && supabase && key !== 'session') {
      supabase
        .from('sync_data')
        .upsert({ id: key, data: value, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error(`Failed to sync ${key} to Supabase:`, error);
        });
    }

    // Auto-sync to Firebase Firestore if config is present
    if (db && key !== 'session') {
      setDoc(doc(db, 'sync_data', key), {
        id: key,
        data: value,
        updated_at: new Date().toISOString()
      }).catch(err => console.error(`Failed to sync ${key} to Firebase Firestore:`, err));
    }
  }

  // Push single table to cloud database
  async syncToCloud(key: string, value: any): Promise<void> {
    if (supabaseUrl && supabaseAnonKey && supabase && key !== 'session') {
      try {
        await supabase
          .from('sync_data')
          .upsert({ id: key, data: value, updated_at: new Date().toISOString() });
      } catch (e) {
        console.error(`Failed to sync ${key} to Supabase:`, e);
      }
    }

    if (db && key !== 'session') {
      try {
        await setDoc(doc(db, 'sync_data', key), {
          id: key,
          data: value,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.error(`Failed to sync ${key} to Firebase Firestore:`, e);
      }
    }
  }

  // Pull all tables from cloud to local storage
  async syncFromCloud(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    let synced = false;

    // Pull from Supabase
    if (supabaseUrl && supabaseAnonKey && supabase) {
      try {
        const { data, error } = await supabase
          .from('sync_data')
          .select('*');
        if (data && !error) {
          data.forEach((row: any) => {
            localStorage.setItem(`hetvi_db_${row.id}`, JSON.stringify(row.data));
          });
          synced = true;
        }
      } catch (e) {
        console.error("Failed to sync from Supabase:", e);
      }
    }

    // Pull from Firebase Firestore
    if (db) {
      try {
        const querySnapshot = await getDocs(collection(db, 'sync_data'));
        querySnapshot.forEach((docSnap) => {
          const docData = docSnap.data();
          if (docData && docData.data) {
            localStorage.setItem(`hetvi_db_${docSnap.id}`, JSON.stringify(docData.data));
          }
        });
        synced = true;
      } catch (e) {
        console.error("Failed to sync from Firebase Firestore:", e);
      }
    }

    return synced;
  }

  // Get active session profile
  getCurrentUser() {
    const session = this.getStorageItem<any>('session', null);
    if (!session) return null;
    return session;
  }

  // Generic helpers for mock CRUD
  getAll(table: string): any[] {
    const list = this.getStorageItem<any[]>(table, []);
    const isOld = list.some(p => p.name === 'Duo Rakhi Premium' || p.name === 'Regular Male Rakhi - Single' || p.name === 'Regular Female Rakhi - Single');
    if (table === 'products' && (list.length === 0 || isOld)) {
      const defaultProducts = [
        {
          id: 'p1',
          name: 'Male Rakhi Single - Regular',
          sku: 'HC-RAK-001',
          description: 'Handmade premium couple Rakhi set.',
          cost_price: 60,
          selling_price: 140,
          wholesale_price: 100,
          opening_stock: 50,
          current_stock: 12,
          min_stock: 10,
          unit: 'Piece',
          status: 'Active',
          created_at: new Date().toISOString()
        },
        {
          id: 'p2',
          name: 'Female Rakhi Single - Regular',
          sku: 'HC-RAK-002',
          description: 'Special religious themed Rakhi pack.',
          cost_price: 80,
          selling_price: 150,
          wholesale_price: 110,
          opening_stock: 30,
          current_stock: 2,
          min_stock: 5,
          unit: 'Piece',
          status: 'Active',
          created_at: new Date().toISOString()
        }
      ];
      // Save directly without triggering logging loop
      if (typeof window !== 'undefined') {
        localStorage.setItem('hetvi_db_products', JSON.stringify(defaultProducts));
      }
      return defaultProducts;
    }
    return list;
  }

  saveAll(table: string, data: any[]): void {
    this.setStorageItem(table, data);
    this.logAudit('write', table, null, `Batch updated ${table}`);
  }

  getById(table: string, id: string): any {
    const list = this.getAll(table);
    return list.find((item) => item.id === id) || null;
  }

  insert(table: string, item: any): any {
    const list = this.getAll(table);
    const newItem = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item
    };
    list.unshift(newItem);
    this.saveAll(table, list);
    this.logAudit('insert', table, newItem.id, `Created ${table} item`, null, newItem);
    return newItem;
  }

  update(table: string, id: string, updates: any): any {
    const list = this.getAll(table);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    
    const prev = { ...list[index] };
    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    this.saveAll(table, list);
    this.logAudit('update', table, id, `Updated ${table} item`, prev, updated);
    return updated;
  }

  delete(table: string, id: string): boolean {
    const list = this.getAll(table);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return false;
    
    const prev = list[index];
    list.splice(index, 1);
    this.saveAll(table, list);
    
    // Support soft-delete trash feature
    const trash = this.getStorageItem<any[]>('trash', []);
    trash.unshift({
      id: crypto.randomUUID(),
      original_table: table,
      original_id: id,
      data: prev,
      deleted_at: new Date().toISOString()
    });
    this.setStorageItem('trash', trash);
    
    this.logAudit('delete', table, id, `Moved ${table} to trash`, prev, null);
    return true;
  }

  // Audit Log helper
  logAudit(action: string, recordType: string, recordId: string | null, summary: string, prevObj?: any, newObj?: any) {
    if (typeof window === 'undefined') return;
    const logs = this.getStorageItem<any[]>('audit_logs', []);
    const user = this.getCurrentUser();
    logs.unshift({
      id: crypto.randomUUID(),
      user_id: user?.id || 'system',
      user_name: user?.name || 'System / Guest',
      action,
      record_type: recordType,
      record_id: recordId,
      summary,
      previous_state: prevObj ? JSON.stringify(prevObj) : null,
      new_state: newObj ? JSON.stringify(newObj) : null,
      created_at: new Date().toISOString()
    });
    this.setStorageItem('audit_logs', logs.slice(0, 1000)); // cap at 1000 items
  }
}

export const localDb = new LocalDbService();

// Real Supabase Client if env config is present, else falls back gracefully without crashing
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Determine if app runs in mock or real database mode
export const isMockMode = !supabaseUrl || !supabaseAnonKey;
