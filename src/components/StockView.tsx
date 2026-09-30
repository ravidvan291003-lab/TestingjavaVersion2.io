import React, { useState, useMemo } from 'react';
import { Product, StockLog, Category, User, StockAdjustmentType } from '../types';
import { storageService } from '../services/storageService';
import {
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  Minus,
  RefreshCw,
  History,
  Download,
  CheckCircle2,
  XCircle,
  X,
  Filter,
} from 'lucide-react';

interface StockViewProps {
  currentUser: User;
}

export const StockView: React.FC<StockViewProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>(() => storageService.getProducts());
  const [categories] = useState<Category[]>(() => storageService.getCategories());
  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => storageService.getStockLogs());

  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'AUDIT_LOGS'>('INVENTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'OUT' | 'HEALTHY'>('ALL');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'RESTOCK' | 'DAMAGE' | 'RETURN' | 'AUDIT'>('RESTOCK');
  const [adjustQty, setAdjustQty] = useState<string>('10');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Dynamic Rule Permissions
  const canAdjustStock = storageService.hasPermission(currentUser, 'stockAdjust');

  const refreshData = () => {
    setProducts(storageService.getProducts());
    setStockLogs(storageService.getStockLogs());
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const isOut = p.stock <= 0;
      const isLow = p.stock > 0 && p.stock <= p.minStockAlert;
      const isHealthy = p.stock > p.minStockAlert;

      if (statusFilter === 'OUT' && !isOut) return false;
      if (statusFilter === 'LOW' && !isLow) return false;
      if (statusFilter === 'HEALTHY' && !isHealthy) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, statusFilter]);

  // Inventory stats
  const stats = useMemo(() => {
    let totalItems = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let totalValuation = 0;

    products.forEach((p) => {
      totalItems += p.stock;
      totalValuation += p.stock * p.costPrice;
      if (p.stock <= 0) outOfStock++;
      else if (p.stock <= p.minStockAlert) lowStock++;
    });

    return { totalItems, outOfStock, lowStock, totalValuation };
  }, [products]);

  const openAdjustModal = (product: Product, defaultType: 'RESTOCK' | 'DAMAGE' = 'RESTOCK') => {
    setSelectedProduct(product);
    setAdjustType(defaultType);
    setAdjustQty(defaultType === 'RESTOCK' ? '10' : '1');
    setAdjustReason(defaultType === 'RESTOCK' ? 'Supplier shipment received' : 'Damaged / expired goods');
    setIsAdjustModalOpen(true);
  };

  const handleConfirmAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qtyNumber = parseInt(adjustQty, 10);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      alert('Please enter a valid quantity greater than 0.');
      return;
    }

    const signedDelta = adjustType === 'DAMAGE' ? -qtyNumber : qtyNumber;

    storageService.adjustStock({
      productId: selectedProduct.id,
      type: adjustType,
      quantityChange: signedDelta,
      reason: adjustReason.trim() || `${adjustType} inventory adjustment`,
      user: currentUser,
    });

    refreshData();
    setIsAdjustModalOpen(false);
    setSelectedProduct(null);
  };

  const exportStockCsv = () => {
    const headers = ['Product', 'SKU', 'Category', 'Current Stock', 'Min Alert', 'Cost Price', 'Selling Price', 'Valuation'];
    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || 'N/A';
      return [
        `"${p.name}"`,
        p.sku,
        `"${cat}"`,
        p.stock,
        p.minStockAlert,
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        (p.stock * p.costPrice).toFixed(2),
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="stock-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock & Inventory Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor real-time inventory counts, replenish low stock, record write-offs, and inspect audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="export-stock-csv-btn"
            onClick={exportStockCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export Stock CSV
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Total Units on Hand</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{stats.totalItems} units</div>
          <p className="text-xs text-slate-400 mt-1">Across {products.length} product SKUs</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Inventory Valuation</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Cost Basis</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">${stats.totalValuation.toFixed(2)}</div>
          <p className="text-xs text-slate-400 mt-1">Total invested capital</p>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${stats.lowStock > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{stats.lowStock} Items</div>
          <p className="text-xs text-slate-500 mt-1">At or below re-order alert limit</p>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${stats.outOfStock > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600">{stats.outOfStock} Items</div>
          <p className="text-xs text-slate-500 mt-1">Zero units available in store</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          id="stock-tab-inventory"
          onClick={() => setActiveTab('INVENTORY')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'INVENTORY'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" /> Current Inventory & Replenishment
          {activeTab === 'INVENTORY' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          id="stock-tab-audit-logs"
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors relative ${
            activeTab === 'AUDIT_LOGS'
              ? 'text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" /> Stock Movement Audit Logs ({stockLogs.length})
          {activeTab === 'AUDIT_LOGS' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {activeTab === 'INVENTORY' ? (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="stock-search-input"
                type="text"
                placeholder="Search products by SKU, name, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium text-slate-600">
              {(['ALL', 'LOW', 'OUT', 'HEALTHY'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    statusFilter === filter
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL'
                    ? 'All'
                    : filter === 'LOW'
                    ? `Low Stock (${stats.lowStock})`
                    : filter === 'OUT'
                    ? `Out of Stock (${stats.outOfStock})`
                    : 'Healthy'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Threshold</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Cost / Valuation</th>
                    <th className="py-3 px-4 text-center">Quick Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const isOut = p.stock <= 0;
                    const isLow = p.stock > 0 && p.stock <= p.minStockAlert;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                              <img
                                src={p.imageUrl || '/images/products/default_product.svg'}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/products/default_product.svg';
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{p.name}</div>
                              <div className="text-xs text-slate-400 font-mono">
                                SKU: {p.sku} | Unit: {p.unit}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${cat?.color || '#3B82F6'}15`,
                              color: cat?.color || '#3B82F6',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: cat?.color || '#3B82F6' }}
                            />
                            {cat?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-500 font-mono">
                          Min: {p.minStockAlert}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center font-bold text-sm px-2.5 py-0.5 rounded-full ${
                              isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                              <XCircle className="w-3.5 h-3.5" /> Out of stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                              <AlertTriangle className="w-3.5 h-3.5" /> Low stock alert
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Healthy level
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-semibold text-slate-900">
                            ${(p.stock * p.costPrice).toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400">@ ${p.costPrice.toFixed(2)} cost</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {canAdjustStock ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                id={`restock-btn-${p.sku}`}
                                onClick={() => openAdjustModal(p, 'RESTOCK')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                title="Restock units"
                              >
                                <Plus className="w-3 h-3" /> Restock
                              </button>
                              <button
                                id={`damage-btn-${p.sku}`}
                                onClick={() => openAdjustModal(p, 'DAMAGE')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                                title="Write off damage / expired"
                              >
                                <Minus className="w-3 h-3" /> Damage
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Read-only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Audit Logs Tab */
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Historical Stock Audit Trail</span>
            <span className="text-xs text-slate-400">Chronological inventory movements</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">Delta</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                  <th className="py-3 px-4">Staff Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {stockLogs.map((log) => {
                  const isPositive = log.quantityChange > 0;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{log.createdAt}</td>
                      <td className="py-3 px-4 font-sans font-medium text-slate-900">
                        {log.productName} <span className="text-slate-400 font-mono">[{log.sku}]</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full font-sans font-semibold text-[11px] ${
                            log.type === 'RESTOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.type === 'SALE'
                              ? 'bg-blue-100 text-blue-800'
                              : log.type === 'DAMAGE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                          {isPositive ? `+${log.quantityChange}` : log.quantityChange}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">
                        {log.previousStock} → <span className="font-bold text-slate-900">{log.newStock}</span>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600">{log.reason}</td>
                      <td className="py-3 px-4 font-sans text-slate-700">{log.userName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Adjust Inventory Stock</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProduct.name} ({selectedProduct.sku})
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-sm">
                <span className="text-slate-600">Current Stock on Hand:</span>
                <span className="font-bold text-slate-900 text-base">{selectedProduct.stock} {selectedProduct.unit}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('RESTOCK')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      adjustType === 'RESTOCK'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + Restock (Shipment)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DAMAGE')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      adjustType === 'DAMAGE'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    - Damage / Loss
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('RETURN')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      adjustType === 'RETURN'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + Customer Return
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('AUDIT')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      adjustType === 'AUDIT'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + Audit Count Delta
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Quantity ({adjustType === 'DAMAGE' ? 'To Deduct' : 'To Add'})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reason / Reference Note
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-8911 supplier pallet, or broken can during unload"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
