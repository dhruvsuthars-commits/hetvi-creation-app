import { localDb } from './supabase';

export type UserPermission =
  | 'create_invoice'
  | 'edit_invoice'
  | 'view_invoice'
  | 'download_invoice'
  | 'record_payment'
  | 'manage_products'
  | 'adjust_stock'
  | 'view_reports'
  | 'manage_customers'
  | 'delete_records'
  | 'manage_settings';

// Default permissions mapping for Admin and Staff
const rolePermissions: Record<'ADMIN' | 'STAFF', UserPermission[]> = {
  ADMIN: [
    'create_invoice',
    'edit_invoice',
    'view_invoice',
    'download_invoice',
    'record_payment',
    'manage_products',
    'adjust_stock',
    'view_reports',
    'manage_customers',
    'delete_records',
    'manage_settings',
  ],
  STAFF: [
    'create_invoice',
    'view_invoice',
    'download_invoice',
    'record_payment',
    'manage_products',
    'view_reports',
    'manage_customers',
  ],
};

export function hasPermission(permission: UserPermission): boolean {
  if (typeof window === 'undefined') return false;
  
  const user = localDb.getCurrentUser() as any;
  if (!user) return false;
  
  const userRole = (user.role || 'STAFF') as 'ADMIN' | 'STAFF';
  
  // Staff custom permissions overriding configuration
  const customPermissions = localStorage.getItem(`hetvi_perms_staff`);
  if (userRole === 'STAFF' && customPermissions) {
    try {
      const allowed = JSON.parse(customPermissions) as UserPermission[];
      return allowed.includes(permission);
    } catch {
      // Fallback to defaults on error
    }
  }

  return rolePermissions[userRole]?.includes(permission) || false;
}

export function getStaffPermissions(): UserPermission[] {
  if (typeof window === 'undefined') return rolePermissions.STAFF;
  const customPermissions = localStorage.getItem(`hetvi_perms_staff`);
  if (customPermissions) {
    try {
      return JSON.parse(customPermissions);
    } catch {
      // Fallback
    }
  }
  return rolePermissions.STAFF;
}

export function saveStaffPermissions(permissions: UserPermission[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`hetvi_perms_staff`, JSON.stringify(permissions));
  localDb.logAudit('update', 'permissions', 'staff', 'Updated custom staff permissions');
}
