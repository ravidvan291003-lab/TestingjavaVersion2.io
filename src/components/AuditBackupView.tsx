import React, { useState, useMemo, useRef } from 'react';
import {
  User,
  UserRole,
  AuthLog,
  AuthActionType,
  AuditLog,
  AuditCategory,
  AuditAction,
  BackupSnapshot,
  SystemBackupData,
} from '../types';
import { storageService } from '../services/storageService';
import {
  History,
  Shield,
  ShieldCheck,
  FileText,
  Download,
  Upload,
  Database,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Clock,
  User as UserIcon,
  LogIn,
  LogOut,
  Eye,
  FileSpreadsheet,
  X,
  PlusCircle,
  KeyRound,
  Check,
} from 'lucide-react';

interface AuditBackupViewProps {
  currentUser: User;
  onDataRestored?: () => void;
}

export const AuditBackupView: React.FC<AuditBackupViewProps> = ({
  currentUser,
  onDataRestored,
}) => {
  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'auth_logs' | 'audit_trail' | 'backup_center'>('auth_logs');

  // Logs & Snapshots State
  const [authLogs, setAuthLogs] = useState<AuthLog[]>(() => storageService.getAuthLogs());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storageService.getAuditLogs());
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(() => storageService.getBackupSnapshots());

  // Permission checks
  const canManageBackups = storageService.hasPermission(currentUser, 'manageBackups');

  const refreshAllLogs = () => {
    setAuthLogs(storageService.getAuthLogs());
    setAuditLogs(storageService.getAuditLogs());
    setSnapshots(storageService.getBackupSnapshots());
  };

  // -----------------------------------------------------------------
  // Filter States: Login/Logout History
  // -----------------------------------------------------------------
  const [authSearch, setAuthSearch] = useState('');
  const [authRoleFilter, setAuthRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [authActionFilter, setAuthActionFilter] = useState<'ALL' | AuthActionType>('ALL');

  const filteredAuthLogs = useMemo(() => {
    return authLogs.filter((log) => {
      if (authRoleFilter !== 'ALL' && log.role !== authRoleFilter) return false;
      if (authActionFilter !== 'ALL' && log.action !== authActionFilter) return false;
      if (authSearch.trim()) {
        const q = authSearch.toLowerCase();
        const matchUser = log.userName.toLowerCase().includes(q);
        const matchEmail = log.userEmail.toLowerCase().includes(q);
        const matchDetails = (log.details || '').toLowerCase().includes(q);
        const matchEnv = (log.environment || '').toLowerCase().includes(q);
        if (!matchUser && !matchEmail && !matchDetails && !matchEnv) return false;
      }
      return true;
    });
  }, [authLogs, authRoleFilter, authActionFilter, authSearch]);

  // -----------------------------------------------------------------
  // Filter States: Audit Trail
  // -----------------------------------------------------------------
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<'ALL' | AuditCategory>('ALL');
  const [auditUserFilter, setAuditUserFilter] = useState<string>('ALL');

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditCategoryFilter !== 'ALL' && log.category !== auditCategoryFilter) return false;
      if (auditUserFilter !== 'ALL' && log.userId !== auditUserFilter) return false;
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchSummary = log.summary.toLowerCase().includes(q);
        const matchEntity = (log.entityName || '').toLowerCase().includes(q);
        const matchOperator = log.userName.toLowerCase().includes(q);
        const matchDetails = typeof log.details === 'string'
          ? log.details.toLowerCase().includes(q)
          : JSON.stringify(log.details || {}).toLowerCase().includes(q);
        if (!matchSummary && !matchEntity && !matchOperator && !matchDetails) return false;
      }
      return true;
    });
  }, [auditLogs, auditCategoryFilter, auditUserFilter, auditSearch]);

  // Modal inspection of an audit log's detailed payload
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  // -----------------------------------------------------------------
  // Backup File Restore state
  // -----------------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importedBackupData, setImportedBackupData] = useState<SystemBackupData | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [newSnapshotReason, setNewSnapshotReason] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  // Handle file selected for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed: SystemBackupData = JSON.parse(content);
        if (!parsed.data || !Array.isArray(parsed.data.products) || !Array.isArray(parsed.data.sales)) {
          setRestoreFeedback({
            type: 'error',
            message: 'Uploaded file is not a valid ApexPOS backup structure.',
          });
          setImportedBackupData(null);
        } else {
          setImportedBackupData(parsed);
        }
      } catch (err) {
        console.error('JSON parse error:', err);
        setRestoreFeedback({
          type: 'error',
          message: 'Failed to read file: Not valid JSON format.',
        });
        setImportedBackupData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyRestore = () => {
    if (!importedBackupData) return;
    if (!confirm('Are you sure you want to restore the database from this backup? Current records will be replaced. A safety rollback point will be created automatically.')) {
      return;
    }

    setIsRestoring(true);
    setTimeout(() => {
      const result = storageService.restoreBackup(importedBackupData, currentUser);
      setIsRestoring(false);
      if (result.success) {
        setRestoreFeedback({
          type: 'success',
          message: `Restore complete: ${result.restoredCounts?.products} products, ${result.restoredCounts?.sales} sales, ${result.restoredCounts?.customers} customers synchronized!`,
        });
        setImportedBackupData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        refreshAllLogs();
        if (onDataRestored) onDataRestored();
      } else {
        setRestoreFeedback({
          type: 'error',
          message: result.message,
        });
      }
    }, 400);
  };

  const handleCreateSnapshot = () => {
    const reason = newSnapshotReason.trim() || 'Manual recovery point';
    storageService.createLocalSnapshot(reason, currentUser);
    setNewSnapshotReason('');
    setIsCreatingSnapshot(false);
    refreshAllLogs();
  };

  const handleRestoreSnapshot = (snap: BackupSnapshot) => {
    if (confirm(`Rollback entire database to snapshot: "${snap.reason}" from ${snap.timestamp}?`)) {
      const success = storageService.restoreSnapshot(snap.id, currentUser);
      if (success) {
        setRestoreFeedback({
          type: 'success',
          message: `Successfully rolled back database to "${snap.reason}" (${snap.timestamp}).`,
        });
        refreshAllLogs();
        if (onDataRestored) onDataRestored();
      }
    }
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    if (confirm('Remove this snapshot recovery point?')) {
      storageService.deleteSnapshot(snapshotId);
      refreshAllLogs();
    }
  };

  const handleClearAuthLogs = () => {
    if (currentUser.role !== 'ADMIN') {
      alert('Only administrators can clear login/logout history.');
      return;
    }
    if (confirm('Permanently purge session login/logout logs?')) {
      storageService.clearAuthLogs();
      refreshAllLogs();
    }
  };

  // Distinct staff users for audit filtering
  const allStaff = useMemo(() => storageService.getUsers(), []);

  return (
    <div id="audit-backup-view-root" className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise Governance & Disaster Recovery</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Audit Logs, Login History & System Backup
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Verify login and logout sessions for all roles (Admin, Manager, Cashier), track every input/output and edit function, and manage full database backups.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-create-backup-now"
              onClick={() => storageService.downloadBackupFile(currentUser)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              title="Download instant JSON backup archive of entire store database"
            >
              <Download className="w-4 h-4" />
              <span>Create Backup (JSON)</span>
            </button>

            <button
              id="btn-quick-snapshot"
              onClick={() => setIsCreatingSnapshot(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              title="Save a 1-click rollback recovery point in browser"
            >
              <Database className="w-4 h-4 text-slate-600" />
              <span>Take Snapshot</span>
            </button>
          </div>
        </div>

        {/* Global Summary Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Session History</span>
              <LogIn className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {authLogs.length} Events
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Logins, Logouts & Switches
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Operational Trail</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {auditLogs.length} Edits & IO
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
              Full Input / Output Trace
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Local Snapshots</span>
              <RotateCcw className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {snapshots.length} Points
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">
              1-Click Recovery Ready
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Active Operator</span>
              <UserIcon className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1 truncate">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5 uppercase tracking-wide">
              Role: {currentUser.role}
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot quick-creator dialog if open */}
      {isCreatingSnapshot && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-amber-900">Create Instant Rollback Snapshot</div>
              <input
                type="text"
                placeholder="Reason (e.g., Pre-shift stock count, before price increase)"
                value={newSnapshotReason}
                onChange={(e) => setNewSnapshotReason(e.target.value)}
                className="mt-1 w-full sm:w-80 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsCreatingSnapshot(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSnapshot}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              Save Snapshot
            </button>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          id="tab-btn-auth-logs"
          onClick={() => setActiveTab('auth_logs')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'auth_logs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Login / Logout History ({authLogs.length})</span>
        </button>

        <button
          id="tab-btn-audit-trail"
          onClick={() => setActiveTab('audit_trail')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'audit_trail'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Activity & Input/Output Trail ({auditLogs.length})</span>
        </button>

        <button
          id="tab-btn-backup-center"
          onClick={() => setActiveTab('backup_center')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'backup_center'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Disaster Recovery Center</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LOGIN & LOGOUT HISTORY */}
      {/* ========================================================================= */}
      {activeTab === 'auth_logs' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Controls & Filter Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by operator, email, notes..."
                value={authSearch}
                onChange={(e) => setAuthSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Role filter buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                {(['ALL', 'ADMIN', 'MANAGER', 'CASHIER'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAuthRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      authRoleFilter === r
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r === 'ALL' ? 'All Roles' : r}
                  </button>
                ))}
              </div>

              {/* Action filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                {(['ALL', 'LOGIN', 'LOGOUT', 'SWITCH_USER'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAuthActionFilter(a)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      authActionFilter === a
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {a === 'ALL' ? 'All Events' : a === 'SWITCH_USER' ? 'Switch' : a}
                  </button>
                ))}
              </div>

              {/* Export CSV */}
              <button
                onClick={() => storageService.exportTableToCsv('auth_logs')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
                title="Download CSV spreadsheet of all login/logout sessions"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              {/* Clear (Admin only) */}
              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={handleClearAuthLogs}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium"
                  title="Purge session login history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge</span>
                </button>
              )}
            </div>
          </div>

          {/* Auth Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Event Action</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Session Duration</th>
                    <th className="py-3 px-4">Workstation / Client</th>
                    <th className="py-3 px-4">Notes & Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredAuthLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No login or logout records found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuthLogs.map((log) => {
                      const isLogin = log.action === 'LOGIN';
                      const isLogout = log.action === 'LOGOUT';
                      const isSwitch = log.action === 'SWITCH_USER';

                      const roleBadgeColor =
                        log.role === 'ADMIN'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : log.role === 'MANAGER'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                                {log.userName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{log.userName}</div>
                                <div className="text-[11px] text-slate-400">{log.userEmail}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColor}`}>
                              {log.role}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {isLogin && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                                SIGN IN
                              </span>
                            )}
                            {isLogout && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                                SIGN OUT
                              </span>
                            )}
                            {isSwitch && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                SWITCH
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            {log.timestamp}
                          </td>

                          <td className="py-3 px-4">
                            {log.sessionDurationSeconds ? (
                              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {log.sessionDurationSeconds < 60
                                  ? `${log.sessionDurationSeconds}s`
                                  : `${Math.floor(log.sessionDurationSeconds / 60)} min`}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {log.environment || 'Terminal 01'}
                          </td>

                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={log.details}>
                            {log.details || 'Standard verification'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Showing {filteredAuthLogs.length} of {authLogs.length} total sign in/out events</span>
              <span className="text-[11px] text-slate-400 font-mono">Real-time local authentication journal</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SYSTEM ACTIVITY & INPUT / OUTPUT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit_trail' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search items, invoices, prices, users..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Category Filter */}
              <select
                value={auditCategoryFilter}
                onChange={(e) => setAuditCategoryFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Categories</option>
                <option value="SALES">Sales & Checkouts (IO)</option>
                <option value="PRODUCTS">Products & Pricing</option>
                <option value="INVENTORY">Inventory & Stock Adjustments</option>
                <option value="CUSTOMERS">Customers CRM</option>
                <option value="CATEGORIES">Categories</option>
                <option value="SECURITY_RULES">Security & Role Rules</option>
                <option value="USERS">Staff Users</option>
                <option value="BACKUP_RESTORE">Backups & Disaster Recovery</option>
              </select>

              {/* Operator User Filter */}
              <select
                value={auditUserFilter}
                onChange={(e) => setAuditUserFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Staff Operators</option>
                {allStaff.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>

              {/* Export CSV */}
              <button
                onClick={() => storageService.exportTableToCsv('audit_logs')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Input / Output & Edit Summary</th>
                    <th className="py-3 px-4 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No activity records found matching search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const categoryColors: Record<AuditCategory, string> = {
                        SALES: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        PRODUCTS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        INVENTORY: 'bg-amber-50 text-amber-700 border-amber-200',
                        CUSTOMERS: 'bg-sky-50 text-sky-700 border-sky-200',
                        CATEGORIES: 'bg-purple-50 text-purple-700 border-purple-200',
                        SECURITY_RULES: 'bg-rose-50 text-rose-700 border-rose-200',
                        USERS: 'bg-blue-50 text-blue-700 border-blue-200',
                        BACKUP_RESTORE: 'bg-teal-50 text-teal-700 border-teal-200',
                        AUTH: 'bg-slate-100 text-slate-700 border-slate-200',
                      };

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {log.timestamp}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{log.userName}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{log.userRole}</div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryColors[log.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {log.category}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                              {log.action}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-800">
                            <div className="font-medium text-xs text-slate-900">
                              {log.summary}
                            </div>
                            {log.entityName && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Target: {log.entityName}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedAuditLog(log)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md font-medium text-xs transition-colors"
                              title="Inspect structured input/output JSON payload"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Diff / JSON</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>Showing {filteredAuditLogs.length} of {auditLogs.length} total operations recorded</span>
              <span className="text-[11px] text-slate-400 font-mono">Immutable audit journal</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BACKUP & DISASTER RECOVERY CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'backup_center' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Feedback banner if any */}
          {restoreFeedback && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                restoreFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {restoreFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-bold text-sm">
                  {restoreFeedback.type === 'success' ? 'Operation Succeeded' : 'Operation Notice'}
                </div>
                <div className="mt-0.5">{restoreFeedback.message}</div>
              </div>
              <button
                onClick={() => setRestoreFeedback(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 2-Column Layout: Export on Left, Restore on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Full System Backup Export */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Export Complete System Backup</h2>
                    <p className="text-xs text-slate-500">Save a complete, portable JSON snapshot of all database records.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  Backing up packages your complete catalog, category departments, stock movements, customers directory, transaction invoices, customized role permission rules, and audit trails.
                </p>

                {/* Database counts preview */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-base font-bold text-slate-900">{storageService.getProducts().length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Products</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-base font-bold text-slate-900">{storageService.getSales().length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Sales Invoices</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-base font-bold text-slate-900">{storageService.getCustomers().length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Customers</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  id="btn-download-backup-action"
                  onClick={() => {
                    storageService.downloadBackupFile(currentUser);
                    refreshAllLogs();
                    setRestoreFeedback({
                      type: 'success',
                      message: 'Backup JSON archive generated and downloaded. Automatic recovery point also saved locally.',
                    });
                  }}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Backup Archive (.json)
                </button>
              </div>
            </div>

            {/* Card 2: Restore Database from File */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Restore Database from Backup File</h2>
                    <p className="text-xs text-slate-500">Upload a valid ApexPOS `.json` file to restore all store state.</p>
                  </div>
                </div>

                {/* File picker */}
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Select ApexPOS Backup JSON File:
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl p-1"
                  />
                </div>

                {/* Pre-restore Validation Preview */}
                {importedBackupData && (
                  <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-slate-800 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Valid ApexPOS Backup Archive</span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Exported on: <strong>{importedBackupData.exportedAt || 'Unknown date'}</strong> by{' '}
                      <strong>{importedBackupData.exportedBy?.name || 'Admin'} ({importedBackupData.exportedBy?.role})</strong>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                      <span className="bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {importedBackupData.data.products?.length || 0} Products
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {importedBackupData.data.sales?.length || 0} Sales
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {importedBackupData.data.customers?.length || 0} Customers
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium pt-1">
                      Safety notice: Current data will be safely archived to a recovery snapshot before restore.
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  id="btn-apply-restore-action"
                  disabled={!importedBackupData || isRestoring || !canManageBackups}
                  onClick={handleApplyRestore}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors ${
                    !importedBackupData || !canManageBackups
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  {isRestoring ? 'Restoring Database...' : 'Confirm & Apply Restore'}
                </button>
                {!canManageBackups && (
                  <p className="text-[10px] text-slate-400 text-center mt-1.5 italic">
                    Restoring requires Administrator or `manageBackups` role permission.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Local Recovery Snapshots */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Instant Local Recovery Snapshots</h2>
                <p className="text-xs text-slate-500">
                  Quick rollback points saved directly in the browser. You can roll back to any snapshot with 1 click.
                </p>
              </div>

              <button
                onClick={() => setIsCreatingSnapshot(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Snapshot</span>
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No local snapshots recorded yet. Click "New Snapshot" above to create your first instant recovery point.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3.5 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{snap.reason}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {snap.timestamp}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span>Created by: {snap.authorName} ({snap.authorRole})</span>
                        <span>•</span>
                        <span>{snap.stats?.productsCount || 0} Products</span>
                        <span>•</span>
                        <span>{snap.stats?.salesCount || 0} Sales</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleRestoreSnapshot(snap)}
                        disabled={!canManageBackups}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          !canManageBackups
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                        title="Rollback database to this snapshot"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Rollback</span>
                      </button>

                      {currentUser.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Granular Table CSV Downloads */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Granular Spreadsheet CSV Exports</h2>
              <p className="text-xs text-slate-500">
                Download individual table spreadsheets compatible with Excel, Google Sheets, or ERP tools.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'Products Catalog', key: 'products' as const, count: storageService.getProducts().length },
                { name: 'Sales Orders', key: 'sales' as const, count: storageService.getSales().length },
                { name: 'Customer Directory', key: 'customers' as const, count: storageService.getCustomers().length },
                { name: 'Stock Movement Logs', key: 'stock' as const, count: storageService.getStockLogs().length },
                { name: 'Login & Logouts', key: 'auth_logs' as const, count: authLogs.length },
                { name: 'Full Audit Trail', key: 'audit_logs' as const, count: auditLogs.length },
              ].map((tbl) => (
                <button
                  key={tbl.key}
                  onClick={() => storageService.exportTableToCsv(tbl.key)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all group"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <div className="text-xs font-bold text-slate-900 mt-2">{tbl.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{tbl.count} entries</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT LOG PAYLOAD / DIFF INSPECTION MODAL */}
      {/* ========================================================================= */}
      {selectedAuditLog && (
        <div
          id="audit-details-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAuditLog(null);
          }}
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedAuditLog.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedAuditLog.action}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedAuditLog.summary}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Operator and Metadata details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Operator</span>
                <span className="font-semibold text-slate-900">
                  {selectedAuditLog.userName} ({selectedAuditLog.userRole})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Timestamp</span>
                <span className="font-mono text-slate-700">{selectedAuditLog.timestamp}</span>
              </div>
              {selectedAuditLog.entityId && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Entity Identifier</span>
                  <span className="font-mono text-slate-700">{selectedAuditLog.entityId}</span>
                </div>
              )}
              {selectedAuditLog.entityName && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Entity Name</span>
                  <span className="text-slate-700">{selectedAuditLog.entityName}</span>
                </div>
              )}
            </div>

            {/* Structured payload / JSON */}
            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">
                Input / Output Data Payload:
              </span>
              <pre className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-3.5 rounded-xl overflow-x-auto max-h-60 leading-relaxed border border-slate-800">
                {typeof selectedAuditLog.details === 'string'
                  ? selectedAuditLog.details
                  : JSON.stringify(selectedAuditLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
