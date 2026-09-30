import React, { useState } from 'react';
import { UserRole, RolePermissions, PermissionCategory, PermissionKey } from '../types';
import { storageService } from '../services/storageService';
import {
  PERMISSION_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_PRESETS,
} from '../data/permissionRules';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sliders,
  Layers,
  Lock,
} from 'lucide-react';

interface EditRoleRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole?: 'MANAGER' | 'CASHIER';
  onSaved?: () => void;
}

export const EditRoleRulesModal: React.FC<EditRoleRulesModalProps> = ({
  isOpen,
  onClose,
  targetRole = 'CASHIER',
  onSaved,
}) => {
  const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'CASHIER'>(targetRole);
  const [permissions, setPermissions] = useState<Record<UserRole, RolePermissions>>(() =>
    storageService.getRolePermissions()
  );
  const [activeCategory, setActiveCategory] = useState<PermissionCategory | 'ALL'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRolePerms = permissions[selectedRole];
  const categories: PermissionCategory[] = [
    'POS & Sales',
    'Inventory & Catalog',
    'CRM & Customers',
    'Analytics & Reports',
    'System & Security',
  ];

  const togglePermission = (key: PermissionKey) => {
    setPermissions((prev) => {
      const updatedRole = {
        ...prev[selectedRole],
        [key]: !prev[selectedRole][key],
      };
      return {
        ...prev,
        [selectedRole]: updatedRole,
      };
    });
  };

  const setCategoryPermissions = (category: PermissionCategory, enabled: boolean) => {
    const keysInCat = PERMISSION_DEFINITIONS.filter((p) => p.category === category).map((p) => p.key);
    setPermissions((prev) => {
      const updatedRole = { ...prev[selectedRole] };
      keysInCat.forEach((key) => {
        updatedRole[key] = enabled;
      });
      return {
        ...prev,
        [selectedRole]: updatedRole,
      };
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = ROLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setPermissions((prev) => {
      const updatedRole = {
        ...prev[selectedRole],
        ...preset.permissions,
      };
      return {
        ...prev,
        [selectedRole]: updatedRole,
      };
    });

    showToast(`Applied preset "${preset.name}" to ${selectedRole}`);
  };

  const handleResetToDefault = () => {
    if (confirm(`Reset ${selectedRole} permissions to default system template?`)) {
      setPermissions((prev) => ({
        ...prev,
        [selectedRole]: { ...DEFAULT_ROLE_PERMISSIONS[selectedRole] },
      }));
      showToast(`Reset ${selectedRole} to default permissions`);
    }
  };

  const handleSave = () => {
    storageService.saveRolePermissions(selectedRole, permissions[selectedRole]);
    showToast(`Rules and functions for ${selectedRole} saved successfully!`);
    if (onSaved) onSaved();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Stats for the active role
  const totalPermissions = PERMISSION_DEFINITIONS.length;
  const enabledCount = Object.values(currentRolePerms).filter(Boolean).length;
  const rolePresets = ROLE_PRESETS.filter((p) => p.role === selectedRole);

  const filteredDefinitions =
    activeCategory === 'ALL'
      ? PERMISSION_DEFINITIONS
      : PERMISSION_DEFINITIONS.filter((p) => p.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Configure Role Functions & Rules</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {selectedRole}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Grant or revoke granular system modules, function permissions, and operational limits.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Tabs & Quick Presets */}
        <div className="px-6 pt-4 pb-3 bg-white border-b border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Role switch tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedRole('MANAGER')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === 'MANAGER'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Store Manager</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-600">
                  {Object.values(permissions.MANAGER).filter(Boolean).length}/{totalPermissions}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('CASHIER')}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedRole === 'CASHIER'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-4 h-4 text-slate-700" />
                <span>POS Cashier</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700">
                  {Object.values(permissions.CASHIER).filter(Boolean).length}/{totalPermissions}
                </span>
              </button>
            </div>

            {/* Quick Preset Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Presets:</span>
              </span>
              <div className="flex items-center flex-wrap gap-1.5">
                {rolePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    title={preset.description}
                    className="px-2 py-1 text-[11px] font-medium bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-md transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                activeCategory === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories ({totalPermissions})
            </button>
            {categories.map((cat) => {
              const countInCat = PERMISSION_DEFINITIONS.filter((p) => p.category === cat).length;
              const enabledInCat = PERMISSION_DEFINITIONS.filter(
                (p) => p.category === cat && currentRolePerms[p.key]
              ).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1 rounded-sm ${
                      activeCategory === cat ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {enabledInCat}/{countInCat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {categories
            .filter((cat) => activeCategory === 'ALL' || activeCategory === cat)
            .map((category) => {
              const items = PERMISSION_DEFINITIONS.filter((p) => p.category === category);
              const allEnabled = items.every((p) => currentRolePerms[p.key]);
              const noneEnabled = items.every((p) => !currentRolePerms[p.key]);

              return (
                <div key={category} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {/* Category Header */}
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{category}</h3>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({items.filter((p) => currentRolePerms[p.key]).length}/{items.length} granted)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCategoryPermissions(category, true)}
                        disabled={allEnabled}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                          allEnabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-indigo-600 hover:bg-indigo-50'
                        }`}
                      >
                        Grant All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setCategoryPermissions(category, false)}
                        disabled={noneEnabled}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                          noneEnabled
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        Revoke All
                      </button>
                    </div>
                  </div>

                  {/* Items in Category */}
                  <div className="divide-y divide-slate-100 bg-white">
                    {items.map((item) => {
                      const isGranted = Boolean(currentRolePerms[item.key]);

                      return (
                        <div
                          key={item.key}
                          onClick={() => togglePermission(item.key)}
                          className={`p-3.5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition-colors ${
                            isGranted ? 'bg-indigo-50/20' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  isGranted ? 'text-slate-900' : 'text-slate-600'
                                }`}
                              >
                                {item.label}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                {item.key}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePermission(item.key);
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              isGranted ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isGranted ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset {selectedRole} to Defaults
            </button>
            <span>•</span>
            <span className="font-semibold text-slate-700">
              {enabledCount} of {totalPermissions} functions active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Role Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
