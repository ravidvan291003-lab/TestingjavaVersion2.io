import React, { useState, useEffect } from 'react';
import { User, UserRole, RolePermissions, PermissionKey, PermissionCategory } from '../types';
import { storageService } from '../services/storageService';
import {
  PERMISSION_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_PRESETS,
} from '../data/permissionRules';
import { EditRoleRulesModal } from './EditRoleRulesModal';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  Phone,
  Clock,
  Key,
  X,
  UserCheck,
  Sliders,
  Sparkles,
  RotateCcw,
  Check,
  Info,
  Layers,
  Search,
} from 'lucide-react';

interface UsersViewProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onPermissionsUpdated?: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  currentUser,
  onSwitchUser,
  onPermissionsUpdated,
}) => {
  const [users, setUsers] = useState<User[]>(() => storageService.getUsers());
  const [permissions, setPermissions] = useState<Record<UserRole, RolePermissions>>(() =>
    storageService.getRolePermissions()
  );

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRulesRoleModal, setEditRulesRoleModal] = useState<'MANAGER' | 'CASHIER' | null>(null);

  // Category filter & Search for Matrix
  const [matrixCategory, setMatrixCategory] = useState<PermissionCategory | 'ALL'>('ALL');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Check permissions of current user
  const canEditRules =
    currentUser.role === 'ADMIN' || storageService.hasPermission(currentUser, 'rolesEditRules');
  const canManageUsers =
    currentUser.role === 'ADMIN' || storageService.hasPermission(currentUser, 'usersManage');

  const refreshData = () => {
    setUsers(storageService.getUsers());
    setPermissions(storageService.getRolePermissions());
    if (onPermissionsUpdated) {
      onPermissionsUpdated();
    }
  };

  useEffect(() => {
    const unsubscribe = storageService.onPermissionsChange(() => {
      setPermissions(storageService.getRolePermissions());
    });
    return unsubscribe;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick inline toggle for Manager or Cashier
  const handleToggleRule = (targetRole: 'MANAGER' | 'CASHIER', key: PermissionKey) => {
    if (!canEditRules) {
      showToast('Access restricted: Only Administrators or authorized Supervisors can edit role rules.');
      return;
    }

    const currentVal = permissions[targetRole][key];
    const newVal = !currentVal;

    storageService.saveRolePermissions(targetRole, { [key]: newVal });
    setPermissions((prev) => ({
      ...prev,
      [targetRole]: {
        ...prev[targetRole],
        [key]: newVal,
      },
    }));

    const permDef = PERMISSION_DEFINITIONS.find((p) => p.key === key);
    showToast(`${newVal ? 'Granted' : 'Revoked'} "${permDef?.label || key}" for ${targetRole}`);
    if (onPermissionsUpdated) onPermissionsUpdated();
  };

  // Apply preset directly from header dropdown
  const handleApplyPreset = (targetRole: 'MANAGER' | 'CASHIER', presetId: string) => {
    if (!canEditRules) {
      showToast('Access restricted: You do not have permission to modify role rules.');
      return;
    }
    const preset = ROLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    storageService.saveRolePermissions(targetRole, preset.permissions);
    setPermissions((prev) => ({
      ...prev,
      [targetRole]: {
        ...prev[targetRole],
        ...preset.permissions,
      },
    }));

    showToast(`Applied preset "${preset.name}" to ${targetRole}`);
    if (onPermissionsUpdated) onPermissionsUpdated();
  };

  // Bulk category toggle
  const handleBulkCategoryToggle = (
    targetRole: 'MANAGER' | 'CASHIER',
    category: PermissionCategory,
    enabled: boolean
  ) => {
    if (!canEditRules) return;
    const items = PERMISSION_DEFINITIONS.filter((p) => p.category === category);
    const updates: Partial<RolePermissions> = {};
    items.forEach((item) => {
      updates[item.key] = enabled;
    });

    storageService.saveRolePermissions(targetRole, updates);
    setPermissions((prev) => ({
      ...prev,
      [targetRole]: {
        ...prev[targetRole],
        ...updates,
      },
    }));

    showToast(
      `${enabled ? 'Granted' : 'Revoked'} all ${items.length} ${category} functions for ${targetRole}`
    );
    if (onPermissionsUpdated) onPermissionsUpdated();
  };

  // Reset all permissions to system defaults
  const handleResetAllRules = () => {
    if (!canEditRules) return;
    if (confirm('Reset all Manager and Cashier rules and functions to system factory defaults?')) {
      const reset = storageService.resetRolePermissions();
      setPermissions(reset);
      showToast('All role rules restored to factory default settings.');
      if (onPermissionsUpdated) onPermissionsUpdated();
    }
  };

  // User CRUD
  const openAddModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('CASHIER');
    setStatus('ACTIVE');
    setIsUserModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setRole(user.role);
    setStatus(user.status);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const userObj: User = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      role,
      status,
      lastLogin: editingUser?.lastLogin || 'Never',
    };

    storageService.saveUser(userObj);
    refreshData();
    setIsUserModalOpen(false);
    showToast(`User account "${userObj.name}" saved successfully.`);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('You cannot delete the currently logged in user account.');
      return;
    }
    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const target = users.find((u) => u.id === userId);
    if (target?.role === 'ADMIN' && adminCount <= 1) {
      alert('System requires at least one active ADMIN account.');
      return;
    }

    if (confirm(`Are you sure you want to delete user "${target?.name}"?`)) {
      storageService.deleteUser(userId);
      refreshData();
      showToast(`User "${target?.name}" deleted.`);
    }
  };

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3" /> System Admin
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3 h-3" /> Store Manager
          </span>
        );
      case 'CASHIER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Shield className="w-3 h-3" /> POS Cashier
          </span>
        );
    }
  };

  const totalPermissionsCount = PERMISSION_DEFINITIONS.length;
  const managerActiveCount = Object.values(permissions.MANAGER || {}).filter(Boolean).length;
  const cashierActiveCount = Object.values(permissions.CASHIER || {}).filter(Boolean).length;

  const categories: PermissionCategory[] = [
    'POS & Sales',
    'Inventory & Catalog',
    'CRM & Customers',
    'Analytics & Reports',
    'System & Security',
  ];

  // Filtered definitions
  const filteredDefinitions = PERMISSION_DEFINITIONS.filter((item) => {
    const matchesCat = matrixCategory === 'ALL' || item.category === matrixCategory;
    const q = matrixSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.key.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div id="users-view" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              User Management & Role Permissions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              Active Session: {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure system accounts, edit authorization rules & function privileges for Store Managers and POS Cashiers.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {canEditRules && (
            <div className="flex items-center gap-1.5">
              <button
                id="btn-edit-manager-rules"
                onClick={() => setEditRulesRoleModal('MANAGER')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit Manager Rules</span>
              </button>

              <button
                id="btn-edit-cashier-rules"
                onClick={() => setEditRulesRoleModal('CASHIER')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition-colors shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit Cashier Rules</span>
              </button>
            </div>
          )}

          {canManageUsers && (
            <button
              id="add-user-btn"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Staff Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating / Top Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* INTERACTIVE ROLE PERMISSIONS & FUNCTION RULES MATRIX */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Matrix Header Banner with Role Summaries and Presets */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                  <Key className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Interactive Role Function & Authorization Matrix
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                  Live Rule Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Click any toggle below to grant or revoke specific operational functions for Manager and Cashier roles in real-time.
              </p>
            </div>

            {/* Quick Actions & Reset */}
            <div className="flex items-center flex-wrap gap-2 text-xs">
              {canEditRules && (
                <button
                  onClick={handleResetAllRules}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs font-medium transition-colors"
                  title="Reset all role permissions to system defaults"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>Reset Defaults</span>
                </button>
              )}
            </div>
          </div>

          {/* Role Status Cards with Quick Presets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
            {/* Admin Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>System Admin</span>
                    <span className="text-[10px] text-rose-600 font-mono font-bold bg-rose-50 px-1 rounded">
                      ROOT
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    All {totalPermissionsCount} functions permanently granted
                  </span>
                </div>
              </div>
              <Lock className="w-4 h-4 text-slate-300" title="Admin permissions cannot be restricted" />
            </div>

            {/* Manager Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Store Manager</div>
                    <span className="text-[11px] font-semibold text-indigo-600">
                      {managerActiveCount} / {totalPermissionsCount} functions active
                    </span>
                  </div>
                </div>

                {canEditRules && (
                  <button
                    onClick={() => setEditRulesRoleModal('MANAGER')}
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Open Full Manager Rule Editor"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {canEditRules && (
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 text-[11px]">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-slate-400">Preset:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApplyPreset('MANAGER', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 text-[11px] focus:outline-hidden"
                  >
                    <option value="" disabled>
                      Choose preset...
                    </option>
                    {ROLE_PRESETS.filter((p) => p.role === 'MANAGER').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Cashier Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">POS Cashier</div>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {cashierActiveCount} / {totalPermissionsCount} functions active
                    </span>
                  </div>
                </div>

                {canEditRules && (
                  <button
                    onClick={() => setEditRulesRoleModal('CASHIER')}
                    className="p-1 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Open Full Cashier Rule Editor"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {canEditRules && (
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 text-[11px]">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-slate-400">Preset:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleApplyPreset('CASHIER', e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 text-[11px] focus:outline-hidden"
                  >
                    <option value="" disabled>
                      Choose preset...
                    </option>
                    {ROLE_PRESETS.filter((p) => p.role === 'CASHIER').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Matrix Category and Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
              <button
                type="button"
                onClick={() => setMatrixCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  matrixCategory === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Modules
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMatrixCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    matrixCategory === cat
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={matrixSearch}
                onChange={(e) => setMatrixSearch(e.target.value)}
                placeholder="Search rule or module..."
                className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-semibold text-slate-500">
                <th className="py-3 px-4 w-5/12">System Function & Privilege Rule</th>
                <th className="py-3 px-3 text-center w-2/12">
                  <span className="inline-flex items-center gap-1 text-rose-700">
                    <ShieldAlert className="w-3.5 h-3.5" /> Admin
                  </span>
                </th>
                <th className="py-3 px-3 text-center w-2.5/12">
                  <div className="flex items-center justify-center gap-1.5 text-indigo-700">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Manager</span>
                    {canEditRules && (
                      <button
                        onClick={() => setEditRulesRoleModal('MANAGER')}
                        title="Edit all Manager rules"
                        className="p-0.5 hover:bg-indigo-100 rounded text-indigo-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-2.5/12">
                  <div className="flex items-center justify-center gap-1.5 text-slate-700">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Cashier</span>
                    {canEditRules && (
                      <button
                        onClick={() => setEditRulesRoleModal('CASHIER')}
                        title="Edit all Cashier rules"
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories
                .filter((cat) => matrixCategory === 'ALL' || matrixCategory === cat)
                .map((category) => {
                  const itemsInCat = filteredDefinitions.filter((item) => item.category === category);
                  if (itemsInCat.length === 0) return null;

                  return (
                    <React.Fragment key={category}>
                      {/* Section / Category Row */}
                      <tr className="bg-slate-100/70 border-y border-slate-200/80">
                        <td colSpan={4} className="py-2 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                                {category}
                              </span>
                            </div>

                            {canEditRules && (
                              <div className="flex items-center gap-3 text-[11px]">
                                <span className="text-slate-400">Quick batch:</span>
                                <span className="text-indigo-600 font-semibold">Manager</span>
                                <button
                                  type="button"
                                  onClick={() => handleBulkCategoryToggle('MANAGER', category, true)}
                                  className="text-indigo-600 hover:underline"
                                >
                                  Grant All
                                </button>
                                <span>/</span>
                                <button
                                  type="button"
                                  onClick={() => handleBulkCategoryToggle('MANAGER', category, false)}
                                  className="text-rose-600 hover:underline"
                                >
                                  Revoke
                                </button>

                                <span className="text-slate-300">|</span>

                                <span className="text-slate-700 font-semibold">Cashier</span>
                                <button
                                  type="button"
                                  onClick={() => handleBulkCategoryToggle('CASHIER', category, true)}
                                  className="text-indigo-600 hover:underline"
                                >
                                  Grant All
                                </button>
                                <span>/</span>
                                <button
                                  type="button"
                                  onClick={() => handleBulkCategoryToggle('CASHIER', category, false)}
                                  className="text-rose-600 hover:underline"
                                >
                                  Revoke
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Items in this category */}
                      {itemsInCat.map((item) => {
                        const managerGranted = Boolean(permissions.MANAGER[item.key]);
                        const cashierGranted = Boolean(permissions.CASHIER[item.key]);

                        return (
                          <tr
                            key={item.key}
                            className="hover:bg-slate-50/70 transition-colors group"
                          >
                            {/* Function Name and Description */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                <span>{item.label}</span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {item.key}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                {item.description}
                              </p>
                            </td>

                            {/* Admin Cell (Always Granted) */}
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <Check className="w-3 h-3" /> Full Root
                              </span>
                            </td>

                            {/* Manager Cell (Interactive Toggle) */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  id={`toggle-manager-${item.key}`}
                                  disabled={!canEditRules}
                                  onClick={() => handleToggleRule('MANAGER', item.key)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                    managerGranted ? 'bg-indigo-600' : 'bg-slate-300'
                                  } ${!canEditRules ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  title={
                                    canEditRules
                                      ? `Click to ${managerGranted ? 'revoke' : 'grant'} for Manager`
                                      : 'Requires Admin privilege'
                                  }
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                      managerGranted ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                                <span
                                  className={`text-[11px] font-semibold w-14 text-left ${
                                    managerGranted ? 'text-indigo-700' : 'text-slate-400'
                                  }`}
                                >
                                  {managerGranted ? 'Granted' : 'Blocked'}
                                </span>
                              </div>
                            </td>

                            {/* Cashier Cell (Interactive Toggle) */}
                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  id={`toggle-cashier-${item.key}`}
                                  disabled={!canEditRules}
                                  onClick={() => handleToggleRule('CASHIER', item.key)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                    cashierGranted ? 'bg-indigo-600' : 'bg-slate-300'
                                  } ${!canEditRules ? 'opacity-60 cursor-not-allowed' : ''}`}
                                  title={
                                    canEditRules
                                      ? `Click to ${cashierGranted ? 'revoke' : 'grant'} for Cashier`
                                      : 'Requires Admin privilege'
                                  }
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                      cashierGranted ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                                <span
                                  className={`text-[11px] font-semibold w-14 text-left ${
                                    cashierGranted ? 'text-indigo-700' : 'text-slate-400'
                                  }`}
                                >
                                  {cashierGranted ? 'Granted' : 'Blocked'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYSTEM USERS DIRECTORY */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Staff User Accounts ({users.length})
            </h2>
            <p className="text-xs text-slate-400">
              Assigned accounts will inherit the role permission rules configured above. Click &quot;Switch To&quot; to test active sessions.
            </p>
          </div>

          {canManageUsers && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors self-start sm:self-auto"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add User
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Role Assignment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-center">Quick Switch / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isCurrent ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            {u.name}
                            {isCurrent && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md">
                                Current Active
                              </span>
                            )}
                          </div>
                          {u.phone && <div className="text-[11px] text-slate-400">{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs">{u.email}</td>
                    <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3 px-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">{u.lastLogin || 'Today'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        {!isCurrent ? (
                          <button
                            id={`switch-user-btn-${u.id}`}
                            onClick={() => onSwitchUser(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors shadow-2xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Switch To
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium px-2 py-1">
                            Active Session
                          </span>
                        )}

                        {canManageUsers && (
                          <>
                            <button
                              id={`edit-user-btn-${u.id}`}
                              onClick={() => openEditModal(u)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Edit user details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete-user-btn-${u.id}`}
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={isCurrent}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isCurrent
                                  ? 'text-slate-200 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                              }`}
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit User Account' : 'Add New Staff User'}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Blake"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600 font-semibold"
                  >
                    <option value="ADMIN">ADMIN (Root)</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CASHIER">CASHIER</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Inherits configured role rules
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  Save User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Rules Dedicated Modal */}
      {editRulesRoleModal && (
        <EditRoleRulesModal
          isOpen={Boolean(editRulesRoleModal)}
          onClose={() => setEditRulesRoleModal(null)}
          targetRole={editRulesRoleModal}
          onSaved={refreshData}
        />
      )}
    </div>
  );
};
