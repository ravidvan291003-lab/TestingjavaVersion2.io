import React, { useState } from 'react';
import { CODE_FILES, JAVA_PROJECT_STRUCTURE } from '../data/javaCodeTemplates';
import { ServerRunnerTab } from './ServerRunnerTab';
import {
  Server,
  Database,
  Code2,
  FileCode,
  Copy,
  Check,
  Download,
  Layers,
  ArrowRight,
  ArrowDown,
  ExternalLink,
  BookOpen,
  Terminal,
  FolderTree,
  Cpu,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const JavaArchitectureView: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'SERVERS_RUNNER' | 'ARCHITECTURE' | 'CODE_EXPLORER' | 'DATABASE_SCHEMA' | 'STUDENT_SYS'>('SERVERS_RUNNER');
  const [copied, setCopied] = useState(false);

  const selectedFile = CODE_FILES[selectedFileIndex] || CODE_FILES[0];

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="java-architecture-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Java EE • JSP • Servlet • JDBC • MySQL
            </span>
            <span className="text-xs text-slate-500 font-mono">Apache Tomcat / IntelliJ IDEA</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Java Architecture & Source Code Studio
          </h1>
          <p className="text-sm text-slate-500">
            Multi-tiered enterprise MVC architecture: Browser ➔ JSP Pages ➔ Servlet ➔ DAO ➔ JDBC ➔ MySQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-active-java-file"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            {copied ? 'Copied Code' : 'Copy Active File'}
          </button>
          <button
            id="download-active-java-file"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Download ({selectedFile.name})
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('SERVERS_RUNNER')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap relative ${
            activeTab === 'SERVERS_RUNNER' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Server className="w-4 h-4" /> Node.js &amp; Tomcat Runner
          {activeTab === 'SERVERS_RUNNER' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ARCHITECTURE')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap relative ${
            activeTab === 'ARCHITECTURE' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Architectural Pipeline
          {activeTab === 'ARCHITECTURE' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('CODE_EXPLORER')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap relative ${
            activeTab === 'CODE_EXPLORER' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code2 className="w-4 h-4" /> Java Source Explorer ({CODE_FILES.length} Files)
          {activeTab === 'CODE_EXPLORER' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('DATABASE_SCHEMA')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap relative ${
            activeTab === 'DATABASE_SCHEMA' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" /> MySQL Relational Schema
          {activeTab === 'DATABASE_SCHEMA' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('STUDENT_SYS')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap relative ${
            activeTab === 'STUDENT_SYS' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Student Management System
          {activeTab === 'STUDENT_SYS' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab 0: Node.js & Tomcat Server Runner */}
      {activeTab === 'SERVERS_RUNNER' && <ServerRunnerTab />}

      {/* Tab 1: Architecture Pipeline */}
      {activeTab === 'ARCHITECTURE' && (
        <div className="space-y-6">
          {/* Main Tier Pipeline Diagram */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Enterprise Multi-Tier MVC Pipeline
            </h2>
            <p className="text-sm text-slate-500">
              Each layer maintains strict separation of concerns, decoupling HTTP request dispatching from database transactions.
            </p>

            {/* Desktop Flow Row / Mobile Stack */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-center">
              {/* Step 1: Browser */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-2">
                  1
                </div>
                <div className="font-bold text-slate-900 text-sm">Browser</div>
                <div className="text-[11px] text-slate-500 mt-1">HTML / CSS / Bootstrap / JS</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="w-5 h-5" />
              </div>

              {/* Step 2: JSP Pages */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-2">
                  2
                </div>
                <div className="font-bold text-slate-900 text-sm">JSP Pages</div>
                <div className="text-[11px] text-slate-500 mt-1">View templates & JSTL tags</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="w-5 h-5" />
              </div>

              {/* Step 3: Servlet */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 mx-auto rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-2">
                  3
                </div>
                <div className="font-bold text-slate-900 text-sm">Servlet (Controller)</div>
                <div className="text-[11px] text-slate-500 mt-1">HttpServlet & Filter routing</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="w-5 h-5" />
              </div>

              {/* Step 4: Service / DAO */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2">
                  4
                </div>
                <div className="font-bold text-slate-900 text-sm">Service / DAO</div>
                <div className="text-[11px] text-slate-500 mt-1">Business logic & CRUD operations</div>
              </div>
            </div>

            {/* Sub-flow to JDBC and MySQL */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                <div className="font-bold text-amber-900 text-sm">JDBC Interface</div>
                <div className="text-xs text-amber-700 mt-0.5">PreparedStatement & Connection Pooling</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                <div className="font-bold text-emerald-900 text-sm">MySQL 8.0 Database</div>
                <div className="text-xs text-emerald-700 mt-0.5">Relational tables with foreign key integrity</div>
              </div>
            </div>
          </div>

          {/* User's Exact Flow Example Breakdown */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Concrete Component Flow Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Example 1: Login */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Example A: Authentication Flow</div>
                <div className="space-y-2 font-mono text-xs text-slate-700">
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span>1. login.jsp</span>
                    <span className="text-[11px] text-slate-400 font-sans">User enters credentials</span>
                  </div>
                  <div className="text-center text-slate-400 font-sans">↓ HTTP POST</div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span>2. LoginServlet.java</span>
                    <span className="text-[11px] text-slate-400 font-sans">Extracts params & session</span>
                  </div>
                  <div className="text-center text-slate-400 font-sans">↓ invokes</div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span>3. UserDAO.java</span>
                    <span className="text-[11px] text-slate-400 font-sans">Queries users table</span>
                  </div>
                  <div className="text-center text-slate-400 font-sans">↓ obtains connection</div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span>4. DBConnection.java</span>
                    <span className="text-[11px] text-slate-400 font-sans">JDBC Driver Manager</span>
                  </div>
                  <div className="text-center text-slate-400 font-sans">↓ executes SQL</div>
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 font-bold flex items-center justify-between">
                    <span>5. MySQL: users table</span>
                    <span className="text-[11px] font-sans font-normal">Authenticates & returns User</span>
                  </div>
                </div>
              </div>

              {/* Example 2: POS Sale */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Example B: Sales Checkout Flow</div>
                <div className="space-y-2 font-mono text-xs text-slate-700">
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span>1. pos.jsp / invoice.jsp</span>
                    <span className="text-[11px] text-slate-400 font-sans">Cart items & payment</span>
                  </div>
                  <div className="text-center text-slate-400 font-sans">↓ HTTP POST</div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span>2. SalesServlet.java</span>
                    <span className="text-[11px] text-slate-400 font-sans">Validates cart & cashier ID</span>
                  </div>
                  <div className="text-center text-slate-400 font-sans">↓ transactional commit</div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span>3. SaleDAO.java & StockDAO.java</span>
                    <span className="text-[11px] text-slate-400 font-sans">Deducts stock & writes order</span>
                  </div>
                  <div className="text-center text-slate-400 font-sans">↓ JDBC transaction</div>
                  <div className="p-2 bg-white rounded border border-slate-200 flex items-center justify-between">
                    <span>4. DBConnection.java</span>
                    <span className="text-[11px] text-slate-400 font-sans">Auto-commit = false</span>
                  </div>
                  <div className="text-center text-slate-400 font-sans">↓ writes tables</div>
                  <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-800 font-bold flex items-center justify-between">
                    <span>5. MySQL: sales + sale_details</span>
                    <span className="text-[11px] font-sans font-normal">Generates invoice record</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Code Explorer */}
      {activeTab === 'CODE_EXPLORER' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* File selector sidebar */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Files</span>
              <span className="text-xs text-slate-400">{CODE_FILES.length} ready to use</span>
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {CODE_FILES.map((file, idx) => (
                <button
                  key={file.name}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between ${
                    selectedFileIndex === idx
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-4 h-4 shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                      selectedFileIndex === idx
                        ? 'bg-indigo-700 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {file.language}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-900 shadow-lg overflow-hidden flex flex-col">
            <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="font-mono text-slate-200 font-semibold ml-2">
                  {selectedFile.path}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  Download
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-800/40 text-xs text-slate-400 border-b border-slate-700/60 font-sans">
              {selectedFile.description}
            </div>

            <pre className="p-4 text-xs font-mono text-slate-100 overflow-x-auto max-h-[550px] leading-relaxed select-text">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: MySQL Relational Schema */}
      {activeTab === 'DATABASE_SCHEMA' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Database Schema (pos_inventory_db)</h2>
                <p className="text-xs text-slate-500 mt-1">
                  6 Normalized tables configured with InnoDB foreign keys and ACID transaction support.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                MySQL 8.0+ Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Table 1: users */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>users</span>
                  <span className="text-[10px] text-slate-400 font-mono">AUTH & ROLES</span>
                </div>
                <ul className="text-xs font-mono space-y-1 text-slate-600">
                  <li className="font-bold text-indigo-600">🔑 id (INT, PK)</li>
                  <li>• username (VARCHAR 50)</li>
                  <li>• password (VARCHAR 255)</li>
                  <li>• role (ENUM: ADMIN/MANAGER/CASHIER)</li>
                  <li>• status (ENUM: ACTIVE/INACTIVE)</li>
                </ul>
              </div>

              {/* Table 2: categories */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>categories</span>
                  <span className="text-[10px] text-slate-400 font-mono">TAXONOMY</span>
                </div>
                <ul className="text-xs font-mono space-y-1 text-slate-600">
                  <li className="font-bold text-indigo-600">🔑 id (INT, PK)</li>
                  <li>• code (VARCHAR 20)</li>
                  <li>• name (VARCHAR 100)</li>
                  <li>• description (TEXT)</li>
                  <li>• color (VARCHAR 20)</li>
                </ul>
              </div>

              {/* Table 3: products */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>products</span>
                  <span className="text-[10px] text-slate-400 font-mono">INVENTORY</span>
                </div>
                <ul className="text-xs font-mono space-y-1 text-slate-600">
                  <li className="font-bold text-indigo-600">🔑 id (INT, PK)</li>
                  <li>• category_id (INT, FK ➔ categories)</li>
                  <li>• name (VARCHAR 150)</li>
                  <li>• price (DECIMAL 10,2)</li>
                  <li>• quantity / stock (INT)</li>
                  <li>• status (VARCHAR 20)</li>
                </ul>
              </div>

              {/* Table 4: customers */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>customers</span>
                  <span className="text-[10px] text-slate-400 font-mono">CRM</span>
                </div>
                <ul className="text-xs font-mono space-y-1 text-slate-600">
                  <li className="font-bold text-indigo-600">🔑 id (INT, PK)</li>
                  <li>• name (VARCHAR 100)</li>
                  <li>• phone (VARCHAR 30)</li>
                  <li>• address (TEXT)</li>
                  <li>• total_spent (DECIMAL 12,2)</li>
                </ul>
              </div>

              {/* Table 5: sales */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>sales</span>
                  <span className="text-[10px] text-slate-400 font-mono">ORDERS</span>
                </div>
                <ul className="text-xs font-mono space-y-1 text-slate-600">
                  <li className="font-bold text-indigo-600">🔑 id (INT, PK)</li>
                  <li>• customer_id (INT, FK ➔ customers)</li>
                  <li>• user_id / cashier_id (INT, FK ➔ users)</li>
                  <li>• sale_date (TIMESTAMP)</li>
                  <li>• total (DECIMAL 10,2)</li>
                  <li>• payment_method (ENUM)</li>
                </ul>
              </div>

              {/* Table 6: sale_details */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>sale_details</span>
                  <span className="text-[10px] text-slate-400 font-mono">ORDER LINE ITEMS</span>
                </div>
                <ul className="text-xs font-mono space-y-1 text-slate-600">
                  <li className="font-bold text-indigo-600">🔑 id (INT, PK)</li>
                  <li>• sale_id (INT, FK ➔ sales)</li>
                  <li>• product_id (INT, FK ➔ products)</li>
                  <li>• quantity (INT)</li>
                  <li>• price (DECIMAL 10,2)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Student Management System Alternative */}
      {activeTab === 'STUDENT_SYS' && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Student Management System (Simpler Alternative)</h2>
              <p className="text-xs text-slate-500">
                A streamlined alternative suggested for quick university or academic grading projects.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Architecture Flow:</h3>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs space-y-2 text-slate-700">
                <div>Login (login.jsp)</div>
                <div className="text-slate-400">  ↓</div>
                <div>Dashboard (dashboard.jsp)</div>
                <div className="text-slate-400">  ↓</div>
                <div>Student Management (student.jsp)</div>
                <div className="text-indigo-600 pl-4">├── Add Student (StudentServlet?action=add)</div>
                <div className="text-indigo-600 pl-4">├── Edit Student (StudentServlet?action=edit)</div>
                <div className="text-indigo-600 pl-4">├── Delete Student (StudentServlet?action=delete)</div>
                <div className="text-indigo-600 pl-4">├── Search Student (StudentServlet?action=search)</div>
                <div className="text-indigo-600 pl-4">└── View Students (StudentServlet?action=list)</div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-4">Database Schema:</h3>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto">
                <pre>{`CREATE DATABASE student_management_db;
USE student_management_db;

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(50) NOT NULL,
    enrollment_year INT NOT NULL,
    gpa DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}</pre>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Java DAO Implementation Sample:</h3>
              <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-96">
                <pre>{`public class StudentDAO {
    public List<Student> getAllStudents() throws SQLException {
        List<Student> list = new ArrayList<>();
        String sql = "SELECT * FROM students ORDER BY id DESC";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Student s = new Student();
                s.setId(rs.getInt("id"));
                s.setRollNumber(rs.getString("roll_number"));
                s.setFirstName(rs.getString("first_name"));
                s.setLastName(rs.getString("last_name"));
                s.setEmail(rs.getString("email"));
                s.setDepartment(rs.getString("department"));
                s.setGpa(rs.getDouble("gpa"));
                list.add(s);
            }
        }
        return list;
    }

    public boolean addStudent(Student s) throws SQLException {
        String sql = "INSERT INTO students (roll_number, first_name, last_name, email, phone, department, enrollment_year, gpa) VALUES (?,?,?,?,?,?,?,?)";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, s.getRollNumber());
            ps.setString(2, s.getFirstName());
            ps.setString(3, s.getLastName());
            ps.setString(4, s.getEmail());
            ps.setString(5, s.getPhone());
            ps.setString(6, s.getDepartment());
            ps.setInt(7, s.getEnrollmentYear());
            ps.setDouble(8, s.getGpa());
            return ps.executeUpdate() > 0;
        }
    }
}`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
