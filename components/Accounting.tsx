
import React, { useState, useMemo, useEffect } from 'react';
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
  Printer,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import { Expense, Supplier, Invoice } from '../types';
import { addInvoice, deleteInvoice as deleteInvoiceSvc, loadInvoices } from '../services/invoiceService';
import ConfirmModal from './ConfirmModal';
import Toast, { ToastType } from './Toast';

interface AccountingProps {
  onCreateQuote?: () => void;
}

const Accounting: React.FC<AccountingProps> = ({ onCreateQuote }) => {
  const [transactions, setTransactions] = useState<Expense[]>([
    { id: '1', date: '2023-10-15', description: 'Acquisto Ferramenta', amount: -245.50, category: 'Materiali', status: 'Pagato' },
    { id: '2', date: '2023-10-14', description: 'Fattura Cliente - Acconto Lavori', amount: 5000.00, category: 'Ricavi', status: 'Pagato' },
    { id: '3', date: '2023-10-12', description: 'Paghe Settimanali - Squadra A', amount: -3200.00, category: 'Manodopera', status: 'In Attesa' },
    { id: '4', date: '2023-10-10', description: 'Noleggio Gru Autocarrata', amount: -850.00, category: 'Noleggi', status: 'Pagato' },
    { id: '5', date: '2023-10-09', description: 'Trasporto Macerie Discarica', amount: -420.00, category: 'Trasporti', status: 'Pagato' },
    { id: '6', date: '2023-10-08', description: 'Fornitura Marmi Pregiati', amount: -12500.00, category: 'Materiali Speciali', status: 'In Attesa' },
  ]);

  const [activeTab, setActiveTab] = useState<'transactions' | 'invoices' | 'suppliers'>('transactions');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [categories, setCategories] = useState<string[]>([
    'Materiali', 'Ricavi', 'Manodopera', 'Noleggi', 'Trasporti', 'Materiali Speciali', 'Altro'
  ]);

  // Load categories and other data from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('accounting_categories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (e) {
        console.error('Failed to load accounting categories', e);
      }
    }

    const savedSuppliers = localStorage.getItem('edilsmart_suppliers');
    if (savedSuppliers) {
      try { setSuppliers(JSON.parse(savedSuppliers)); } catch (e) { }
    }

    const savedInvoices = loadInvoices();
    if (savedInvoices) {
      // Show supplier invoices (ricevuta) plus legacy ones (missing type)
      setInvoices(savedInvoices.filter(i => i.type === 'ricevuta' || !i.type));
    }

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      const updated = localStorage.getItem('accounting_categories');
      if (updated) {
        try {
          setCategories(JSON.parse(updated));
        } catch (e) { }
      }
    };

    window.addEventListener('company-settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('company-settings-updated', handleSettingsUpdate);
  }, []);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Expense | null>(null);

  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    category: categories[0] || 'Altro',
    status: 'In Attesa'
  });

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Supplier & Invoice States
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({ name: '', vatNumber: '', email: '', phone: '', category: '' });

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
    status: 'Bozza'
  });

  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case 'Ricavi':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Trasporti':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Materiali Speciali':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Manodopera':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Noleggi':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Materiali':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName && !categories.includes(newCategoryName)) {
      const updatedCategories = [...categories, newCategoryName];
      setCategories(updatedCategories);
      localStorage.setItem('accounting_categories', JSON.stringify(updatedCategories));
      setNewCategoryName('');
      setIsCategoryModalOpen(false);
    }
  };

  const handleOpenEdit = (t: Expense) => {
    setEditingTransaction({ ...t });
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? editingTransaction : t));
      setIsEditModalOpen(false);
      setEditingTransaction(null);
    }
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransaction.description && newTransaction.amount !== undefined) {
      const transaction: Expense = {
        id: Math.random().toString(36).substr(2, 9),
        date: newTransaction.date || new Date().toISOString().split('T')[0],
        description: newTransaction.description,
        amount: newTransaction.amount,
        category: newTransaction.category || 'Altro',
        status: newTransaction.status as 'Pagato' | 'In Attesa' || 'In Attesa',
        invoiceNumber: newTransaction.invoiceNumber,
        paymentType: newTransaction.paymentType
      };
      setTransactions([transaction, ...transactions]);
      setIsNewTransactionModalOpen(false);
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        category: categories[0] || 'Altro',
        status: 'In Attesa',
        invoiceNumber: '',
        paymentType: undefined
      });
    }
  };

  // Supplier Handlers
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupplier.name) {
      const supplier: Supplier = {
        id: Math.random().toString(36).substr(2, 9),
        name: newSupplier.name!,
        vatNumber: newSupplier.vatNumber,
        email: newSupplier.email,
        phone: newSupplier.phone,
        category: newSupplier.category
      };
      const updatedSuppliers = [...suppliers, supplier];
      setSuppliers(updatedSuppliers);
      localStorage.setItem('edilsmart_suppliers', JSON.stringify(updatedSuppliers));
      setIsSupplierModalOpen(false);
      setNewSupplier({});
    }
  };

  const deleteSupplier = (id: string) => {
    if (confirm('Eliminare questo fornitore?')) {
      const updated = suppliers.filter(s => s.id !== id);
      setSuppliers(updated);
      localStorage.setItem('edilsmart_suppliers', JSON.stringify(updated));
    }
  };

  // Invoice Handlers
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInvoice.supplierId && newInvoice.amount && newInvoice.number) {
      const supplier = suppliers.find(s => s.id === newInvoice.supplierId);
      const invoice: Invoice = {
        id: Math.random().toString(36).substr(2, 9),
        number: newInvoice.number,
        date: newInvoice.date,
        type: 'ricevuta',
        clientId: undefined,
        clientName: supplier?.name || 'Sconosciuto',
        supplierId: newInvoice.supplierId,
        items: [{
          id: Math.random().toString(36).substr(2, 9),
          description: newInvoice.description || 'Fattura Fornitore',
          quantity: 1,
          unit: 'a_corpo',
          unitPrice: newInvoice.amount,
          amount: newInvoice.amount
        }],
        subtotal: newInvoice.amount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: newInvoice.amount,
        status: newInvoice.status || 'Bozza',
        notes: newInvoice.description
      };

      const updated = addInvoice(invoice);
      setInvoices(updated.filter(i => i.type === 'ricevuta' || !i.type));
      setIsInvoiceModalOpen(false);
      setNewInvoice({ date: new Date().toISOString().split('T')[0], status: 'Bozza' });
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Eliminare questa fattura?')) {
      const updated = deleteInvoiceSvc(id);
      setInvoices(updated.filter(i => i.type === 'ricevuta' || !i.type));
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    setDeletingTransactionId(null);
    setToast({ message: 'Registrazione eliminata con successo', type: 'success' });
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStart = !startDate || t.date >= startDate;
      const matchesEnd = !endDate || t.date <= endDate;
      return matchesSearch && matchesStart && matchesEnd;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, startDate, endDate, searchTerm]);

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
    link.setAttribute("href", url);
    link.setAttribute("download", `export_contabilita_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = filteredTransactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0));
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full md:w-fit overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <CreditCard size={16} className="mr-2" />
          Registrazioni
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <FileText size={16} className="mr-2" />
          Fatture Fornitori
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'suppliers' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <Users size={16} className="mr-2" />
          Fornitori
        </button>
      </div>

      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border-l-4 border-l-emerald-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Entrate filtrate</span>
                <Wallet className="text-emerald-500" size={20} />
              </div>
              <h4 className="text-2xl font-bold text-slate-900">€ {totalIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h4>
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-l-rose-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Uscite filtrate</span>
                <ShoppingCart className="text-rose-500" size={20} />
              </div>
              <h4 className="text-2xl font-bold text-slate-900">€ {totalExpenses.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h4>
            </div>
            <div className="bg-white p-6 rounded-xl border-l-4 border-l-blue-500 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Bilancio Netto</span>
                <CreditCard className="text-blue-500" size={20} />
              </div>
              <h4 className="text-2xl font-bold text-slate-900">€ {netBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h4>
            </div>
          </div>

          {/* Transactions Table Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-slate-800">Registro Spese & Movimenti</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`text-sm px-4 py-2 rounded-lg flex items-center border transition-colors ${showFilters ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Filter size={16} className="mr-2" />
                  {showFilters ? 'Chiudi Filtri' : 'Filtra per Data'}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-slate-700 flex items-center border border-slate-200 transition-colors"
                >
                  <Download size={16} className="mr-2" /> Esporta CSV
                </button>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-sm bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg text-indigo-700 flex items-center border border-indigo-200 transition-colors"
                >
                  <Tag size={16} className="mr-2" /> Aggiungi Categoria
                </button>
                <button
                  onClick={() => setIsNewTransactionModalOpen(true)}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors"
                >
                  <Plus size={16} className="mr-1" /> Nuova Registrazione
                </button>
              </div>
            </div>

            {/* Collapsible Filter Bar */}
            {showFilters && (
              <div className="p-6 bg-slate-50 border-b flex flex-wrap gap-6 items-end animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                    <Calendar size={12} className="mr-1" /> Da Data
                  </label>
                  <input
                    type="date"
                    className="p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                    <Calendar size={12} className="mr-1" /> A Data
                  </label>
                  <input
                    type="date"
                    className="p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                    <Search size={12} className="mr-1" /> Cerca descrizione o categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Es: Marmi, Squadra A..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-rose-600 flex items-center font-medium transition-colors"
                >
                  <RefreshCw size={14} className="mr-2" /> Resetta
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Descrizione</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Stato</th>
                    <th className="px-6 py-4 text-right">Importo</th>
                    <th className="px-6 py-4">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => {
                      const isEditing = editingTransaction?.id === t.id;
                      return (
                        <tr
                          key={t.id}
                          className={`transition-all duration-200 group ${isEditing
                            ? 'bg-blue-50/70 border-y border-blue-200 ring-1 ring-inset ring-blue-100'
                            : 'hover:bg-slate-50'
                            }`}
                        >
                          <td className={`px-6 py-4 font-mono text-xs ${isEditing ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                            {t.date}
                          </td>
                          <td className={`px-6 py-4 font-medium ${isEditing ? 'text-blue-900' : 'text-slate-800'}`}>
                            <div>{t.description}</div>
                            {(t.invoiceNumber || t.paymentType) && (
                              <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                {t.invoiceNumber && <span>Fatt. {t.invoiceNumber}</span>}
                                {t.invoiceNumber && t.paymentType && <span>•</span>}
                                {t.paymentType && <span className="uppercase">{t.paymentType}</span>}
                              </div>
                            )}
                            {isEditing && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white animate-pulse">
                                IN MODIFICA
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getCategoryStyle(t.category)}`}>
                              {t.category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center text-xs font-medium ${t.status === 'Pagato' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${t.status === 'Pagato' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                              {t.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-900'} ${isEditing ? 'text-blue-900' : ''}`}>
                            {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEdit(t)}
                                disabled={isEditing}
                                className={`p-2 rounded-lg transition-all ${isEditing
                                  ? 'text-blue-600 bg-blue-100 cursor-default'
                                  : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                title="Modifica Transazione"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => setDeletingTransactionId(t.id)}
                                className="p-2 rounded-lg transition-all text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Elimina Transazione"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Nessun movimento trovato per i filtri selezionati.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional UI Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <h4 className="text-indigo-400 font-bold uppercase tracking-wider text-xs mb-1">Fattura di Cortesia</h4>
                <h3 className="text-xl font-bold mb-4">Genera Preventivo Rapido</h3>
                <p className="text-slate-400 text-sm mb-6">Crea una fattura pro-forma o un preventivo professionale basato sui dati del computo metrico.</p>
              </div>
              <button
                onClick={onCreateQuote}
                className="bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-slate-100 transition-colors relative z-10 w-fit"
              >
                Crea Ora
              </button>
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <FileText size={120} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <Truck size={20} className="mr-2 text-amber-600" />
                Servizi di Trasporto
              </h3>
              <p className="text-sm text-slate-500 mb-4">Monitoraggio logistica e trasporti macerie del mese.</p>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-800">Spesa Trasporti</span>
                  <span className="text-sm font-bold text-amber-900">€ 1.840,00</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-1.5">
                  <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                <Package size={20} className="mr-2 text-purple-600" />
                Monitoraggio Categorie
              </h3>
              <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                {categories.slice(-5).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-600">{cat}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryStyle(cat)}`}>ATTIVA</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Edit Transaction Modal */}
          {isEditModalOpen && editingTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Pencil className="mr-2 text-blue-600" size={20} />
                    Modifica Transazione
                  </h3>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingTransaction(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpdateTransaction} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={editingTransaction.date}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Importo (€)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          required
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={editingTransaction.amount}
                          onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                        />
                        <Euro className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descrizione</label>
                    <input
                      type="text"
                      required
                      placeholder="Es: Acquisto materiali..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editingTransaction.description}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                    />
                  </div>

                  {(editingTransaction.amount || 0) >= 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">N. Fattura (Opzionale)</label>
                        <input
                          type="text"
                          placeholder="Es: 2024/001"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={editingTransaction.invoiceNumber || ''}
                          onChange={(e) => setEditingTransaction({ ...editingTransaction, invoiceNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Tipo Incasso</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                          value={editingTransaction.paymentType || ''}
                          onChange={(e) => setEditingTransaction({ ...editingTransaction, paymentType: e.target.value as any })}
                        >
                          <option value="">-- Seleziona --</option>
                          <option value="Acconto">Acconto</option>
                          <option value="Saldo">Saldo</option>
                          <option value="Unica Soluzione">Unica Soluzione</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                        value={editingTransaction.category}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Stato</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                        value={editingTransaction.status}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, status: e.target.value as 'Pagato' | 'In Attesa' })}
                      >
                        <option value="Pagato">Pagato</option>
                        <option value="In Attesa">In Attesa</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100 mt-2">
                    <AlertCircle className="text-blue-600 mt-0.5" size={18} />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Le modifiche influenzeranno immediatamente il calcolo del bilancio e le statistiche dei costi del cantiere selezionato.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingTransaction(null);
                      }}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                      Aggiorna
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Category Modal */}
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Tag className="mr-2 text-indigo-600" size={20} />
                    Nuova Categoria Spesa
                  </h3>
                  <button
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddCategory} className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nome Categoria</label>
                    <div className="relative">
                      <input
                        autoFocus
                        type="text"
                        required
                        placeholder="Es: Consulenze, Onere Discarica, etc."
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                      <Tag className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    </div>
                    <p className="text-xs text-slate-400">Inserisci un nome univoco per la nuova voce di spesa.</p>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-xl flex items-start space-x-3 border border-indigo-100">
                    <div className="mt-0.5 text-indigo-600">
                      <CreditCard size={18} />
                    </div>
                    <p className="text-xs text-indigo-800 leading-relaxed">
                      Le nuove categorie verranno visualizzate immediatamente nel registro e potrai utilizzarle per i nuovi inserimenti contabili.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                      Salva Categoria
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* New Transaction Modal */}
          {isNewTransactionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-blue-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Plus className="mr-2 text-blue-600" size={20} />
                    Nuova Registrazione Contabile
                  </h3>
                  <button
                    onClick={() => setIsNewTransactionModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo Movimento</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                      value={newTransaction.amount && newTransaction.amount >= 0 ? 'entrata' : 'uscita'}
                      onChange={(e) => {
                        const currentAmount = Math.abs(newTransaction.amount || 0);
                        setNewTransaction({
                          ...newTransaction,
                          amount: e.target.value === 'entrata' ? currentAmount : -currentAmount
                        });
                      }}
                    >
                      <option value="entrata">💰 Entrata (Ricavo/Incasso)</option>
                      <option value="uscita">💸 Uscita (Spesa/Pagamento)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Importo (€)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={Math.abs(newTransaction.amount || 0)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const sign = newTransaction.amount && newTransaction.amount >= 0 ? 1 : -1;
                            setNewTransaction({ ...newTransaction, amount: val * sign });
                          }}
                        />
                        <Euro className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Descrizione</label>
                    <input
                      type="text"
                      required
                      placeholder="Es: Rifornimento cantiere, Saldo fattura..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    />
                  </div>

                  {(newTransaction.amount || 0) >= 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">N. Fattura (Opzionale)</label>
                        <input
                          type="text"
                          placeholder="Es: 2024/001"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={newTransaction.invoiceNumber || ''}
                          onChange={(e) => setNewTransaction({ ...newTransaction, invoiceNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Tipo Incasso</label>
                        <select
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                          value={newTransaction.paymentType || ''}
                          onChange={(e) => setNewTransaction({ ...newTransaction, paymentType: e.target.value as any })}
                        >
                          <option value="">-- Seleziona --</option>
                          <option value="Acconto">Acconto</option>
                          <option value="Saldo">Saldo</option>
                          <option value="Unica Soluzione">Unica Soluzione</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                        value={newTransaction.category}
                        onChange={(e) => {
                          const cat = e.target.value;
                          const isIncome = cat === 'Ricavi';
                          const currentAmount = Math.abs(newTransaction.amount || 0);

                          setNewTransaction({
                            ...newTransaction,
                            category: cat,
                            // Auto-switch based on category, but preserve amount value
                            amount: isIncome ? currentAmount : -currentAmount,
                            // Reset invoice fields if switching to expense (optional, but cleaner)
                            invoiceNumber: isIncome ? newTransaction.invoiceNumber : '',
                            paymentType: isIncome ? newTransaction.paymentType : undefined
                          });
                        }}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Stato</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                        value={newTransaction.status}
                        onChange={(e) => setNewTransaction({ ...newTransaction, status: e.target.value as 'Pagato' | 'In Attesa' })}
                      >
                        <option value="In Attesa">In Attesa</option>
                        <option value="Pagato">Pagato</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsNewTransactionModalOpen(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                      Crea Registrazione
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">Archivio Fatture Fornitori</h3>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors font-medium"
            >
              <Plus size={18} className="mr-2" />
              Registra Fattura
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Numero</th>
                    <th className="px-6 py-4">Fornitore</th>
                    <th className="px-6 py-4">Descrizione</th>
                    <th className="px-6 py-4 text-right">Importo</th>
                    <th className="px-6 py-4 text-center">Stato</th>
                    <th className="px-6 py-4 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.length > 0 ? (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-600">{inv.date}</td>
                        <td className="px-6 py-4 font-mono font-medium text-slate-900">{inv.number}</td>
                        <td className="px-6 py-4 text-slate-800 font-medium">
                          <div className="flex items-center">
                            <Building2 size={14} className="mr-2 text-slate-400" />
                            {/* Handle clientName (new) or supplierName (legacy) */}
                            {inv.clientName || (inv as any).supplierName || 'Sconosciuto'}
                          </div>
                        </td>
                        {/* Handle notes (new) or description (legacy) */}
                        <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{inv.notes || (inv as any).description || '-'}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          € {(inv.totalAmount || (inv as any).amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${inv.status === 'Pagata' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              inv.status === 'Scaduta' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Elimina Fattura"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                        Nessuna fattura registrata.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-lg">Rubrica Fornitori</h3>
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors font-medium"
            >
              <Plus size={18} className="mr-2" />
              Nuovo Fornitore
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <div key={supplier.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{supplier.name}</h4>
                        <span className="text-xs text-slate-500 font-medium uppercase">{supplier.category || 'Generico'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSupplier(supplier.id)}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    {supplier.vatNumber && (
                      <div className="flex items-center gap-2">
                        <CreditCard size={14} className="text-slate-400" />
                        <span>P.IVA: {supplier.vatNumber}</span>
                      </div>
                    )}
                    {(supplier.email || supplier.phone) && <hr className="border-slate-100 my-2" />}
                    {supplier.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-400" />
                        <a href={`mailto:${supplier.email}`} className="hover:text-blue-600">{supplier.email}</a>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        <a href={`tel:${supplier.phone}`} className="hover:text-blue-600">{supplier.phone}</a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <Users size={48} className="mx-auto mb-3 text-slate-300" />
                <p>Nessun fornitore in rubrica.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Users className="mr-2 text-blue-600" size={20} />
                Nuovo Fornitore
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Ragione Sociale / Nome</label>
                <input type="text" required autoFocus className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSupplier.name || ''} onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Partita IVA</label>
                  <input type="text" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newSupplier.vatNumber || ''} onChange={e => setNewSupplier({ ...newSupplier, vatNumber: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newSupplier.category || ''} onChange={e => setNewSupplier({ ...newSupplier, category: e.target.value })}>
                    <option value="">-- Seleziona --</option>
                    <option value="Materiali Edili">Materiali Edili</option>
                    <option value="Noleggi">Noleggi</option>
                    <option value="Impiantistica">Impiantistica</option>
                    <option value="Professionista">Professionista</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input type="email" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newSupplier.email || ''} onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Telefono</label>
                  <input type="tel" className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newSupplier.phone || ''} onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-2">Salva Fornitore</button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <FileText className="mr-2 text-blue-600" size={20} />
                Registra Fattura Fornitore
              </h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
                <AlertCircle className="text-amber-600 shrink-0" size={18} />
                <p className="text-xs text-amber-800">
                  Stai registrando una fattura ricevuta. Per gestire i pagamenti, ricorda di aggiornare lo stato o creare un movimento di uscita collegato.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fornitore</label>
                  <select required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newInvoice.supplierId || ''} onChange={e => setNewInvoice({ ...newInvoice, supplierId: e.target.value })}>
                    <option value="">-- Seleziona --</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Numero Fattura</label>
                  <input type="text" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newInvoice.number || ''} onChange={e => setNewInvoice({ ...newInvoice, number: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Data Fattura</label>
                  <input type="date" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newInvoice.date || ''} onChange={e => setNewInvoice({ ...newInvoice, date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Importo Totale (€)</label>
                  <input type="number" step="0.01" required className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newInvoice.amount || ''} onChange={e => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrizione / Note</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-20"
                  placeholder="Dettagli sulla fornitura..."
                  value={newInvoice.description || ''} onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Stato Pagamento</label>
                <select className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={newInvoice.status || 'Bozza'} onChange={e => setNewInvoice({ ...newInvoice, status: e.target.value as any })}>
                  <option value="Bozza">Bozza</option>
                  <option value="In Scadenza">In Scadenza</option>
                  <option value="Scaduta">Scaduta</option>
                  <option value="Pagata">Pagata</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mt-2">Registra Fattura</button>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingTransactionId}
        title="Elimina Registrazione"
        message="Sei sicuro di voler eliminare questa registrazione contabile? Questa azione non può essere annullata."
        confirmText="Elimina"
        cancelText="Annulla"
        type="danger"
        onConfirm={() => {
          if (deletingTransactionId) {
            handleDeleteTransaction(deletingTransactionId);
          }
        }}
        onCancel={() => setDeletingTransactionId(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Accounting;
