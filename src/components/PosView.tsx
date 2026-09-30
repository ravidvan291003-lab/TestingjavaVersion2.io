import React, { useState, useMemo } from 'react';
import { Product, Category, Customer, CartItem, PaymentMethod, User, Sale } from '../types';
import { storageService } from '../services/storageService';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  UserPlus,
  AlertTriangle,
  Receipt,
  X,
  Sparkles,
} from 'lucide-react';

interface PosViewProps {
  currentUser: User;
  onSaleCompleted: (sale: Sale) => void;
}

export const PosView: React.FC<PosViewProps> = ({ currentUser, onSaleCompleted }) => {
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [categories] = useState<Category[]>(() => storageService.getCategories());
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Dynamic Rule Permissions
  const canApplyDiscounts = storageService.hasPermission(currentUser, 'posApplyDiscounts');

  // Quick Add Customer modal
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Refresh data
  const refreshProducts = () => {
    setProducts(storageService.getProducts());
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart math
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Number(((subtotal * discountPercent) / 100).toFixed(2));
  }, [subtotal, discountPercent]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = 0.08;
  const taxAmount = Number((taxableAmount * taxRate).toFixed(2));
  const totalAmount = Number((taxableAmount + taxAmount).toFixed(2));

  const changeDue = useMemo(() => {
    const received = parseFloat(amountReceived);
    if (isNaN(received) || received <= totalAmount) return 0;
    return Number((received - totalAmount).toFixed(2));
  }, [amountReceived, totalAmount]);

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.sellingPrice,
            discount: 0,
            total: product.sellingPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item; // limit to stock
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountReceived('');
    setDiscountPercent(0);
    setSaleNotes('');
  };

  // Barcode / SKU quick scan enter key
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const exactMatch = products.find(
        (p) =>
          p.barcode.toLowerCase() === searchQuery.trim().toLowerCase() ||
          p.sku.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch && exactMatch.stock > 0) {
        addToCart(exactMatch);
        setSearchQuery('');
      }
    }
  };

  // Complete checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const selectedCust = customers.find((c) => c.id === selectedCustomerId) || null;
    const receivedNum = parseFloat(amountReceived) || totalAmount;

    if (paymentMethod === 'CASH' && receivedNum < totalAmount) {
      alert(`Received amount ($${receivedNum.toFixed(2)}) is less than total due ($${totalAmount.toFixed(2)})`);
      return;
    }

    const sale = storageService.createSale({
      cart,
      customer: selectedCust,
      paymentMethod,
      amountReceived: paymentMethod === 'CASH' ? receivedNum : totalAmount,
      discountPercent,
      taxRate,
      notes: saleNotes,
      cashier: currentUser,
    });

    clearCart();
    refreshProducts();
    setCustomers(storageService.getCustomers());
    onSaleCompleted(sale);
  };

  // Quick Customer Create
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim() || 'customer@store.local',
      totalSpent: 0,
      ordersCount: 0,
      creditBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    storageService.saveCustomer(newCust);
    setCustomers(storageService.getCustomers());
    setSelectedCustomerId(newCust.id);
    setIsAddingCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  return (
    <div id="pos-terminal" className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-100">
      {/* Left Column: Catalog & Products */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200">
        {/* Search & Category Filter Header */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="pos-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search products by name, SKU, or scan Barcode (Press Enter)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-xs text-slate-500 whitespace-nowrap hidden sm:block">
              <span className="font-semibold text-slate-800">{filteredProducts.length}</span> items
            </div>
          </div>

          {/* Categories Pill Bar */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-400 mt-1">Try another search term or select All Items</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                const cartQty = cart.find((i) => i.product.id === product.id)?.quantity || 0;

                return (
                  <button
                    key={product.id}
                    id={`pos-product-${product.sku}`}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`text-left p-3.5 rounded-xl border bg-white flex flex-col justify-between transition-all relative group ${
                      isOutOfStock
                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : 'border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Product Photo Thumbnail */}
                    <div className="w-full aspect-square mb-2 rounded-lg bg-slate-100 overflow-hidden relative border border-slate-100 flex items-center justify-center">
                      <img
                        src={product.imageUrl || '/images/products/default_product.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/products/default_product.svg';
                        }}
                      />
                      {cartQty > 0 && (
                        <span className="absolute top-1.5 right-1.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-md">
                          {cartQty} in cart
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-0.5">
                        <span>{product.sku}</span>
                      </div>
                      <h3 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">${product.sellingPrice.toFixed(2)}</span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                          isOutOfStock
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : isLowStock
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isOutOfStock ? 'Sold out' : `${product.stock} ${product.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Interactive Cart & Checkout Terminal */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col h-full shadow-lg border-l border-slate-200">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-900">Current Sale</span>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline flex items-center"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-200 flex items-center space-x-2">
          <div className="flex-1">
            <select
              id="pos-customer-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-indigo-600"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setIsAddingCustomer(true)}
            title="Register New Customer"
            className="p-1.5 bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <ShoppingCart className="w-10 h-10 stroke-1 text-slate-300 mb-2" />
              <p className="text-xs font-medium text-slate-600">Cart is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Click any product or scan a barcode to add it to this sale</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="py-2.5 flex items-center justify-between space-x-2.5">
                {/* Mini Item Image */}
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={item.product.imageUrl || '/images/products/default_product.svg'}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/products/default_product.svg';
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 truncate">{item.product.name}</h4>
                  <p className="text-[11px] text-slate-500">
                    ${item.unitPrice.toFixed(2)} each
                    {item.quantity >= item.product.stock && (
                      <span className="ml-2 text-rose-500 font-medium">(Max stock)</span>
                    )}
                  </p>
                </div>

                {/* Quantity Buttons */}
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-semibold text-slate-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-slate-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right pl-2">
                  <span className="text-xs font-bold text-slate-900 block">${item.total.toFixed(2)}</span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-[10px] text-rose-500 hover:text-rose-700"
                  >
                    remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Payment Area */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
            {/* Discount Quick Toggles */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Discount</span>
              {canApplyDiscounts ? (
                <div className="flex space-x-1">
                  {[0, 5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`px-2 py-0.5 text-[11px] rounded-md font-medium border ${
                        discountPercent === pct
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 italic">Discounts restricted for role</span>
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-1 text-xs border-t border-slate-200 pt-2 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Due</span>
                <span className="text-indigo-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-slate-200">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Payment Method
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                {(
                  [
                    { id: 'CASH', label: 'Cash', icon: Banknote },
                    { id: 'CARD', label: 'Card', icon: CreditCard },
                    { id: 'UPI', label: 'UPI/QR', icon: QrCode },
                    { id: 'TRANSFER', label: 'Transfer', icon: Building },
                  ] as const
                ).map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-center space-y-1 transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered Input & Exact Amount Quick Select */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-2 pt-1 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Cash Received</label>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setAmountReceived(totalAmount.toString())}
                      className="px-2 py-0.5 text-[10px] font-medium bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                    >
                      Exact
                    </button>
                    {[20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAmountReceived(amt.toString())}
                        className="px-2 py-0.5 text-[10px] font-medium bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder={totalAmount.toFixed(2)}
                    className="flex-1 px-3 py-1.5 text-sm font-bold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                {changeDue > 0 && (
                  <div className="flex justify-between text-xs font-semibold text-emerald-700 pt-1">
                    <span>Change to Return:</span>
                    <span>${changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Checkout Button */}
            <button
              id="btn-complete-sale"
              onClick={handleCheckout}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <Receipt className="w-4 h-4" />
              <span>Complete Sale & Issue Invoice (${totalAmount.toFixed(2)})</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Add Customer Modal */}
      {isAddingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-800">Quick Register Customer</h3>
              <button onClick={() => setIsAddingCustomer(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Liam Vance"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 123-4567"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="e.g. liam@example.com"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomer(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
