
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Wallet,
  ShoppingCart,
  UserCheck,
  Plus,
  Truck,
  Package,
  X,
  Tag,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Download,
  Pencil,
  Euro,
  AlertCircle,
  Trash2,
  Users,
  FileText,
  ChevronRight,
  Building2,
  User,
  Phone,
  Mail,
  ChevronDown,
  CheckCircle,
  Clock,
  Edit2,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Printer
} from 'lucide-react';
import { Expense, Supplier, Invoice, Project, PayrollEntry, Employee } from '../types';
import AccountingReportsTab from './AccountingReportsTab';
import { addInvoice, deleteInvoice as deleteInvoiceSvc, loadInvoices } from '../services/invoiceService';
import ConfirmModal from './ConfirmModal';
import Toast, { ToastType } from './Toast';

interface AccountingProps {
  selectedProjectId?: string;
  projects?: Project[];
  onUpdateProject?: (project: Project) => void;
  onCreateQuote?: () => void;
}

const Accounting: React.FC<AccountingProps> = ({ selectedProjectId, projects, onUpdateProject, onCreateQuote }) => {
  const project = projects?.find(p => p.id === selectedProjectId);

  // State for local global transactions (not project-specific)
  const [localGlobalTransactions, setLocalGlobalTransactions] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'suppliers' | 'categories' | 'invoices' | 'reports'>('transactions');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'Materiali', 'Ricavi', 'Manodopera', 'Noleggi', 'Materiali Speciali', 'Altro'
  ]);

  // Payroll/Employee Data
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeNotes, setEmployeeNotes] = useState<Record<string, string>>({});

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Initial Load
  const loadAllData = useCallback(() => {
    const globalExpenses = localStorage.getItem('global_transactions');
    if (globalExpenses) {
      try { setLocalGlobalTransactions(JSON.parse(globalExpenses)); } catch (e) { }
    }

    const savedCategories = localStorage.getItem('accounting_categories');
    if (savedCategories) {
      try { setCategories(JSON.parse(savedCategories)); } catch (e) { }
    }

    const savedSuppliers = localStorage.getItem('edilsmart_suppliers');
    if (savedSuppliers) {
      try { setSuppliers(JSON.parse(savedSuppliers)); } catch (e) { }
    }

    const savedPayroll = localStorage.getItem('edilsmart_payroll_entries');
    if (savedPayroll) {
      try { setPayrollEntries(JSON.parse(savedPayroll)); } catch (e) { }
    }

    const savedEmployees = localStorage.getItem('edilsmart_employees');
    if (savedEmployees) {
      try { setEmployees(JSON.parse(savedEmployees)); } catch (e) { }
    }

    const savedInvoices = localStorage.getItem('edilsmart_invoices');
    if (savedInvoices) {
      try { setInvoices(JSON.parse(savedInvoices)); } catch (e) { }
    }
  }, []);

  useEffect(() => {
    loadAllData();

    // Listeners
    window.addEventListener('company-settings-updated', loadAllData);
    window.addEventListener('payroll-updated', loadAllData);
    window.addEventListener('storage', loadAllData);

    return () => {
      window.removeEventListener('company-settings-updated', loadAllData);
      window.removeEventListener('payroll-updated', loadAllData);
      window.removeEventListener('storage', loadAllData);
    };
  }, [loadAllData]);

  // Sync Global Transactions
  useEffect(() => {
    if (!project) {
      localStorage.setItem('global_transactions', JSON.stringify(localGlobalTransactions));
    }
  }, [localGlobalTransactions, project?.id]);

  // Combined data for display and filtering
  const allTransactions = useMemo(() => {
    let result: Expense[] = [];

    if (project) {
      // Single Project View
      result = [...(project.expenses || [])];
    } else if (projects) {
      // Global View: Aggregate from all projects + general entries
      result = [...localGlobalTransactions];
      projects.forEach(p => {
        if (p.expenses) {
          const pExp = p.expenses.map(e => ({
            ...e,
            description: `${e.description} [${p.name}]`
          }));
          result = [...result, ...pExp];
        }
      });
    }

    // Add Payroll (Virtual Expenses)
    const virtualPayrollExpenses: Expense[] = payrollEntries
      .filter(pe => !project || pe.projectId === project.id)
      .map(pe => {
        const emp = employees.find(e => e.id === pe.employeeId);
        const proj = projects?.find(p => p.id === pe.projectId);
        return {
          id: `payroll_${pe.id}`,
          date: pe.date,
          description: `Dipendente: ${emp?.name || 'Sconosciuto'}${!project && proj ? ` [${proj.name}]` : ''}`,
          amount: -(pe.amount || 0), // Outflow is negative
          category: 'Manodopera',
          status: 'Pagato' as const,
        };
      });

    return [...result, ...virtualPayrollExpenses];
  }, [localGlobalTransactions, projects, payrollEntries, employees, project?.id]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStart = !startDate || t.date >= startDate;
      const matchesEnd = !endDate || t.date <= endDate;
      const matchesCategory = !filterCategory || t.category === filterCategory;
      return matchesSearch && matchesStart && matchesEnd && matchesCategory;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [allTransactions, startDate, endDate, searchTerm, filterCategory]);

  const stats = useMemo(() => {
    let incomePaid = 0;
    let incomePending = 0;
    let expensesPaid = 0;
    let expensesPending = 0;

    filteredTransactions.forEach(t => {
      const isIncome = t.category === 'Ricavi' || t.amount > 0;
      const absAmount = Math.abs(t.amount);
      const isPaid = t.status === 'Pagato';

      if (isIncome) {
        if (isPaid) incomePaid += absAmount;
        else incomePending += absAmount;
      } else {
        if (isPaid) expensesPaid += absAmount;
        else expensesPending += absAmount;
      }
    });

    return {
      incomePaid,
      incomePending,
      expensesPaid,
      expensesPending,
      netBalance: incomePaid - expensesPaid
    };
  }, [filteredTransactions]);

  // Modal & Popup States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Expense | null>(null);
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: 'Materiali',
    status: 'In Attesa'
  });
  const [editingCategory, setEditingCategory] = useState<{ old: string; new: string } | null>(null);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({ name: '', vatNumber: '', email: '', phone: '', category: '' });
  const [activeNote, setActiveNote] = useState<{ name: string, note: string } | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    status: 'Bozza'
  });
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState<string | null>(null);

  // Handlers
  const handleStatusChange = (id: string, newStatus: 'Pagato' | 'In Attesa') => {
    if (id.startsWith('payroll_')) return;

    // Find where the transaction is
    const projWhereExists = projects?.find(p => p.expenses?.some(e => e.id === id));
    if (projWhereExists && onUpdateProject) {
      const upd = projWhereExists.expenses?.map(e => e.id === id ? { ...e, status: newStatus } : e) || [];
      onUpdateProject({ ...projWhereExists, expenses: upd });
    } else {
      setLocalGlobalTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }

    setStatusMenuOpen(null);
    setToast({ message: `Stato aggiornato a ${newStatus}`, type: 'success' });
  };

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'Ricavi': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Materiali Speciali': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Manodopera': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Noleggi': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Materiali': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransaction.description && newTransaction.amount !== undefined) {
      const finalAmount = (newTransaction.category === 'Ricavi')
        ? Math.abs(newTransaction.amount)
        : (newTransaction.amount > 0 ? -newTransaction.amount : newTransaction.amount);

      const transaction: Expense = {
        id: Math.random().toString(36).substr(2, 9),
        date: newTransaction.date || new Date().toISOString().split('T')[0],
        description: newTransaction.description,
        amount: finalAmount,
        category: newTransaction.category || 'Altro',
        status: newTransaction.status as 'Pagato' | 'In Attesa' || 'In Attesa',
        invoiceNumber: newTransaction.invoiceNumber,
        paymentType: newTransaction.paymentType,
        projectId: project?.id
      };

      if (project && onUpdateProject) {
        onUpdateProject({
          ...project,
          expenses: [transaction, ...(project.expenses || [])]
        });
      } else {
        setLocalGlobalTransactions([transaction, ...localGlobalTransactions]);
      }

      setIsNewTransactionModalOpen(false);
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: 'Materiali',
        status: 'In Attesa'
      });
      setToast({ message: 'Operazione registrata con successo', type: 'success' });
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const projWhereExists = projects?.find(p => p.expenses?.some(e => e.id === id));
    if (projWhereExists && onUpdateProject) {
      const upd = projWhereExists.expenses?.filter(e => e.id !== id) || [];
      onUpdateProject({ ...projWhereExists, expenses: upd });
    } else {
      setLocalGlobalTransactions(localGlobalTransactions.filter(t => t.id !== id));
    }
    setDeletingTransactionId(null);
    setToast({ message: 'Registrazione eliminata con successo', type: 'success' });
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      const finalAmount = editingTransaction.category === 'Ricavi'
        ? Math.abs(editingTransaction.amount)
        : (editingTransaction.amount > 0 ? -editingTransaction.amount : editingTransaction.amount);

      const updT = { ...editingTransaction, amount: finalAmount };

      const projWhereExists = projects?.find(p => p.expenses?.some(e => e.id === updT.id));
      if (projWhereExists && onUpdateProject) {
        const upd = projWhereExists.expenses?.map(t => t.id === updT.id ? updT : t) || [];
        onUpdateProject({ ...projWhereExists, expenses: upd });
      } else {
        setLocalGlobalTransactions(prev => prev.map(t => t.id === updT.id ? updT : t));
      }

      setIsEditModalOpen(false);
      setEditingTransaction(null);
      setToast({ message: 'Registrazione aggiornata con successo', type: 'success' });
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setFilterCategory('');
  };

  const handleOpenEdit = (t: Expense) => {
    setEditingTransaction({ ...t });
    setIsEditModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["Data", "Descrizione", "Categoria", "Stato", "Importo"];
    const csvRows = filteredTransactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.status,
      t.amount.toFixed(2)
    ]);

    const csvContent = [headers, ...csvRows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `export_accounting_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <CreditCard className="text-blue-600" />
            Contabilità {project ? `- ${project.name}` : 'Globale'}
          </h1>
          <p className="text-slate-500 mt-1">Gestione finanziaria, entrate e uscite.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewTransactionModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-blue-100"
          >
            <Plus size={18} />
            Nuova Operazione
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md ml-auto"
          >
            <Printer size={18} />
            Stampa Report
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-semibold border border-slate-200 transition-all"
          >
            <Download size={18} />
            Esporta
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <ArrowDownRight size={24} />
            </div>
            <span className="text-slate-600 font-medium">Totale Entrate</span>
          </div>
          <div className="text-3xl font-bold text-emerald-700">
            € {(stats.incomePaid + stats.incomePending).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-sm text-emerald-600 flex justify-between">
            <span>Pagati: € {stats.incomePaid.toLocaleString('it-IT')}</span>
            <span>Pendenti: € {stats.incomePending.toLocaleString('it-IT')}</span>
          </div>
        </div>

        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
              <ArrowUpRight size={24} />
            </div>
            <span className="text-slate-600 font-medium">Totale Uscite</span>
          </div>
          <div className="text-3xl font-bold text-rose-700">
            € {(stats.expensesPaid + stats.expensesPending).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-sm text-rose-600 flex justify-between">
            <span>Pagati: € {stats.expensesPaid.toLocaleString('it-IT')}</span>
            <span>Pendenti: € {stats.expensesPending.toLocaleString('it-IT')}</span>
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Wallet size={24} />
            </div>
            <span className="text-slate-600 font-medium">Bilancio Netto</span>
          </div>
          <div className={`text-3xl font-bold ${stats.netBalance >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
            € {stats.netBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-blue-600/70 text-xs mt-2 font-medium italic">Basato sui pagamenti effettuati.</p>
        </div>

        <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-white text-slate-600 rounded-xl">
              <RefreshCw size={24} />
            </div>
            <span className="text-slate-600 font-medium">Transazioni</span>
          </div>
          <div className="text-3xl font-bold text-slate-700">
            {filteredTransactions.length}
          </div>
          <p className="text-slate-500 text-sm mt-2 font-medium">Movimenti totali registrati.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit print:hidden">
        {[
          { id: 'transactions', label: 'Transazioni', icon: RefreshCw },
          { id: 'reports', label: 'Report', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-800'
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:hidden">
        {activeTab === 'transactions' && (
          <>
            {/* SEARCH & FILTERS BAR */}
            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Cerca per descrizione, categoria o importo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${showFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <Filter size={20} />
                  Filtri
                </button>
                {(startDate || endDate || filterCategory) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-semibold text-rose-500 hover:text-rose-600 underline"
                  >
                    Resetta
                  </button>
                )}
              </div>
            </div>

            {/* EXPANDABLE FILTERS */}
            {showFilters && (
              <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">Da data</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">A data</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">Categoria</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Tutte le categorie</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* TRANSACTIONS TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left">Data</th>
                    <th className="px-6 py-4 text-left">Descrizione</th>
                    <th className="px-6 py-4 text-left">Categoria</th>
                    <th className="px-6 py-4 text-center">Stato</th>
                    <th className="px-6 py-4 text-right">Importo</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider print:hidden">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(t.date).toLocaleDateString('it-IT')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{t.description}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getCategoryStyle(t.category)}`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center relative">
                            <button
                              disabled={t.id.startsWith('payroll_')}
                              onClick={() => setStatusMenuOpen(statusMenuOpen === t.id ? null : t.id)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${t.status === 'Pagato'
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                }`}
                            >
                              {t.status === 'Pagato' ? <CheckCircle size={14} /> : <Clock size={14} />}
                              {t.status}
                              {!t.id.startsWith('payroll_') && <ChevronDown size={14} />}
                            </button>

                            {statusMenuOpen === t.id && (
                              <div className="absolute top-full mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[120px]">
                                {['Pagato', 'In Attesa'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusChange(t.id, status as any)}
                                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold text-lg whitespace-nowrap ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.amount >= 0 ? '+' : '-'} € {Math.abs(t.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center print:hidden">
                          <div className="flex items-center justify-center gap-2">
                            {!t.id.startsWith('payroll_') ? (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(t)}
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Modifica"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => setDeletingTransactionId(t.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Elimina"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold">INFO</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                        <RefreshCw size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-medium">Nessuna transazione trovata</p>
                        <p className="text-sm">Prova a cambiare i filtri o aggiungi una nuova operazione.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ... Other Tabs remain same concept ... */}


        {activeTab === 'reports' && (
          <div className="p-8">
            <AccountingReportsTab
              transactions={allTransactions}
              suppliers={suppliers}
              categories={categories}
            />
          </div>
        )}
      </div>

      {/* MODALS */}
      {isNewTransactionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">Nuova Registrazione</h3>
              <button
                onClick={() => setIsNewTransactionModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 ml-1 italic">Data Operazione</label>
                  <input
                    type="date"
                    required
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 ml-1 italic">Categoria</label>
                  <select
                    value={newTransaction.category}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 ml-1 italic">Descrizione</label>
                <input
                  type="text"
                  required
                  placeholder="Esempio: Acquisto Cemento o Acconto Lavori..."
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 ml-1 italic">Importo (€)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">€</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={newTransaction.amount === 0 ? '' : newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 ml-1 italic">Stato Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewTransaction({ ...newTransaction, status: 'Pagato' })}
                      className={`py-3 rounded-2xl text-xs font-bold border transition-all ${newTransaction.status === 'Pagato'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-500'
                        }`}
                    >
                      Pagato
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTransaction({ ...newTransaction, status: 'In Attesa' })}
                      className={`py-3 rounded-2xl text-xs font-bold border transition-all ${newTransaction.status === 'In Attesa'
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-amber-500'
                        }`}
                    >
                      Pendete
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsNewTransactionModalOpen(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Indietro
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 transition-all"
                >
                  Conferma Registrazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Modifica Operazione</h3>
            <form onSubmit={handleUpdateTransaction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Descrizione</label>
                <input
                  type="text"
                  required
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Data</label>
                  <input
                    type="date"
                    value={editingTransaction.date}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">Importo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={Math.abs(editingTransaction.amount)}
                    onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold">Annulla</button>
                <button type="submit" className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">Salva Modifiche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={!!deletingTransactionId}
        title="Elimina Registrazione"
        message="Sei sicuro di voler eliminare questa operazione? L'azione non può essere annullata."
        confirmText="Sì, elimina"
        cancelText="Annulla"
        type="danger"
        onConfirm={() => {
          if (deletingTransactionId) handleDeleteTransaction(deletingTransactionId);
        }}
        onCancel={() => setDeletingTransactionId(null)}
      />

      {/* TOASTS */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {/* Printable Report Section */}
      <div className="hidden print:block bg-white p-8">
        <style>{`
            @media print {
                @page { size: A4 portrait; margin: 15mm; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
            }
        `}</style>

        {/* Report Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase">Report Movimenti</h1>
            <p className="text-slate-500 mt-1">Edilsmart - Contabilità Professionale</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-slate-800">Data Report: {new Date().toLocaleDateString('it-IT')}</p>
            <p className="text-sm text-slate-600">
              {project ? `Cantiere: ${project.name}` : 'Bilancio Globale'}
            </p>
            {(startDate || endDate) && (
              <p className="text-xs text-slate-500 mt-1">
                Periodo: {startDate ? new Date(startDate).toLocaleDateString('it-IT') : 'Inizio'} - {endDate ? new Date(endDate).toLocaleDateString('it-IT') : 'Fine'}
              </p>
            )}
          </div>
        </div>

        {/* Stats Summary for Print */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Totale Entrate</p>
            <p className="text-lg font-bold text-emerald-600">€ {stats.incomePaid.toLocaleString('it-IT')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Totale Uscite</p>
            <p className="text-lg font-bold text-rose-600">€ {stats.expensesPaid.toLocaleString('it-IT')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Bilancio Netto</p>
            <p className="text-lg font-bold text-blue-600">€ {stats.netBalance.toLocaleString('it-IT')}</p>
          </div>
        </div>

        {/* Main Table */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300">
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-700">Data</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-700">Descrizione</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-700">Categoria</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-700">Stato</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase text-slate-700 text-right">Importo</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="border-b border-slate-200">
                <td className="px-3 py-2 text-xs text-slate-600 font-mono">{new Date(t.date).toLocaleDateString('it-IT')}</td>
                <td className="px-3 py-2 text-xs text-slate-800 font-medium">{t.description}</td>
                <td className="px-3 py-2 text-xs text-slate-600">{t.category}</td>
                <td className="px-3 py-2 text-[10px] font-bold text-slate-500">{t.status}</td>
                <td className={`px-3 py-2 text-xs font-bold text-right ${t.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  € {Math.abs(t.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
          <span>Generato da Edilsmart - Software di Gestione Edilizia</span>
          <span>Contabilità {project ? project.name : 'Globale'}</span>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
