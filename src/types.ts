export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  productCount?: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: string; // e.g. 'pcs', 'kg', 'box'
  supplier: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalSpent: number;
  ordersCount: number;
  creditBalance: number;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage or fixed
  total: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'TRANSFER';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  cashierId: string;
  cashierName: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number; // e.g. 0.08 for 8%
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeGiven: number;
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  notes?: string;
  createdAt: string;
}

export type StockAdjustmentType = 'RESTOCK' | 'SALE' | 'DAMAGE' | 'RETURN' | 'AUDIT';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockAdjustmentType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export type AppView =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'categories'
  | 'customers'
  | 'sales_history'
  | 'reports'
  | 'stock'
  | 'users'
  | 'audit_logs'
  | 'java_architecture';

export type PermissionCategory =
  | 'POS & Sales'
  | 'Inventory & Catalog'
  | 'CRM & Customers'
  | 'Analytics & Reports'
  | 'System & Security';

export type PermissionKey =
  // Module View Access
  | 'viewDashboard'
  | 'viewPos'
  | 'viewProducts'
  | 'viewCategories'
  | 'viewStock'
  | 'viewCustomers'
  | 'viewSalesHistory'
  | 'viewReports'
  | 'viewUsers'
  | 'viewAuditLogs'
  // Granular Function Rules
  | 'posApplyDiscounts'
  | 'posCustomPrice'
  | 'productsCreateEdit'
  | 'productsDelete'
  | 'categoriesManage'
  | 'stockAdjust'
  | 'customersCreateEdit'
  | 'customersDelete'
  | 'reportsFinancials'
  | 'reportsExport'
  | 'usersManage'
  | 'rolesEditRules'
  | 'manageBackups';

export type RolePermissions = Record<PermissionKey, boolean>;

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  category: PermissionCategory;
  description: string;
  defaultAdmin: boolean;
  defaultManager: boolean;
  defaultCashier: boolean;
}

// -------------------------------------------------------------
// Authentication & Session History
// -------------------------------------------------------------
export type AuthActionType = 'LOGIN' | 'LOGOUT' | 'SWITCH_USER';
export type AuthStatus = 'SUCCESS' | 'FAILED';

export interface AuthLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  action: AuthActionType;
  status: AuthStatus;
  timestamp: string; // e.g. "2026-09-14 20:50"
  sessionDurationSeconds?: number;
  environment?: string; // e.g. "Local Session (Terminal 1)"
  details?: string;
}

// -------------------------------------------------------------
// System Audit Trail (Input / Output / Edit Functions)
// -------------------------------------------------------------
export type AuditCategory =
  | 'AUTH'
  | 'PRODUCTS'
  | 'CATEGORIES'
  | 'CUSTOMERS'
  | 'SALES'
  | 'INVENTORY'
  | 'SECURITY_RULES'
  | 'USERS'
  | 'BACKUP_RESTORE';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'USER_SWITCH'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'PRODUCT_IMAGE_UPDATE'
  | 'CATEGORY_CREATE'
  | 'CATEGORY_UPDATE'
  | 'CATEGORY_DELETE'
  | 'CUSTOMER_CREATE'
  | 'CUSTOMER_UPDATE'
  | 'CUSTOMER_DELETE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'ROLE_PERMISSIONS_UPDATE'
  | 'ROLE_PERMISSIONS_RESET'
  | 'SALE_CHECKOUT'
  | 'STOCK_ADJUSTMENT'
  | 'BACKUP_EXPORT'
  | 'BACKUP_RESTORE'
  | 'SNAPSHOT_CREATE'
  | 'SNAPSHOT_RESTORE'
  | 'DATA_RESET';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  category: AuditCategory;
  action: AuditAction;
  entityId?: string;
  entityName?: string;
  summary: string;
  details?: Record<string, any> | string;
}

// -------------------------------------------------------------
// System Backup & Restore Structures
// -------------------------------------------------------------
export interface SystemBackupData {
  version: string;
  exportedAt: string;
  exportedBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  app: {
    name: string;
    version: string;
  };
  stats: {
    usersCount: number;
    categoriesCount: number;
    productsCount: number;
    customersCount: number;
    salesCount: number;
    stockLogsCount: number;
    authLogsCount: number;
    auditLogsCount: number;
  };
  data: {
    users: User[];
    categories: Category[];
    products: Product[];
    customers: Customer[];
    sales: Sale[];
    stockLogs: StockLog[];
    rolePermissions: Record<UserRole, RolePermissions>;
    authLogs: AuthLog[];
    auditLogs: AuditLog[];
  };
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  reason: string;
  authorName: string;
  authorRole: UserRole;
  stats: {
    productsCount: number;
    salesCount: number;
    customersCount: number;
  };
  data: SystemBackupData['data'];
}
