import React, { useState, useMemo } from 'react';
import { Sale, Product, Category, User } from '../types';
import { storageService } from '../services/storageService';
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Download,
  Percent,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  CreditCard,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ReportsViewProps {
  currentUser: User;
}

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser }) => {
  const [sales] = useState<Sale[]>(() => storageService.getSales());
  const [products] = useState<Product[]>(() => storageService.getProducts());
  const [categories] = useState<Category[]>(() => storageService.getCategories());
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('ALL');

  // Dynamic Rule Permissions
  const canViewFinancials = storageService.hasPermission(currentUser, 'reportsFinancials');
  const canExport = storageService.hasPermission(currentUser, 'reportsExport');

  // Filter sales by time
  const filteredSales = useMemo(() => {
    if (timeRange === 'ALL') return sales;
    const now = new Date();
    const days = timeRange === '7D' ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return sales.filter((s) => new Date(s.createdAt) >= cutoff);
  }, [sales, timeRange]);

  // Key Financial Metrics
  const metrics = useMemo(() => {
    let grossRevenue = 0;
    let totalCost = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let totalUnits = 0;

    filteredSales.forEach((sale) => {
      grossRevenue += sale.totalAmount;
      totalTax += sale.taxAmount;
      totalDiscount += sale.discountAmount;
      sale.items.forEach((item) => {
        totalUnits += item.quantity;
        totalCost += item.quantity * item.costPrice;
      });
    });

    const netProfit = grossRevenue - totalCost - totalTax;
    const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const avgOrderValue = filteredSales.length > 0 ? grossRevenue / filteredSales.length : 0;

    return {
      grossRevenue,
      totalCost,
      netProfit,
      margin,
      totalTax,
      totalDiscount,
      totalUnits,
      avgOrderValue,
      orderCount: filteredSales.length,
    };
  }, [filteredSales]);

  // Revenue trend data
  const trendData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; profit: number; count: number }> = {};

    filteredSales.forEach((sale) => {
      const dateKey = sale.createdAt.split(' ')[0] || sale.createdAt.substring(0, 10);
      if (!map[dateKey]) {
        map[dateKey] = { date: dateKey, revenue: 0, profit: 0, count: 0 };
      }
      map[dateKey].revenue += sale.totalAmount;
      map[dateKey].count += 1;
      const saleCost = sale.items.reduce((acc, item) => acc + item.quantity * item.costPrice, 0);
      map[dateKey].profit += sale.totalAmount - saleCost - sale.taxAmount;
    });

    const sorted = Object.values(map).sort((a, b) => (a.date > b.date ? 1 : -1));
    return sorted.map((d) => ({
      ...d,
      revenue: Number(d.revenue.toFixed(2)),
      profit: Number(d.profit.toFixed(2)),
    }));
  }, [filteredSales]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const itemMap: Record<
      string,
      {
        id: string;
        name: string;
        sku: string;
        unitsSold: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    > = {};

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!itemMap[item.productId]) {
          itemMap[item.productId] = {
            id: item.productId,
            name: item.productName,
            sku: item.sku,
            unitsSold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }
        itemMap[item.productId].unitsSold += item.quantity;
        itemMap[item.productId].revenue += item.total;
        const itemCost = item.quantity * item.costPrice;
        itemMap[item.productId].cost += itemCost;
        itemMap[item.productId].profit += item.total - itemCost;
      });
    });

    return Object.values(itemMap)
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 8);
  }, [filteredSales]);

  // Sales by Category
  const categorySales = useMemo(() => {
    const catMap: Record<string, number> = {};

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = categories.find((c) => c.id === prod?.categoryId);
        const catName = cat ? cat.name : 'Other';
        catMap[catName] = (catMap[catName] || 0) + item.total;
      });
    });

    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }));
  }, [filteredSales, products, categories]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const methodMap: Record<string, { method: string; count: number; total: number }> = {};

    filteredSales.forEach((sale) => {
      if (!methodMap[sale.paymentMethod]) {
        methodMap[sale.paymentMethod] = { method: sale.paymentMethod, count: 0, total: 0 };
      }
      methodMap[sale.paymentMethod].count += 1;
      methodMap[sale.paymentMethod].total += sale.totalAmount;
    });

    return Object.values(methodMap).map((item) => ({
      ...item,
      total: Number(item.total.toFixed(2)),
    }));
  }, [filteredSales]);

  const handleDownloadReport = () => {
    const reportSummary = `=====================================================
SALES & REVENUE PERFORMANCE REPORT
Generated on: ${new Date().toLocaleString()}
Filter Timeframe: ${timeRange === 'ALL' ? 'All Time' : timeRange}
-----------------------------------------------------
Gross Sales Revenue: $${metrics.grossRevenue.toFixed(2)}
Total Cost of Goods: $${metrics.totalCost.toFixed(2)}
Estimated Net Profit: $${metrics.netProfit.toFixed(2)} (${metrics.margin.toFixed(1)}% margin)
Sales Taxes Collected: $${metrics.totalTax.toFixed(2)}
Discounts Applied: -$${metrics.totalDiscount.toFixed(2)}
Total Orders Processed: ${metrics.orderCount}
Total Product Units Sold: ${metrics.totalUnits}
Average Ticket Value: $${metrics.avgOrderValue.toFixed(2)}
-----------------------------------------------------
TOP SELLING PRODUCTS:
${topProducts
  .map(
    (p, i) =>
      `${i + 1}. ${p.name} [${p.sku}] - ${p.unitsSold} sold | $${p.revenue.toFixed(2)} rev | $${p.profit.toFixed(2)} profit`
  )
  .join('\n')}
-----------------------------------------------------
CATEGORY BREAKDOWN:
${categorySales.map((c) => `- ${c.name}: $${c.value.toFixed(2)}`).join('\n')}
=====================================================`;

    const blob = new Blob([reportSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Executive_Report_${timeRange}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="reports-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales & Profit Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze profit margins, sales velocity, product performance, and revenue trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600 shadow-xs">
            {(['7D', '30D', 'ALL'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  timeRange === r
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                {r === '7D' ? 'Last 7 Days' : r === '30D' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {canExport && (
            <button
              id="download-report-btn"
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-500" /> Export Summary
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ${metrics.grossRevenue.toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-1">From {metrics.orderCount} completed transactions</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Estimated Net Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          {canViewFinancials ? (
            <>
              <div className="mt-2 text-2xl font-bold text-emerald-600">
                ${metrics.netProfit.toFixed(2)}
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1">
                {metrics.margin.toFixed(1)}% profit margin
              </p>
            </>
          ) : (
            <>
              <div className="mt-2 text-xl font-bold text-slate-400">
                ••••••
              </div>
              <p className="text-xs text-slate-400 italic mt-1">
                Restricted for current role
              </p>
            </>
          )}
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Average Ticket</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            ${metrics.avgOrderValue.toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Per transaction average basket</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Units Sold</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {metrics.totalUnits} items
          </div>
          <p className="text-xs text-slate-400 mt-1">${metrics.totalCost.toFixed(2)} inventory cost</p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Profit Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Revenue & Profit Trajectory</h2>
            <span className="text-xs text-slate-400">Daily financial timeline</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Net Profit"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProf)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Pie */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">Sales by Category</h2>
            <p className="text-xs text-slate-400 mb-4">Volume breakdown across departments</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categorySales.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
            {categorySales.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  {cat.name}
                </span>
                <span className="font-semibold text-slate-900">${cat.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Payment Method distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Top Selling Products</h2>
              <p className="text-xs text-slate-400">Ranked by unit sales and profit yield</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3"># Rank</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topProducts.map((prod, idx) => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800'
                            : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{prod.name}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-500">{prod.sku}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {prod.unitsSold}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      ${prod.revenue.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                      +${prod.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Payment Breakdown</h2>
              <p className="text-xs text-slate-400">Customer checkout preferences</p>
            </div>
            <CreditCard className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-4">
            {paymentBreakdown.map((item) => {
              const pct = metrics.grossRevenue > 0 ? (item.total / metrics.grossRevenue) * 100 : 0;
              return (
                <div key={item.method} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.method}</span>
                    <span className="text-slate-500">
                      ${item.total.toFixed(2)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400">{item.count} transactions recorded</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
