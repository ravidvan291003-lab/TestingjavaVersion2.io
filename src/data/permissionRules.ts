import { UserRole, PermissionDefinition, RolePermissions, PermissionKey } from '../types';

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // POS & Sales
  {
    key: 'viewPos',
    label: 'POS Checkout Terminal',
    category: 'POS & Sales',
    description: 'Launch cash register terminal, scan barcodes, and process customer checkouts',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: true,
  },
  {
    key: 'posApplyDiscounts',
    label: 'Apply Sale Discounts',
    category: 'POS & Sales',
    description: 'Apply percentage or fixed dollar discounts on invoice totals at checkout',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: true,
  },
  {
    key: 'posCustomPrice',
    label: 'Manual Price Override',
    category: 'POS & Sales',
    description: 'Override standard selling prices and input manual customer pricing on items',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'viewSalesHistory',
    label: 'Sales History & Invoices',
    category: 'POS & Sales',
    description: 'Search sales orders, view itemized breakdown, and reprint thermal invoices',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: true,
  },

  // Inventory & Catalog
  {
    key: 'viewProducts',
    label: 'View Product Catalog',
    category: 'Inventory & Catalog',
    description: 'Browse product listings, photos, pricing, barcodes, and supplier details',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: true,
  },
  {
    key: 'productsCreateEdit',
    label: 'Create & Edit Products',
    category: 'Inventory & Catalog',
    description: 'Add new products, change selling prices, update photos, and modify SKU barcodes',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'productsDelete',
    label: 'Delete & Archive Products',
    category: 'Inventory & Catalog',
    description: 'Permanently remove obsolete products or inventory records from the catalog',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'viewCategories',
    label: 'View Categories',
    category: 'Inventory & Catalog',
    description: 'Access category taxonomy department lists and product count distribution',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'categoriesManage',
    label: 'Manage Categories (CRUD)',
    category: 'Inventory & Catalog',
    description: 'Create new categories, edit department tags and color palettes, and delete unused categories',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'viewStock',
    label: 'View Stock Inventory',
    category: 'Inventory & Catalog',
    description: 'Access stock management view, monitor low-stock warnings, and view audit history logs',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'stockAdjust',
    label: 'Execute Stock Adjustments',
    category: 'Inventory & Catalog',
    description: 'Perform stock replenishments, record damaged items write-offs, and conduct audits',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },

  // CRM & Customers
  {
    key: 'viewCustomers',
    label: 'View Customer Directory',
    category: 'CRM & Customers',
    description: 'Browse registered customers, phone directory, and accumulated purchase statistics',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: true,
  },
  {
    key: 'customersCreateEdit',
    label: 'Create & Edit Customers',
    category: 'CRM & Customers',
    description: 'Register walk-in patrons into the customer CRM and modify phone/address records',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: true,
  },
  {
    key: 'customersDelete',
    label: 'Delete Customer Records',
    category: 'CRM & Customers',
    description: 'Remove customer profiles and associated historical tracking data',
    defaultAdmin: true,
    defaultManager: false,
    defaultCashier: false,
  },

  // Analytics & Reports
  {
    key: 'viewReports',
    label: 'Access Reports Dashboard',
    category: 'Analytics & Reports',
    description: 'View sales velocity charts, payment method breakdown, and top selling products',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'reportsFinancials',
    label: 'Financial Margins & Cost Data',
    category: 'Analytics & Reports',
    description: 'Inspect confidential product cost prices, gross profit margins, and net revenue',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'reportsExport',
    label: 'Export Data Spreadsheets',
    category: 'Analytics & Reports',
    description: 'Download CSV reports of sales, inventory valuations, and customer databases',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },

  // System & Security
  {
    key: 'viewDashboard',
    label: 'Executive KPI Dashboard',
    category: 'System & Security',
    description: 'View global revenue, order count, transaction stats, and store performance trends',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'viewUsers',
    label: 'User Management & Roles View',
    category: 'System & Security',
    description: 'Access staff directory, session controls, and authorization matrix',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'viewAuditLogs',
    label: 'View Audit & Login History',
    category: 'System & Security',
    description: 'Inspect session logins/logouts, track operational audit changes, and view input/output history',
    defaultAdmin: true,
    defaultManager: true,
    defaultCashier: false,
  },
  {
    key: 'manageBackups',
    label: 'Database Backup & Restore',
    category: 'System & Security',
    description: 'Export system snapshots, restore database from JSON archive, and manage rollback points',
    defaultAdmin: true,
    defaultManager: false,
    defaultCashier: false,
  },
  {
    key: 'usersManage',
    label: 'Create & Edit Staff Accounts',
    category: 'System & Security',
    description: 'Add new staff members, update login email/phone, and activate/deactivate accounts',
    defaultAdmin: true,
    defaultManager: false,
    defaultCashier: false,
  },
  {
    key: 'rolesEditRules',
    label: 'Edit Role Rules & Permissions',
    category: 'System & Security',
    description: 'Configure and toggle operational rules and function permissions for Manager and Cashier',
    defaultAdmin: true,
    defaultManager: false,
    defaultCashier: false,
  },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: PERMISSION_DEFINITIONS.reduce((acc, p) => {
    acc[p.key] = p.defaultAdmin;
    return acc;
  }, {} as RolePermissions),

  MANAGER: PERMISSION_DEFINITIONS.reduce((acc, p) => {
    acc[p.key] = p.defaultManager;
    return acc;
  }, {} as RolePermissions),

  CASHIER: PERMISSION_DEFINITIONS.reduce((acc, p) => {
    acc[p.key] = p.defaultCashier;
    return acc;
  }, {} as RolePermissions),
};

export interface RolePreset {
  id: string;
  name: string;
  description: string;
  role: 'MANAGER' | 'CASHIER';
  permissions: Partial<RolePermissions>;
}

export const ROLE_PRESETS: RolePreset[] = [
  // Manager Presets
  {
    id: 'manager-standard',
    name: 'Standard Store Manager',
    description: 'Full store operations: inventory CRUD, stock adjustments, discounts, and reports',
    role: 'MANAGER',
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.MANAGER },
  },
  {
    id: 'manager-inventory',
    name: 'Inventory Specialist Manager',
    description: 'Focused on catalog, stock replenishment, categories, and inventory valuations',
    role: 'MANAGER',
    permissions: {
      ...DEFAULT_ROLE_PERMISSIONS.MANAGER,
      viewUsers: false,
      usersManage: false,
      rolesEditRules: false,
      customersDelete: false,
    },
  },
  {
    id: 'manager-supervisor',
    name: 'Shift Supervisor (Elevated)',
    description: 'Can manage user accounts and configure cashier rules during shift transitions',
    role: 'MANAGER',
    permissions: {
      ...DEFAULT_ROLE_PERMISSIONS.MANAGER,
      usersManage: true,
      rolesEditRules: true,
      customersDelete: true,
    },
  },

  // Cashier Presets
  {
    id: 'cashier-standard',
    name: 'Standard POS Cashier',
    description: 'Fast retail checkout, customer lookups, order history, and standard discounts',
    role: 'CASHIER',
    permissions: { ...DEFAULT_ROLE_PERMISSIONS.CASHIER },
  },
  {
    id: 'cashier-trusted',
    name: 'Senior / Trusted Cashier',
    description: 'Can check stock quantities, catalog details, and categories without editing',
    role: 'CASHIER',
    permissions: {
      ...DEFAULT_ROLE_PERMISSIONS.CASHIER,
      viewStock: true,
      viewCategories: true,
      posCustomPrice: true,
      viewDashboard: true,
    },
  },
  {
    id: 'cashier-inventory-assistant',
    name: 'Cashier & Inventory Assistant',
    description: 'Empowered to assist with stock replenishments and adding new catalog items',
    role: 'CASHIER',
    permissions: {
      ...DEFAULT_ROLE_PERMISSIONS.CASHIER,
      viewStock: true,
      stockAdjust: true,
      viewCategories: true,
      productsCreateEdit: true,
    },
  },
  {
    id: 'cashier-strict',
    name: 'Strict / High-Security Cashier',
    description: 'Strict POS terminal checkout only. No manual discounts or customer modifications',
    role: 'CASHIER',
    permissions: {
      viewDashboard: false,
      viewPos: true,
      viewProducts: true,
      viewCategories: false,
      viewStock: false,
      viewCustomers: true,
      viewSalesHistory: true,
      viewReports: false,
      viewUsers: false,
      posApplyDiscounts: false,
      posCustomPrice: false,
      productsCreateEdit: false,
      productsDelete: false,
      categoriesManage: false,
      stockAdjust: false,
      customersCreateEdit: false,
      customersDelete: false,
      reportsFinancials: false,
      reportsExport: false,
      usersManage: false,
      rolesEditRules: false,
    },
  },
];
