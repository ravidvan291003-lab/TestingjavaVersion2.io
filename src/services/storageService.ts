import {
  User,
  UserRole,
  Category,
  Product,
  Customer,
  Sale,
  StockLog,
  CartItem,
  PaymentMethod,
  RolePermissions,
  PermissionKey,
  AuthLog,
  AuthActionType,
  AuthStatus,
  AuditLog,
  AuditCategory,
  AuditAction,
  SystemBackupData,
  BackupSnapshot,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_STOCK_LOGS,
  INITIAL_AUTH_LOGS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/permissionRules';

const STORAGE_KEYS = {
  USERS: 'pos_users_v1',
  CURRENT_USER: 'pos_current_user_v1',
  CATEGORIES: 'pos_categories_v1',
  PRODUCTS: 'pos_products_v1',
  CUSTOMERS: 'pos_customers_v1',
  SALES: 'pos_sales_v1',
  STOCK_LOGS: 'pos_stock_logs_v1',
  SESSION_START: 'pos_session_start_v1',
  ROLE_PERMISSIONS: 'pos_role_permissions_v2',
  AUTH_LOGS: 'pos_auth_logs_v1',
  AUDIT_LOGS: 'pos_audit_logs_v1',
  SNAPSHOTS: 'pos_backup_snapshots_v1',
};

const permissionListeners = new Set<() => void>();

function notifyPermissionListeners() {
  permissionListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Permission listener error:', e);
    }
  });
}

function getStoredItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

function formatCurrentDateTime(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${date} ${time}`;
}

export const storageService = {
  // -------------------------------------------------------------
  // Session & Authentication
  // -------------------------------------------------------------
  getCurrentUser(): User {
    const user = getStoredItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!user) {
      // Default to Admin Alexandra Vance
      const defaultUser = INITIAL_USERS[0];
      setStoredItem(STORAGE_KEYS.CURRENT_USER, defaultUser);
      setStoredItem(STORAGE_KEYS.SESSION_START, new Date().toISOString());
      
      // Ensure initial login is recorded
      this.logAuth({
        userId: defaultUser.id,
        userName: defaultUser.name,
        userEmail: defaultUser.email,
        role: defaultUser.role,
        action: 'LOGIN',
        status: 'SUCCESS',
        details: 'Initial system admin session initialized.',
      });
      return defaultUser;
    }
    return user;
  },

  setCurrentUser(newUser: User, isExplicitLogin = false): void {
    const prevUser = getStoredItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    const prevStart = localStorage.getItem(STORAGE_KEYS.SESSION_START);
    
    // Calculate previous session duration if switching from a different user
    if (prevUser && prevUser.id !== newUser.id) {
      let durationSec = 0;
      if (prevStart) {
        durationSec = Math.max(0, Math.floor((Date.now() - new Date(prevStart).getTime()) / 1000));
      }

      this.logAuth({
        userId: prevUser.id,
        userName: prevUser.name,
        userEmail: prevUser.email,
        role: prevUser.role,
        action: isExplicitLogin ? 'LOGOUT' : 'SWITCH_USER',
        status: 'SUCCESS',
        sessionDurationSeconds: durationSec,
        details: isExplicitLogin
          ? `Logged out. Session lasted ${Math.floor(durationSec / 60)} minutes.`
          : `Switched active operator to ${newUser.name} (${newUser.role}).`,
      });

      this.logAudit({
        userId: prevUser.id,
        userName: prevUser.name,
        userRole: prevUser.role,
        category: 'AUTH',
        action: isExplicitLogin ? 'LOGOUT' : 'USER_SWITCH',
        entityId: newUser.id,
        entityName: newUser.name,
        summary: isExplicitLogin
          ? `User ${prevUser.name} (${prevUser.role}) logged out`
          : `Switched session from ${prevUser.name} to ${newUser.name} (${newUser.role})`,
        details: {
          previousUser: prevUser.name,
          newUser: newUser.name,
          sessionDurationMinutes: Math.floor(durationSec / 60),
        },
      });
    }

    // Set new current user and new session start
    setStoredItem(STORAGE_KEYS.CURRENT_USER, newUser);
    setStoredItem(STORAGE_KEYS.SESSION_START, new Date().toISOString());

    // Update user's lastLogin field in Users list
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === newUser.id);
    const loginTime = formatCurrentDateTime();
    if (userIndex >= 0) {
      users[userIndex].lastLogin = loginTime;
      setStoredItem(STORAGE_KEYS.USERS, users);
    }

    // Log the new login event
    this.logAuth({
      userId: newUser.id,
      userName: newUser.name,
      userEmail: newUser.email,
      role: newUser.role,
      action: 'LOGIN',
      status: 'SUCCESS',
      details: `Signed in as ${newUser.role}. Session started at ${loginTime}.`,
    });

    this.logAudit({
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      category: 'AUTH',
      action: 'LOGIN',
      entityId: newUser.id,
      entityName: newUser.name,
      summary: `User ${newUser.name} (${newUser.role}) signed into terminal`,
      details: {
        role: newUser.role,
        email: newUser.email,
        loginTime,
      },
    });
  },

  logout(): void {
    const currentUser = getStoredItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    const prevStart = localStorage.getItem(STORAGE_KEYS.SESSION_START);
    let durationSec = 0;
    if (prevStart) {
      durationSec = Math.max(0, Math.floor((Date.now() - new Date(prevStart).getTime()) / 1000));
    }

    if (currentUser) {
      this.logAuth({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        role: currentUser.role,
        action: 'LOGOUT',
        status: 'SUCCESS',
        sessionDurationSeconds: durationSec,
        details: `User explicitly signed out. Session lasted ${Math.floor(durationSec / 60)} minutes.`,
      });

      this.logAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        category: 'AUTH',
        action: 'LOGOUT',
        entityId: currentUser.id,
        entityName: currentUser.name,
        summary: `User ${currentUser.name} (${currentUser.role}) logged out`,
        details: {
          sessionDurationSeconds: durationSec,
          sessionDurationMinutes: Math.floor(durationSec / 60),
        },
      });
    }

    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
  },

  getSessionStart(): string {
    let start = localStorage.getItem(STORAGE_KEYS.SESSION_START);
    if (!start) {
      start = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.SESSION_START, start);
    }
    return start;
  },

  // -------------------------------------------------------------
  // Auth Logs (Login & Logout History)
  // -------------------------------------------------------------
  getAuthLogs(): AuthLog[] {
    return getStoredItem<AuthLog[]>(STORAGE_KEYS.AUTH_LOGS, INITIAL_AUTH_LOGS);
  },

  logAuth(params: {
    userId: string;
    userName: string;
    userEmail: string;
    role: UserRole;
    action: AuthActionType;
    status?: AuthStatus;
    sessionDurationSeconds?: number;
    environment?: string;
    details?: string;
  }): AuthLog {
    const logs = this.getAuthLogs();
    const newLog: AuthLog = {
      id: `auth-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      role: params.role,
      action: params.action,
      status: params.status || 'SUCCESS',
      timestamp: formatCurrentDateTime(),
      sessionDurationSeconds: params.sessionDurationSeconds,
      environment: params.environment || 'Terminal 01 • POS Workstation',
      details: params.details,
    };
    logs.unshift(newLog);
    // Keep max 500 auth logs
    if (logs.length > 500) logs.length = 500;
    setStoredItem(STORAGE_KEYS.AUTH_LOGS, logs);
    return newLog;
  },

  clearAuthLogs(): void {
    const current = this.getCurrentUser();
    this.logAudit({
      userId: current.id,
      userName: current.name,
      userRole: current.role,
      category: 'AUTH',
      action: 'DATA_RESET',
      summary: `Cleared historical login/logout session logs`,
    });
    setStoredItem(STORAGE_KEYS.AUTH_LOGS, []);
  },

  // -------------------------------------------------------------
  // System Audit Trail (Input / Output / Edit Function Logs)
  // -------------------------------------------------------------
  getAuditLogs(): AuditLog[] {
    return getStoredItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  logAudit(params: {
    userId?: string;
    userName?: string;
    userRole?: UserRole;
    category: AuditCategory;
    action: AuditAction;
    entityId?: string;
    entityName?: string;
    summary: string;
    details?: Record<string, any> | string;
  }): AuditLog {
    const logs = this.getAuditLogs();
    const current = getStoredItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);

    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formatCurrentDateTime(),
      userId: params.userId || current?.id || 'sys',
      userName: params.userName || current?.name || 'System Operator',
      userRole: params.userRole || current?.role || 'ADMIN',
      category: params.category,
      action: params.action,
      entityId: params.entityId,
      entityName: params.entityName,
      summary: params.summary,
      details: params.details,
    };

    logs.unshift(newLog);
    // Keep max 1000 audit logs
    if (logs.length > 1000) logs.length = 1000;
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, logs);
    return newLog;
  },

  clearAuditLogs(): void {
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  // -------------------------------------------------------------
  // Users Management
  // -------------------------------------------------------------
  getUsers(): User[] {
    return getStoredItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    const isEdit = index >= 0;

    if (isEdit) {
      const prev = users[index];
      users[index] = user;
      this.logAudit({
        category: 'USERS',
        action: 'USER_UPDATE',
        entityId: user.id,
        entityName: user.name,
        summary: `Updated staff user account: ${user.name} (${user.role})`,
        details: {
          id: user.id,
          name: user.name,
          role: user.role,
          status: user.status,
          previousRole: prev.role,
          previousStatus: prev.status,
        },
      });
    } else {
      users.push(user);
      this.logAudit({
        category: 'USERS',
        action: 'USER_CREATE',
        entityId: user.id,
        entityName: user.name,
        summary: `Created new staff account: ${user.name} (${user.role})`,
        details: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      });
    }
    setStoredItem(STORAGE_KEYS.USERS, users);
  },

  deleteUser(userId: string): void {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    const filtered = users.filter((u) => u.id !== userId);
    setStoredItem(STORAGE_KEYS.USERS, filtered);

    if (target) {
      this.logAudit({
        category: 'USERS',
        action: 'USER_DELETE',
        entityId: userId,
        entityName: target.name,
        summary: `Deleted staff member ${target.name} (${target.role})`,
        details: { id: userId, name: target.name, email: target.email, role: target.role },
      });
    }
  },

  // -------------------------------------------------------------
  // Categories Management
  // -------------------------------------------------------------
  getCategories(): Category[] {
    return getStoredItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  },

  saveCategory(cat: Category): void {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === cat.id);
    const isEdit = index >= 0;

    if (isEdit) {
      categories[index] = cat;
      this.logAudit({
        category: 'CATEGORIES',
        action: 'CATEGORY_UPDATE',
        entityId: cat.id,
        entityName: cat.name,
        summary: `Updated category "${cat.name}" (${cat.code})`,
        details: { id: cat.id, name: cat.name, code: cat.code, color: cat.color },
      });
    } else {
      categories.unshift(cat);
      this.logAudit({
        category: 'CATEGORIES',
        action: 'CATEGORY_CREATE',
        entityId: cat.id,
        entityName: cat.name,
        summary: `Created new department category "${cat.name}" (${cat.code})`,
        details: { id: cat.id, name: cat.name, code: cat.code, color: cat.color },
      });
    }
    setStoredItem(STORAGE_KEYS.CATEGORIES, categories);
  },

  deleteCategory(catId: string): void {
    const categories = this.getCategories();
    const target = categories.find((c) => c.id === catId);
    const filtered = categories.filter((c) => c.id !== catId);
    setStoredItem(STORAGE_KEYS.CATEGORIES, filtered);

    if (target) {
      this.logAudit({
        category: 'CATEGORIES',
        action: 'CATEGORY_DELETE',
        entityId: catId,
        entityName: target.name,
        summary: `Deleted category department "${target.name}" (${target.code})`,
        details: { id: catId, name: target.name, code: target.code },
      });
    }
  },

  // -------------------------------------------------------------
  // Products Management
  // -------------------------------------------------------------
  getProducts(): Product[] {
    const list = getStoredItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    let updated = false;
    const mapped = list.map((p) => {
      if (!p.imageUrl) {
        const match = INITIAL_PRODUCTS.find((init) => init.id === p.id);
        if (match?.imageUrl) {
          updated = true;
          return { ...p, imageUrl: match.imageUrl };
        }
      }
      return p;
    });
    if (updated) {
      setStoredItem(STORAGE_KEYS.PRODUCTS, mapped);
    }
    return mapped;
  },

  updateProductImage(prodId: string, imageUrl: string): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === prodId);
    if (index >= 0) {
      const prod = products[index];
      products[index] = {
        ...prod,
        imageUrl,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setStoredItem(STORAGE_KEYS.PRODUCTS, products);

      this.logAudit({
        category: 'PRODUCTS',
        action: 'PRODUCT_IMAGE_UPDATE',
        entityId: prod.id,
        entityName: prod.name,
        summary: `Updated product photo for "${prod.name}" (${prod.sku})`,
        details: { id: prod.id, sku: prod.sku, name: prod.name },
      });
    }
  },

  saveProduct(prod: Product): void {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === prod.id);
    const now = new Date().toISOString().split('T')[0];
    const isEdit = index >= 0;

    if (isEdit) {
      const prev = products[index];
      products[index] = { ...prod, updatedAt: now };
      
      const priceChanged = prev.sellingPrice !== prod.sellingPrice;
      const stockChanged = prev.stock !== prod.stock;
      const costChanged = prev.costPrice !== prod.costPrice;

      this.logAudit({
        category: 'PRODUCTS',
        action: 'PRODUCT_UPDATE',
        entityId: prod.id,
        entityName: prod.name,
        summary: `Updated product "${prod.name}" (SKU: ${prod.sku})` +
          (priceChanged ? ` • Price: $${prev.sellingPrice} -> $${prod.sellingPrice}` : '') +
          (stockChanged ? ` • Stock: ${prev.stock} -> ${prod.stock}` : ''),
        details: {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          changes: {
            price: priceChanged ? { prev: prev.sellingPrice, next: prod.sellingPrice } : undefined,
            cost: costChanged ? { prev: prev.costPrice, next: prod.costPrice } : undefined,
            stock: stockChanged ? { prev: prev.stock, next: prod.stock } : undefined,
          },
        },
      });
    } else {
      products.unshift({ ...prod, createdAt: now, updatedAt: now });
      this.logAudit({
        category: 'PRODUCTS',
        action: 'PRODUCT_CREATE',
        entityId: prod.id,
        entityName: prod.name,
        summary: `Created product "${prod.name}" (SKU: ${prod.sku}) @ $${prod.sellingPrice.toFixed(2)}`,
        details: {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          sellingPrice: prod.sellingPrice,
          costPrice: prod.costPrice,
          stock: prod.stock,
          unit: prod.unit,
        },
      });
    }
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  },

  deleteProduct(prodId: string): void {
    const products = this.getProducts();
    const target = products.find((p) => p.id === prodId);
    const filtered = products.filter((p) => p.id !== prodId);
    setStoredItem(STORAGE_KEYS.PRODUCTS, filtered);

    if (target) {
      this.logAudit({
        category: 'PRODUCTS',
        action: 'PRODUCT_DELETE',
        entityId: prodId,
        entityName: target.name,
        summary: `Deleted product "${target.name}" (SKU: ${target.sku})`,
        details: { id: prodId, name: target.name, sku: target.sku, finalStock: target.stock },
      });
    }
  },

  // -------------------------------------------------------------
  // Customers Management
  // -------------------------------------------------------------
  getCustomers(): Customer[] {
    return getStoredItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  },

  saveCustomer(cust: Customer): void {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === cust.id);
    const isEdit = index >= 0;

    if (isEdit) {
      customers[index] = cust;
      this.logAudit({
        category: 'CUSTOMERS',
        action: 'CUSTOMER_UPDATE',
        entityId: cust.id,
        entityName: cust.name,
        summary: `Updated customer profile: ${cust.name}`,
        details: { id: cust.id, name: cust.name, phone: cust.phone, email: cust.email },
      });
    } else {
      customers.unshift(cust);
      this.logAudit({
        category: 'CUSTOMERS',
        action: 'CUSTOMER_CREATE',
        entityId: cust.id,
        entityName: cust.name,
        summary: `Registered new customer: ${cust.name} (${cust.phone || 'No phone'})`,
        details: { id: cust.id, name: cust.name, phone: cust.phone, email: cust.email },
      });
    }
    setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
  },

  deleteCustomer(custId: string): void {
    const customers = this.getCustomers();
    const target = customers.find((c) => c.id === custId);
    const filtered = customers.filter((c) => c.id !== custId);
    setStoredItem(STORAGE_KEYS.CUSTOMERS, filtered);

    if (target) {
      this.logAudit({
        category: 'CUSTOMERS',
        action: 'CUSTOMER_DELETE',
        entityId: custId,
        entityName: target.name,
        summary: `Deleted customer record: ${target.name}`,
        details: { id: custId, name: target.name, totalSpent: target.totalSpent },
      });
    }
  },

  // -------------------------------------------------------------
  // Sales & POS Checkout (Input / Output)
  // -------------------------------------------------------------
  getSales(): Sale[] {
    return getStoredItem<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
  },

  createSale(params: {
    cart: CartItem[];
    customer?: Customer | null;
    paymentMethod: PaymentMethod;
    amountReceived: number;
    discountPercent?: number;
    taxRate?: number;
    notes?: string;
    cashier: User;
  }): Sale {
    const products = this.getProducts();
    const stockLogs = this.getStockLogs();
    const sales = this.getSales();
    const customers = this.getCustomers();

    const taxRate = params.taxRate ?? 0.08;
    const discountPercent = params.discountPercent ?? 0;

    let subtotal = 0;
    const saleItems = params.cart.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      subtotal += itemSubtotal;
      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        costPrice: item.product.costPrice,
        discount: item.discount,
        total: itemSubtotal,
      };
    });

    const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
    const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

    const amountReceived = params.amountReceived > 0 ? params.amountReceived : totalAmount;
    const changeGiven = Math.max(0, Number((amountReceived - totalAmount).toFixed(2)));

    // Generate Invoice Number: INV-YYYY-SEQ
    const nextSeq = 100 + sales.length + 1;
    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}-${String(nextSeq).padStart(4, '0')}`;
    const dateFormatted = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      customerId: params.customer?.id,
      customerName: params.customer ? params.customer.name : 'Walk-in Customer',
      customerPhone: params.customer?.phone,
      cashierId: params.cashier.id,
      cashierName: params.cashier.name,
      items: saleItems,
      subtotal: Number(subtotal.toFixed(2)),
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: params.paymentMethod,
      amountReceived,
      changeGiven,
      paymentStatus: 'PAID',
      notes: params.notes,
      createdAt: dateFormatted,
    };

    // 1. Deduct Stock & Append Stock Logs
    params.cart.forEach((cartItem) => {
      const prodIndex = products.findIndex((p) => p.id === cartItem.product.id);
      if (prodIndex >= 0) {
        const prevStock = products[prodIndex].stock;
        const newStock = Math.max(0, prevStock - cartItem.quantity);
        products[prodIndex].stock = newStock;

        stockLogs.unshift({
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: cartItem.product.id,
          productName: cartItem.product.name,
          sku: cartItem.product.sku,
          type: 'SALE',
          quantityChange: -cartItem.quantity,
          previousStock: prevStock,
          newStock,
          reason: `Sale ${invoiceNumber}`,
          userId: params.cashier.id,
          userName: params.cashier.name,
          createdAt: dateFormatted,
        });
      }
    });

    // 2. Update Customer Total Spent
    if (params.customer) {
      const custIndex = customers.findIndex((c) => c.id === params.customer?.id);
      if (custIndex >= 0) {
        customers[custIndex].totalSpent = Number((customers[custIndex].totalSpent + totalAmount).toFixed(2));
        customers[custIndex].ordersCount += 1;
        setStoredItem(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    // 3. Save updated collections
    sales.unshift(newSale);
    setStoredItem(STORAGE_KEYS.SALES, sales);
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    setStoredItem(STORAGE_KEYS.STOCK_LOGS, stockLogs);

    // 4. Audit Log the POS checkout transaction (Input -> Output)
    this.logAudit({
      userId: params.cashier.id,
      userName: params.cashier.name,
      userRole: params.cashier.role,
      category: 'SALES',
      action: 'SALE_CHECKOUT',
      entityId: newSale.invoiceNumber,
      entityName: `Invoice ${newSale.invoiceNumber}`,
      summary: `Completed sale checkout ${newSale.invoiceNumber} ($${totalAmount.toFixed(2)}, ${params.paymentMethod}) for ${newSale.customerName}`,
      details: {
        invoiceNumber,
        customerName: newSale.customerName,
        paymentMethod: params.paymentMethod,
        itemsCount: saleItems.length,
        items: saleItems.map((i) => `${i.productName} x${i.quantity} ($${i.total.toFixed(2)})`),
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        amountReceived,
        changeGiven,
      },
    });

    return newSale;
  },

  // -------------------------------------------------------------
  // Stock Inventory & Movement Logs
  // -------------------------------------------------------------
  getStockLogs(): StockLog[] {
    return getStoredItem<StockLog[]>(STORAGE_KEYS.STOCK_LOGS, INITIAL_STOCK_LOGS);
  },

  adjustStock(params: {
    productId: string;
    type: 'RESTOCK' | 'DAMAGE' | 'RETURN' | 'AUDIT';
    quantityChange: number;
    reason: string;
    user: User;
  }): void {
    const products = this.getProducts();
    const stockLogs = this.getStockLogs();
    const prodIndex = products.findIndex((p) => p.id === params.productId);
    if (prodIndex < 0) return;

    const target = products[prodIndex];
    const prevStock = target.stock;
    const newStock = Math.max(0, prevStock + params.quantityChange);
    target.stock = newStock;

    const now = new Date();
    const dateFormatted = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newLog: StockLog = {
      id: `log-${Date.now()}`,
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      type: params.type,
      quantityChange: params.quantityChange,
      previousStock: prevStock,
      newStock,
      reason: params.reason,
      userId: params.user.id,
      userName: params.user.name,
      createdAt: dateFormatted,
    };

    stockLogs.unshift(newLog);
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
    setStoredItem(STORAGE_KEYS.STOCK_LOGS, stockLogs);

    // Audit Log stock movement
    this.logAudit({
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      category: 'INVENTORY',
      action: 'STOCK_ADJUSTMENT',
      entityId: target.id,
      entityName: target.name,
      summary: `Stock ${params.type}: ${params.quantityChange > 0 ? '+' : ''}${params.quantityChange} units of "${target.name}" (${prevStock} -> ${newStock})`,
      details: {
        sku: target.sku,
        type: params.type,
        quantityChange: params.quantityChange,
        previousStock: prevStock,
        newStock,
        reason: params.reason,
      },
    });
  },

  // -------------------------------------------------------------
  // Role Permissions & Function Rules
  // -------------------------------------------------------------
  getRolePermissions(): Record<UserRole, RolePermissions> {
    const stored = getStoredItem<Record<UserRole, RolePermissions> | null>(STORAGE_KEYS.ROLE_PERMISSIONS, null);
    if (!stored) {
      return {
        ADMIN: { ...DEFAULT_ROLE_PERMISSIONS.ADMIN },
        MANAGER: { ...DEFAULT_ROLE_PERMISSIONS.MANAGER },
        CASHIER: { ...DEFAULT_ROLE_PERMISSIONS.CASHIER },
      };
    }
    return {
      ADMIN: { ...DEFAULT_ROLE_PERMISSIONS.ADMIN, ...stored.ADMIN },
      MANAGER: { ...DEFAULT_ROLE_PERMISSIONS.MANAGER, ...stored.MANAGER },
      CASHIER: { ...DEFAULT_ROLE_PERMISSIONS.CASHIER, ...stored.CASHIER },
    };
  },

  saveRolePermissions(role: UserRole, permissions: Partial<RolePermissions>): void {
    const current = this.getRolePermissions();
    current[role] = {
      ...current[role],
      ...permissions,
    };
    setStoredItem(STORAGE_KEYS.ROLE_PERMISSIONS, current);
    notifyPermissionListeners();

    const currentUser = this.getCurrentUser();
    this.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'SECURITY_RULES',
      action: 'ROLE_PERMISSIONS_UPDATE',
      entityId: role,
      entityName: `${role} Operational Rules`,
      summary: `Updated permission rules for ${role} role`,
      details: {
        role,
        changedPermissions: permissions,
        updatedBy: `${currentUser.name} (${currentUser.role})`,
      },
    });
  },

  saveAllRolePermissions(all: Record<UserRole, RolePermissions>): void {
    setStoredItem(STORAGE_KEYS.ROLE_PERMISSIONS, all);
    notifyPermissionListeners();

    const currentUser = this.getCurrentUser();
    this.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'SECURITY_RULES',
      action: 'ROLE_PERMISSIONS_UPDATE',
      summary: `Batch updated all role permissions (Admin, Manager, Cashier)`,
    });
  },

  resetRolePermissions(): Record<UserRole, RolePermissions> {
    const defaults = {
      ADMIN: { ...DEFAULT_ROLE_PERMISSIONS.ADMIN },
      MANAGER: { ...DEFAULT_ROLE_PERMISSIONS.MANAGER },
      CASHIER: { ...DEFAULT_ROLE_PERMISSIONS.CASHIER },
    };
    setStoredItem(STORAGE_KEYS.ROLE_PERMISSIONS, defaults);
    notifyPermissionListeners();

    const currentUser = this.getCurrentUser();
    this.logAudit({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      category: 'SECURITY_RULES',
      action: 'ROLE_PERMISSIONS_RESET',
      summary: `Reset all role permissions to factory baseline defaults`,
    });

    return defaults;
  },

  hasPermission(userOrRole: User | UserRole | null | undefined, key: PermissionKey): boolean {
    if (!userOrRole) return false;
    const role: UserRole = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
    if (role === 'ADMIN') {
      return true;
    }
    const all = this.getRolePermissions();
    const roleRules = all[role];
    if (!roleRules) return false;
    return Boolean(roleRules[key]);
  },

  onPermissionsChange(listener: () => void): () => void {
    permissionListeners.add(listener);
    return () => {
      permissionListeners.delete(listener);
    };
  },

  // -------------------------------------------------------------
  // System Backup & Disaster Recovery Center
  // -------------------------------------------------------------
  exportBackup(author?: User): SystemBackupData {
    const activeAuthor = author || this.getCurrentUser();
    const users = this.getUsers();
    const categories = this.getCategories();
    const products = this.getProducts();
    const customers = this.getCustomers();
    const sales = this.getSales();
    const stockLogs = this.getStockLogs();
    const rolePermissions = this.getRolePermissions();
    const authLogs = this.getAuthLogs();
    const auditLogs = this.getAuditLogs();

    const backupData: SystemBackupData = {
      version: '2.0.0',
      exportedAt: formatCurrentDateTime(),
      exportedBy: {
        id: activeAuthor.id,
        name: activeAuthor.name,
        email: activeAuthor.email,
        role: activeAuthor.role,
      },
      app: {
        name: 'ApexPOS & Inventory Enterprise',
        version: '2.0-PROD',
      },
      stats: {
        usersCount: users.length,
        categoriesCount: categories.length,
        productsCount: products.length,
        customersCount: customers.length,
        salesCount: sales.length,
        stockLogsCount: stockLogs.length,
        authLogsCount: authLogs.length,
        auditLogsCount: auditLogs.length,
      },
      data: {
        users,
        categories,
        products,
        customers,
        sales,
        stockLogs,
        rolePermissions,
        authLogs,
        auditLogs,
      },
    };

    // Also auto-save a local snapshot recovery point
    this.createLocalSnapshot(`Manual export by ${activeAuthor.name}`, activeAuthor);

    // Audit log this export
    this.logAudit({
      userId: activeAuthor.id,
      userName: activeAuthor.name,
      userRole: activeAuthor.role,
      category: 'BACKUP_RESTORE',
      action: 'BACKUP_EXPORT',
      summary: `Full system database backup exported (${products.length} products, ${sales.length} sales, ${customers.length} customers)`,
      details: backupData.stats,
    });

    return backupData;
  },

  downloadBackupFile(author?: User): void {
    const backup = this.exportBackup(author);
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    link.href = url;
    link.download = `ApexPOS_Database_Backup_${dateStr}_${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  restoreBackup(
    backupData: SystemBackupData,
    author?: User
  ): { success: boolean; message: string; restoredCounts?: any } {
    const activeAuthor = author || this.getCurrentUser();

    // 1. Validation
    if (!backupData || !backupData.data) {
      return { success: false, message: 'Invalid backup file format: Missing "data" payload.' };
    }

    const { data } = backupData;
    if (!Array.isArray(data.products) || !Array.isArray(data.sales)) {
      return { success: false, message: 'Invalid backup file structure: Missing products or sales collections.' };
    }

    // 2. Take emergency safety rollback snapshot before overwriting
    this.createLocalSnapshot(`Auto safety snapshot before restore`, activeAuthor);

    // 3. Apply Restores
    if (data.users && Array.isArray(data.users)) setStoredItem(STORAGE_KEYS.USERS, data.users);
    if (data.categories && Array.isArray(data.categories)) setStoredItem(STORAGE_KEYS.CATEGORIES, data.categories);
    if (data.products && Array.isArray(data.products)) setStoredItem(STORAGE_KEYS.PRODUCTS, data.products);
    if (data.customers && Array.isArray(data.customers)) setStoredItem(STORAGE_KEYS.CUSTOMERS, data.customers);
    if (data.sales && Array.isArray(data.sales)) setStoredItem(STORAGE_KEYS.SALES, data.sales);
    if (data.stockLogs && Array.isArray(data.stockLogs)) setStoredItem(STORAGE_KEYS.STOCK_LOGS, data.stockLogs);
    if (data.rolePermissions) setStoredItem(STORAGE_KEYS.ROLE_PERMISSIONS, data.rolePermissions);
    if (data.authLogs && Array.isArray(data.authLogs)) setStoredItem(STORAGE_KEYS.AUTH_LOGS, data.authLogs);
    if (data.auditLogs && Array.isArray(data.auditLogs)) setStoredItem(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);

    notifyPermissionListeners();

    // 4. Log the restore in the newly restored audit logs
    this.logAudit({
      userId: activeAuthor.id,
      userName: activeAuthor.name,
      userRole: activeAuthor.role,
      category: 'BACKUP_RESTORE',
      action: 'BACKUP_RESTORE',
      summary: `System database restored from archive created on ${backupData.exportedAt || 'unknown date'}`,
      details: {
        exportedBy: backupData.exportedBy,
        productsCount: data.products.length,
        salesCount: data.sales.length,
        customersCount: data.customers?.length || 0,
      },
    });

    return {
      success: true,
      message: 'Database successfully restored and synchronized.',
      restoredCounts: {
        products: data.products.length,
        sales: data.sales.length,
        customers: data.customers?.length || 0,
        categories: data.categories?.length || 0,
        users: data.users?.length || 0,
      },
    };
  },

  // -------------------------------------------------------------
  // Local Automatic Recovery Snapshots
  // -------------------------------------------------------------
  getBackupSnapshots(): BackupSnapshot[] {
    return getStoredItem<BackupSnapshot[]>(STORAGE_KEYS.SNAPSHOTS, []);
  },

  createLocalSnapshot(reason: string, author?: User): BackupSnapshot {
    const activeAuthor = author || this.getCurrentUser();
    const snapshots = this.getBackupSnapshots();
    const products = this.getProducts();
    const sales = this.getSales();
    const customers = this.getCustomers();

    const snapshot: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: formatCurrentDateTime(),
      reason,
      authorName: activeAuthor.name,
      authorRole: activeAuthor.role,
      stats: {
        productsCount: products.length,
        salesCount: sales.length,
        customersCount: customers.length,
      },
      data: {
        users: this.getUsers(),
        categories: this.getCategories(),
        products,
        customers,
        sales,
        stockLogs: this.getStockLogs(),
        rolePermissions: this.getRolePermissions(),
        authLogs: this.getAuthLogs(),
        auditLogs: this.getAuditLogs(),
      },
    };

    snapshots.unshift(snapshot);
    // Keep max 8 local snapshots to conserve localStorage space
    if (snapshots.length > 8) snapshots.length = 8;
    setStoredItem(STORAGE_KEYS.SNAPSHOTS, snapshots);

    return snapshot;
  },

  restoreSnapshot(snapshotId: string, author?: User): boolean {
    const snapshots = this.getBackupSnapshots();
    const target = snapshots.find((s) => s.id === snapshotId);
    if (!target) return false;

    const activeAuthor = author || this.getCurrentUser();
    const { data } = target;

    // Apply snapshot state
    setStoredItem(STORAGE_KEYS.USERS, data.users);
    setStoredItem(STORAGE_KEYS.CATEGORIES, data.categories);
    setStoredItem(STORAGE_KEYS.PRODUCTS, data.products);
    setStoredItem(STORAGE_KEYS.CUSTOMERS, data.customers);
    setStoredItem(STORAGE_KEYS.SALES, data.sales);
    setStoredItem(STORAGE_KEYS.STOCK_LOGS, data.stockLogs);
    setStoredItem(STORAGE_KEYS.ROLE_PERMISSIONS, data.rolePermissions);
    setStoredItem(STORAGE_KEYS.AUTH_LOGS, data.authLogs);
    setStoredItem(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);

    notifyPermissionListeners();

    this.logAudit({
      userId: activeAuthor.id,
      userName: activeAuthor.name,
      userRole: activeAuthor.role,
      category: 'BACKUP_RESTORE',
      action: 'SNAPSHOT_RESTORE',
      entityId: target.id,
      entityName: target.reason,
      summary: `Rolled back to recovery snapshot "${target.reason}" (${target.timestamp})`,
      details: target.stats,
    });

    return true;
  },

  deleteSnapshot(snapshotId: string): void {
    const snapshots = this.getBackupSnapshots().filter((s) => s.id !== snapshotId);
    setStoredItem(STORAGE_KEYS.SNAPSHOTS, snapshots);
  },

  // -------------------------------------------------------------
  // CSV Export Utility for Individual Tables
  // -------------------------------------------------------------
  exportTableToCsv(
    tableName: 'products' | 'sales' | 'customers' | 'stock' | 'auth_logs' | 'audit_logs'
  ): void {
    let rows: string[][] = [];
    let filename = `ApexPOS_${tableName}_${new Date().toISOString().split('T')[0]}.csv`;

    if (tableName === 'auth_logs') {
      const logs = this.getAuthLogs();
      rows.push(['ID', 'Timestamp', 'Operator Name', 'Email', 'Role', 'Action', 'Status', 'Session Duration (sec)', 'Environment', 'Details']);
      logs.forEach((l) => {
        rows.push([
          l.id,
          l.timestamp,
          `"${l.userName}"`,
          l.userEmail,
          l.role,
          l.action,
          l.status,
          String(l.sessionDurationSeconds || 0),
          `"${l.environment || ''}"`,
          `"${(l.details || '').replace(/"/g, '""')}"`,
        ]);
      });
    } else if (tableName === 'audit_logs') {
      const logs = this.getAuditLogs();
      rows.push(['ID', 'Timestamp', 'Operator', 'Role', 'Category', 'Action', 'Entity', 'Summary']);
      logs.forEach((l) => {
        rows.push([
          l.id,
          l.timestamp,
          `"${l.userName}"`,
          l.userRole,
          l.category,
          l.action,
          `"${l.entityName || ''}"`,
          `"${l.summary.replace(/"/g, '""')}"`,
        ]);
      });
    } else if (tableName === 'products') {
      const products = this.getProducts();
      rows.push(['ID', 'SKU', 'Barcode', 'Name', 'Cost Price', 'Selling Price', 'Stock', 'Unit', 'Supplier']);
      products.forEach((p) => {
        rows.push([
          p.id,
          p.sku,
          p.barcode,
          `"${p.name.replace(/"/g, '""')}"`,
          p.costPrice.toFixed(2),
          p.sellingPrice.toFixed(2),
          String(p.stock),
          p.unit,
          `"${p.supplier.replace(/"/g, '""')}"`,
        ]);
      });
    } else if (tableName === 'sales') {
      const sales = this.getSales();
      rows.push(['Invoice Number', 'Date', 'Customer', 'Cashier', 'Payment Method', 'Items Count', 'Subtotal', 'Tax', 'Total']);
      sales.forEach((s) => {
        rows.push([
          s.invoiceNumber,
          s.createdAt,
          `"${s.customerName}"`,
          `"${s.cashierName}"`,
          s.paymentMethod,
          String(s.items.length),
          s.subtotal.toFixed(2),
          s.taxAmount.toFixed(2),
          s.totalAmount.toFixed(2),
        ]);
      });
    } else if (tableName === 'customers') {
      const customers = this.getCustomers();
      rows.push(['ID', 'Name', 'Email', 'Phone', 'Orders Count', 'Total Spent', 'Registered At']);
      customers.forEach((c) => {
        rows.push([
          c.id,
          `"${c.name}"`,
          c.email,
          c.phone,
          String(c.ordersCount),
          c.totalSpent.toFixed(2),
          c.createdAt,
        ]);
      });
    } else if (tableName === 'stock') {
      const logs = this.getStockLogs();
      rows.push(['Log ID', 'Date', 'Product', 'SKU', 'Type', 'Quantity Change', 'Previous Stock', 'New Stock', 'Reason', 'Operator']);
      logs.forEach((l) => {
        rows.push([
          l.id,
          l.createdAt,
          `"${l.productName}"`,
          l.sku,
          l.type,
          String(l.quantityChange),
          String(l.previousStock),
          String(l.newStock),
          `"${l.reason.replace(/"/g, '""')}"`,
          `"${l.userName}"`,
        ]);
      });
    }

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // -------------------------------------------------------------
  // Factory Reset
  // -------------------------------------------------------------
  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
    localStorage.removeItem(STORAGE_KEYS.ROLE_PERMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.AUTH_LOGS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.SNAPSHOTS);
    notifyPermissionListeners();
  },
};
