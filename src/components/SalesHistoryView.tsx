import React, { useState, useMemo } from 'react';
import { Sale, User } from '../types';
import { storageService } from '../services/storageService';
import {
  Search,
  Receipt,
  Download,
  Eye,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Building,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  DollarSign,
  User as UserIcon,
} from 'lucide-react';

interface SalesHistoryViewProps {
  currentUser: User;
  onViewInvoice: (sale: Sale) => void;
  onNavigateToPos: () => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  currentUser,
  onViewInvoice,
  onNavigateToPos,
}) => {
  const [sales, setSales] = useState<Sale[]>(() => storageService.getSales());
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      // Payment filter
      if (paymentFilter !== 'ALL' && sale.paymentMethod !== paymentFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'ALL') {
        const saleDate = new Date(sale.createdAt);
        const now = new Date();
        if (dateFilter === 'TODAY') {
          const isToday =
            saleDate.getDate() === now.getDate() &&
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateFilter === 'WEEK') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (saleDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'MONTH') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (saleDate < thirtyDaysAgo) return false;
        }
      }

      // Search query (invoice #, customer, cashier)
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        sale.invoiceNumber.toLowerCase().includes(q) ||
        sale.customerName.toLowerCase().includes(q) ||
        sale.cashierName.toLowerCase().includes(q) ||
        sale.items.some((item) => item.productName.toLowerCase().includes(q))
      );
    });
  }, [sales, searchQuery, paymentFilter, dateFilter]);

  // Aggregate stats
  const totalVolume = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [filteredSales]);

  const avgTicket = filteredSales.length > 0 ? totalVolume / filteredSales.length : 0;

  const handleExportCsv = () => {
    const headers = ['Invoice #', 'Date', 'Customer', 'Cashier', 'Items', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Method'];
    const rows = filteredSales.map((s) => [
      s.invoiceNumber,
      `"${s.createdAt}"`,
      `"${s.customerName}"`,
      `"${s.cashierName}"`,
      s.items.length,
      s.subtotal.toFixed(2),
      s.taxAmount.toFixed(2),
      s.discountAmount.toFixed(2),
      s.totalAmount.toFixed(2),
      s.paymentMethod,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="w-3 h-3" /> Cash
          </span>
        );
      case 'CARD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            <CreditCard className="w-3 h-3" /> Card
          </span>
        );
      case 'UPI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            <QrCode className="w-3 h-3" /> UPI / QR
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            <Building className="w-3 h-3" /> Bank
          </span>
        );
      default:
        return <span>{method}</span>;
    }
  };

  return (
    <div id="sales-history-view" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales & Invoice History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, inspect invoices, and track billing records across all cashiers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="export-sales-csv-btn"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            id="new-sale-shortcut-btn"
            onClick={onNavigateToPos}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Receipt className="w-4 h-4" /> New Sale (POS)
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Filtered Revenue</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">${totalVolume.toFixed(2)}</div>
          <p className="text-xs text-slate-400 mt-1">{filteredSales.length} invoices matched</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Average Ticket Value</span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">${avgTicket.toFixed(2)}</div>
          <p className="text-xs text-slate-400 mt-1">Per transaction average</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Total Orders</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{sales.length} Lifetime</div>
          <p className="text-xs text-slate-400 mt-1">Recorded in system database</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="sales-search-input"
              type="text"
              placeholder="Search by Invoice # (e.g. INV-2026-0041), Customer, Cashier, or Item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Filter */}
            <select
              id="sales-payment-filter"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI / QR</option>
              <option value="TRANSFER">Bank Transfer</option>
            </select>

            {/* Date filter */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium text-slate-600">
              {(['ALL', 'TODAY', 'WEEK', 'MONTH'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setDateFilter(period)}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    dateFilter === period
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {period === 'ALL' ? 'All Time' : period === 'TODAY' ? 'Today' : period === 'WEEK' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-700">No Sales Invoices Found</p>
            <p className="text-sm mt-1">Try resetting your search filters or generate a sale from the POS terminal.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-600">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {sale.createdAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900">{sale.customerName}</span>
                      {sale.customerPhone && (
                        <div className="text-xs text-slate-400">{sale.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {sale.cashierName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)} units ({sale.items.length} skus)
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getPaymentBadge(sale.paymentMethod)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                      ${sale.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        id={`view-invoice-btn-${sale.invoiceNumber}`}
                        onClick={() => onViewInvoice(sale)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                        title="View / Print Invoice"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
