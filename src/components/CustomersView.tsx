import React, { useState, useMemo } from 'react';
import { Customer, Sale, User } from '../types';
import { storageService } from '../services/storageService';
import { Plus, Search, Edit2, Trash2, UserPlus, Phone, Mail, MapPin, Receipt, Eye, X } from 'lucide-react';

interface CustomersViewProps {
  currentUser: User;
  onViewInvoice: (sale: Sale) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ currentUser, onViewInvoice }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => storageService.getCustomers());
  const [sales] = useState<Sale[]>(() => storageService.getSales());
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditBalance, setCreditBalance] = useState('0');

  // Customer History Modal
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Dynamic Rule Permissions
  const canCreateEdit = storageService.hasPermission(currentUser, 'customersCreateEdit');
  const canDelete = storageService.hasPermission(currentUser, 'customersDelete');

  const refreshData = () => {
    setCustomers(storageService.getCustomers());
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCreditBalance('0');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setEmail(cust.email);
    setPhone(cust.phone);
    setAddress(cust.address || '');
    setCreditBalance(cust.creditBalance.toString());
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const custData: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || 'customer@store.local',
      phone: phone.trim(),
      address: address.trim(),
      creditBalance: parseFloat(creditBalance) || 0,
      totalSpent: editingCustomer ? editingCustomer.totalSpent : 0,
      ordersCount: editingCustomer ? editingCustomer.ordersCount : 0,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString().split('T')[0],
    };

    storageService.saveCustomer(custData);
    refreshData();
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this customer record?')) {
      storageService.deleteCustomer(id);
      refreshData();
    }
  };

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  // Orders for history modal
  const customerOrders = useMemo(() => {
    if (!historyCustomer) return [];
    return sales.filter((s) => s.customerId === historyCustomer.id || s.customerName === historyCustomer.name);
  }, [sales, historyCustomer]);

  return (
    <div id="customers-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Relationship Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer contact details, purchase frequency, lifetime value, and order receipts.
          </p>
        </div>
        {canCreateEdit && (
          <button
            id="btn-add-customer"
            onClick={openAddModal}
            className="inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Customer
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, phone, email, or address..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Lifetime Spent</th>
                <th className="py-3 px-4 text-right">Credit Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-medium text-slate-600">No customers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">Member since {cust.createdAt}</div>
                    </td>
                    <td className="py-3 px-4 space-y-0.5">
                      <div className="flex items-center text-slate-600 text-[11px]">
                        <Phone className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                        {cust.phone}
                      </div>
                      <div className="flex items-center text-slate-500 text-[11px]">
                        <Mail className="w-3 h-3 mr-1.5 text-slate-400 shrink-0" />
                        {cust.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {cust.address ? (
                        <div className="flex items-center truncate">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{cust.address}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setHistoryCustomer(cust)}
                        className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full font-semibold text-[11px] inline-flex items-center space-x-1"
                      >
                        <span>{cust.ordersCount} orders</span>
                        <Eye className="w-3 h-3 ml-0.5" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      ${cust.totalSpent.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <span className={cust.creditBalance > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
                        ${cust.creditBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setHistoryCustomer(cust)}
                        title="View Purchase History"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      {canCreateEdit && (
                        <button
                          onClick={() => openEditModal(cust)}
                          title="Edit Customer"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(cust.id)}
                          title="Delete Customer"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Samantha Wu"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 782-9014"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. samantha@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store Credit / Pre-payment ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={creditBalance}
                  onChange={(e) => setCreditBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing / Delivery Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, city, state, postal code..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Purchase History: {historyCustomer.name}</h3>
                <p className="text-xs text-slate-500">
                  Total Orders: {customerOrders.length} | Lifetime Spent: ${historyCustomer.totalSpent.toFixed(2)}
                </p>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto divide-y divide-slate-100 text-xs">
              {customerOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No prior transactions found for this customer.</p>
                </div>
              ) : (
                customerOrders.map((sale) => (
                  <div key={sale.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 font-mono">{sale.invoiceNumber}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold text-[10px]">
                          {sale.paymentStatus}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {sale.createdAt} • Cashier: {sale.cashierName} • Payment: {sale.paymentMethod}
                      </div>
                      <div className="text-slate-600 text-[11px] mt-1">
                        {sale.items.length} item(s): {sale.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <div className="font-bold text-slate-900 font-mono text-sm">${sale.totalAmount.toFixed(2)}</div>
                      <button
                        onClick={() => {
                          setHistoryCustomer(null);
                          onViewInvoice(sale);
                        }}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center mt-1"
                      >
                        View Receipt
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
