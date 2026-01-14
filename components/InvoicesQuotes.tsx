import React, { useState, useMemo, useEffect } from 'react';
import {
    FileText, Plus, Search, Filter, Download, Send, Eye,
    Edit2, Trash2, CheckCircle, XCircle, Clock, AlertCircle,
    Link2, User, Building2, Calendar, DollarSign,
    ChevronDown, ChevronUp, FileSpreadsheet, Mail, Phone
} from 'lucide-react';
import { Invoice, Quote, Client, Project } from '../types';
import InvoiceModal from './InvoiceModal';
import QuoteModal from './QuoteModal';
import ClientModal from './ClientModal';
import {
    loadInvoices,
    loadQuotes,
    loadClients,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addQuote,
    updateQuote,
    deleteQuote,
    addClient,
    updateClient,
    deleteClient,
    initializeDemoData,
} from '../services/invoiceService';
import Toast, { ToastType } from './Toast';
import ConfirmModal from './ConfirmModal';

interface InvoicesQuotesProps {
    projects: Project[];
    initialTab?: 'invoices' | 'quotes' | 'clients';
    initialAction?: 'new-quote';
    selectedProjectId?: string;
}

const InvoicesQuotes: React.FC<InvoicesQuotesProps> = ({ projects, initialTab, initialAction, selectedProjectId }) => {
    const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'clients'>(initialTab || 'invoices');
    const [invoiceType, setInvoiceType] = useState<'all' | 'emessa' | 'ricevuta'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
    const [showFilters, setShowFilters] = useState(false);

    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showClientModal, setShowClientModal] = useState(false);

    // Carica dati da localStorage
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    // Toast e Confirm
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        type: 'invoice' | 'quote' | 'client' | null;
        id: string | null;
    }>({ isOpen: false, type: null, id: null });

    useEffect(() => {
        // Inizializza dati demo se necessario
        initializeDemoData();

        // Carica dati
        setInvoices(loadInvoices());
        setQuotes(loadQuotes());
        setClients(loadClients());
    }, []);

    // Gestisci azioni iniziali (es. apertura modale preventivo da Accounting)
    useEffect(() => {
        if (initialAction === 'new-quote') {
            setActiveTab('quotes');
            setTimeout(() => {
                handleNewQuote();
            }, 100);
        }
    }, [initialAction]);

    // Filtri avanzati
    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            if (activeTab === 'invoices' && selectedProjectId && invoice.projectId !== selectedProjectId) return false;

            if (invoiceType !== 'all' && invoice.type !== invoiceType) return false;
            if (statusFilter !== 'all' && invoice.status !== statusFilter) return false;

            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    invoice.number.toLowerCase().includes(search) ||
                    invoice.clientName?.toLowerCase().includes(search) ||
                    invoice.items?.some(item => item.description.toLowerCase().includes(search))
                );
            }

            if (dateFilter !== 'all') {
                const invoiceDate = new Date(invoice.date);
                const now = new Date();
                const monthsAgo = dateFilter === 'month' ? 1 : dateFilter === 'quarter' ? 3 : 12;
                const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate());
                if (invoiceDate < cutoffDate) return false;
            }

            return true;
        });
    }, [invoices, invoiceType, statusFilter, searchTerm, dateFilter, selectedProjectId, activeTab]);

    const filteredQuotes = useMemo(() => {
        return quotes.filter(quote => {
            if (activeTab === 'quotes' && selectedProjectId && quote.projectId !== selectedProjectId) return false;

            if (statusFilter !== 'all' && quote.status !== statusFilter) return false;

            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    quote.number.toLowerCase().includes(search) ||
                    quote.clientName.toLowerCase().includes(search) ||
                    quote.title.toLowerCase().includes(search)
                );
            }

            return true;
        });
    }, [quotes, statusFilter, searchTerm, selectedProjectId, activeTab]);

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    client.name.toLowerCase().includes(search) ||
                    client.email?.toLowerCase().includes(search) ||
                    client.phone?.includes(searchTerm)
                );
            }
            return true;
        });
    }, [clients, searchTerm]);

    // Statistiche
    const invoiceStats = useMemo(() => {
        let filtered = invoices;
        if (selectedProjectId) {
            filtered = invoices.filter(i => i.projectId === selectedProjectId);
        }

        const emesse = filtered.filter(i => i.type === 'emessa');
        const ricevute = filtered.filter(i => i.type === 'ricevuta');

        return {
            totalEmesse: emesse.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
            totalRicevute: ricevute.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
            countEmesse: emesse.length,
            countRicevute: ricevute.length,
            pending: filtered.filter(i => i.status === 'Emessa').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
            overdue: filtered.filter(i => i.status === 'Scaduta').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
        };
    }, [invoices, selectedProjectId]);

    const quoteStats = useMemo(() => {
        let filtered = quotes;
        if (selectedProjectId) {
            filtered = quotes.filter(q => q.projectId === selectedProjectId);
        }

        return {
            total: filtered.reduce((sum, q) => sum + q.totalAmount, 0),
            accepted: filtered.filter(q => q.status === 'Accettato').length,
            pending: filtered.filter(q => q.status === 'Inviato').length,
            draft: filtered.filter(q => q.status === 'Bozza').length
        };
    }, [quotes, selectedProjectId]);

    // Handlers
    const handleNewInvoice = () => {
        setSelectedInvoice(null);
        setShowInvoiceModal(true);
    };

    const handleEditInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowInvoiceModal(true);
    };

    const handleSaveInvoice = (invoice: Invoice) => {
        if (selectedInvoice) {
            const updated = updateInvoice(invoice.id, invoice);
            setInvoices(updated);
            setToast({ message: 'Fattura aggiornata con successo', type: 'success' });
        } else {
            const updated = addInvoice(invoice);
            setInvoices(updated);
            setToast({ message: 'Fattura creata con successo', type: 'success' });
        }
        setSelectedInvoice(null);
    };

    const handleDeleteInvoice = (id: string) => {
        setConfirmDelete({ isOpen: true, type: 'invoice', id });
    };

    const confirmDeleteAction = () => {
        if (!confirmDelete.id || !confirmDelete.type) return;

        if (confirmDelete.type === 'invoice') {
            const updated = deleteInvoice(confirmDelete.id);
            setInvoices(updated);
            setToast({ message: 'Fattura eliminata con successo', type: 'success' });
        } else if (confirmDelete.type === 'quote') {
            const updated = deleteQuote(confirmDelete.id);
            setQuotes(updated);
            setToast({ message: 'Preventivo eliminato con successo', type: 'success' });
        } else if (confirmDelete.type === 'client') {
            const updated = deleteClient(confirmDelete.id);
            setClients(updated);
            setToast({ message: 'Cliente eliminato con successo', type: 'success' });
        }
    };

    const handleNewQuote = () => {
        setSelectedQuote(null);
        setShowQuoteModal(true);
    };

    const handleEditQuote = (quote: Quote) => {
        setSelectedQuote(quote);
        setShowQuoteModal(true);
    };

    const handleSaveQuote = (quote: Quote) => {
        if (selectedQuote) {
            const updated = updateQuote(quote.id, quote);
            setQuotes(updated);
            setToast({ message: 'Preventivo aggiornato con successo', type: 'success' });
        } else {
            const updated = addQuote(quote);
            setQuotes(updated);
            setToast({ message: 'Preventivo creato con successo', type: 'success' });
        }
        setSelectedQuote(null);
    };

    const handleDeleteQuote = (id: string) => {
        setConfirmDelete({ isOpen: true, type: 'quote', id });
    };

    const handleNewClient = () => {
        setSelectedClient(null);
        setShowClientModal(true);
    };

    const handleEditClient = (client: Client) => {
        setSelectedClient(client);
        setShowClientModal(true);
    };

    const handleSaveClient = (client: Client) => {
        if (selectedClient) {
            const updated = updateClient(client.id, client);
            setClients(updated);
            setToast({ message: 'Cliente aggiornato con successo', type: 'success' });
        } else {
            const updated = addClient(client);
            setClients(updated);
            setToast({ message: 'Cliente creato con successo', type: 'success' });
        }
        setSelectedClient(null);
    };

    const handleDeleteClient = (id: string) => {
        setConfirmDelete({ isOpen: true, type: 'client', id });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Bozza': return 'bg-slate-100 text-slate-700 border-slate-300';
            case 'Emessa': case 'Inviato': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'Pagata': case 'Accettato': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'Scaduta': case 'Rifiutato': return 'bg-red-100 text-red-700 border-red-300';
            case 'Annullata': case 'Scaduto': return 'bg-slate-100 text-slate-500 border-slate-300';
            default: return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Pagata': case 'Accettato': return <CheckCircle size={16} />;
            case 'Scaduta': case 'Rifiutato': return <XCircle size={16} />;
            case 'Emessa': case 'Inviato': return <Clock size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    const renderInvoicesTab = () => (
        <div className="space-y-6">
            {/* Statistiche Fatture */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-emerald-700 text-sm font-semibold uppercase">Fatture Emesse</p>
                        <FileText className="text-emerald-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">€ {invoiceStats.totalEmesse.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-1">{invoiceStats.countEmesse} fatture</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-blue-700 text-sm font-semibold uppercase">Fatture Ricevute</p>
                        <FileText className="text-blue-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">€ {invoiceStats.totalRicevute.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 mt-1">{invoiceStats.countRicevute} fatture</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-amber-700 text-sm font-semibold uppercase">In Attesa</p>
                        <Clock className="text-amber-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-amber-900">€ {invoiceStats.pending.toLocaleString()}</p>
                    <p className="text-xs text-amber-600 mt-1">Da incassare</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-red-700 text-sm font-semibold uppercase">Scadute</p>
                        <AlertCircle className="text-red-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-red-900">€ {invoiceStats.overdue.toLocaleString()}</p>
                    <p className="text-xs text-red-600 mt-1">Sollecito necessario</p>
                </div>
            </div>

            {/* Filtri Fatture */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cerca per numero, cliente, descrizione..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={invoiceType}
                            onChange={(e) => setInvoiceType(e.target.value as any)}
                            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                            <option value="all">Tutte</option>
                            <option value="emessa">Emesse</option>
                            <option value="ricevuta">Ricevute</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                            <option value="all">Tutti gli stati</option>
                            <option value="Bozza">Bozza</option>
                            <option value="Emessa">Emessa</option>
                            <option value="Pagata">Pagata</option>
                            <option value="Scaduta">Scaduta</option>
                        </select>

                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                            <option value="all">Tutto il periodo</option>
                            <option value="month">Ultimo mese</option>
                            <option value="quarter">Ultimo trimestre</option>
                            <option value="year">Ultimo anno</option>
                        </select>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Filter size={18} />
                            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Progetto</label>
                            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                                <option value="">Tutti i progetti</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Importo minimo</label>
                            <input
                                type="number"
                                placeholder="€ 0"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Importo massimo</label>
                            <input
                                type="number"
                                placeholder="€ 999999"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Lista Fatture */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Numero</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Cliente/Fornitore</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Scadenza</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Importo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Stato</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900">{invoice.number}</span>
                                            {invoice.linkedToComputo && (
                                                <span title="Collegata al computo">
                                                    <Link2 size={14} className="text-emerald-600" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${invoice.type === 'emessa'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {invoice.type === 'emessa' ? 'Emessa' : 'Ricevuta'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {invoice.type === 'emessa' ? <User size={14} className="text-slate-400" /> : <Building2 size={14} className="text-slate-400" />}
                                            <span className="text-slate-900">{invoice.clientName || 'Sconosciuto'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(invoice.date).toLocaleDateString('it-IT')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('it-IT') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-slate-900">€ {(invoice.totalAmount || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                                            {getStatusIcon(invoice.status)}
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditInvoice(invoice)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"
                                                title="Modifica"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInvoice(invoice.id)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                                                title="Elimina"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors" title="Download PDF">
                                                <Download size={16} />
                                            </button>
                                            {invoice.type === 'emessa' && invoice.status !== 'Pagata' && (
                                                <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition-colors" title="Invia">
                                                    <Send size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredInvoices.length === 0 && (
                    <div className="text-center py-12">
                        <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                        <p className="text-slate-500 font-medium">Nessuna fattura trovata</p>
                        <p className="text-slate-400 text-sm mt-1">Prova a modificare i filtri di ricerca</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderQuotesTab = () => (
        <div className="space-y-6">
            {/* Statistiche Preventivi */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-purple-700 text-sm font-semibold uppercase">Valore Totale</p>
                        <DollarSign className="text-purple-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">€ {quoteStats.total.toLocaleString()}</p>
                    <p className="text-xs text-purple-600 mt-1">{quotes.length} preventivi</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-emerald-700 text-sm font-semibold uppercase">Accettati</p>
                        <CheckCircle className="text-emerald-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{quoteStats.accepted}</p>
                    <p className="text-xs text-emerald-600 mt-1">Convertiti in progetti</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-blue-700 text-sm font-semibold uppercase">In Attesa</p>
                        <Clock className="text-blue-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{quoteStats.pending}</p>
                    <p className="text-xs text-blue-600 mt-1">Risposta cliente</p>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-slate-700 text-sm font-semibold uppercase">Bozze</p>
                        <FileText className="text-slate-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{quoteStats.draft}</p>
                    <p className="text-xs text-slate-600 mt-1">Da completare</p>
                </div>
            </div>

            {/* Lista Preventivi */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredQuotes.map((quote) => (
                    <div key={quote.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-slate-900">{quote.number}</h3>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(quote.status)}`}>
                                        {getStatusIcon(quote.status)}
                                        {quote.status}
                                    </span>
                                    {quote.linkedToComputo && (
                                        <span title="Collegato al computo">
                                            <Link2 size={14} className="text-emerald-600" />
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-lg font-semibold text-slate-800 mb-1">{quote.title}</h4>
                                <p className="text-sm text-slate-600">{quote.clientName}</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 flex items-center gap-2">
                                    <Calendar size={14} />
                                    Data emissione
                                </span>
                                <span className="font-medium text-slate-900">{new Date(quote.date).toLocaleDateString('it-IT')}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 flex items-center gap-2">
                                    <Clock size={14} />
                                    Valido fino al
                                </span>
                                <span className="font-medium text-slate-900">{new Date(quote.validUntil).toLocaleDateString('it-IT')}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 flex items-center gap-2">
                                    <FileSpreadsheet size={14} />
                                    Voci
                                </span>
                                <span className="font-medium text-slate-900">{quote.items.length} righe</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Subtotale</span>
                                <span className="text-sm font-medium text-slate-900">€ {quote.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">IVA ({quote.taxRate}%)</span>
                                <span className="text-sm font-medium text-slate-900">€ {quote.taxAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">Totale</span>
                                <span className="text-xl font-bold text-emerald-600">€ {quote.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditQuote(quote)}
                                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit2 size={16} />
                                Modifica
                            </button>
                            <button
                                onClick={() => handleDeleteQuote(quote.id)}
                                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors">
                                <Download size={16} />
                            </button>
                            {quote.status === 'Bozza' && (
                                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                    <Send size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredQuotes.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 text-center py-12">
                    <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-500 font-medium">Nessun preventivo trovato</p>
                    <p className="text-slate-400 text-sm mt-1">Crea il tuo primo preventivo rapido</p>
                </div>
            )}
        </div>
    );

    const renderClientsTab = () => (
        <div className="space-y-6">
            {/* Statistiche Clienti */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-blue-700 text-sm font-semibold uppercase">Totale Clienti</p>
                        <User className="text-blue-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-purple-700 text-sm font-semibold uppercase">Privati</p>
                        <User className="text-purple-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{clients.filter(c => c.type === 'Privato').length}</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-emerald-700 text-sm font-semibold uppercase">Aziende/Enti</p>
                        <Building2 className="text-emerald-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">{clients.filter(c => c.type !== 'Privato').length}</p>
                </div>
            </div>

            {/* Lista Clienti */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                    <div key={client.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${client.type === 'Privato' ? 'bg-blue-100 text-blue-600' :
                                    client.type === 'Azienda' ? 'bg-purple-100 text-purple-600' :
                                        'bg-emerald-100 text-emerald-600'
                                    }`}>
                                    {client.type === 'Privato' ? <User size={20} /> : <Building2 size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{client.name}</h3>
                                    <span className="text-xs text-slate-500">{client.type}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4">
                            {client.email && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone size={14} className="text-slate-400" />
                                    <span>{client.phone}</span>
                                </div>
                            )}
                            {client.address && (
                                <div className="text-sm text-slate-600">
                                    {client.address}, {client.city} {client.postalCode}
                                </div>
                            )}
                            {client.vatNumber && (
                                <div className="text-sm text-slate-600">
                                    P.IVA: {client.vatNumber}
                                </div>
                            )}
                            {client.fiscalCode && (
                                <div className="text-sm text-slate-600">
                                    CF: {client.fiscalCode}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-200">
                            <button
                                onClick={() => handleEditClient(client)}
                                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                Modifica
                            </button>
                            <button
                                onClick={() => handleDeleteClient(client.id)}
                                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredClients.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 text-center py-12">
                    <User className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-500 font-medium">Nessun cliente trovato</p>
                    <p className="text-slate-400 text-sm mt-1">Aggiungi il tuo primo cliente</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Fatture e Preventivi</h1>
                    <p className="text-slate-600">Gestisci fatture, preventivi rapidi e anagrafica clienti</p>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'invoices' && (
                        <button
                            onClick={handleNewInvoice}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            Nuova Fattura
                        </button>
                    )}
                    {activeTab === 'quotes' && (
                        <button
                            onClick={handleNewQuote}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            Nuovo Preventivo
                        </button>
                    )}
                    {activeTab === 'clients' && (
                        <button
                            onClick={handleNewClient}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            Nuovo Cliente
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 p-1.5 flex gap-1">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'invoices'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <FileText size={18} />
                    Fatture
                </button>
                <button
                    onClick={() => setActiveTab('quotes')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'quotes'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <FileSpreadsheet size={18} />
                    Preventivi
                </button>
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'clients'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <User size={18} />
                    Clienti
                </button>
            </div>

            {/* Content */}
            {activeTab === 'invoices' && renderInvoicesTab()}
            {activeTab === 'quotes' && renderQuotesTab()}
            {activeTab === 'clients' && renderClientsTab()}

            {/* Modals */}
            <InvoiceModal
                isOpen={showInvoiceModal}
                onClose={() => {
                    setShowInvoiceModal(false);
                    setSelectedInvoice(null);
                }}
                onSave={handleSaveInvoice}
                invoice={selectedInvoice}
                clients={clients}
                projects={projects}
            />

            <QuoteModal
                isOpen={showQuoteModal}
                onClose={() => {
                    setShowQuoteModal(false);
                    setSelectedQuote(null);
                }}
                onSave={handleSaveQuote}
                quote={selectedQuote}
                clients={clients}
                projects={projects}
            />

            <ClientModal
                isOpen={showClientModal}
                onClose={() => {
                    setShowClientModal(false);
                    setSelectedClient(null);
                }}
                onSave={handleSaveClient}
                client={selectedClient}
            />

            {/* Toast Notifications */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title={`Elimina ${confirmDelete.type === 'invoice' ? 'Fattura' : confirmDelete.type === 'quote' ? 'Preventivo' : 'Cliente'}`}
                message={`Sei sicuro di voler eliminare ${confirmDelete.type === 'invoice' ? 'questa fattura' : confirmDelete.type === 'quote' ? 'questo preventivo' : 'questo cliente'}? Questa azione non può essere annullata.`}
                confirmText="Elimina"
                cancelText="Annulla"
                type="danger"
                onConfirm={() => {
                    confirmDeleteAction();
                    setConfirmDelete({ isOpen: false, type: null, id: null });
                }}
                onCancel={() => setConfirmDelete({ isOpen: false, type: null, id: null })}
            />
        </div>
    );
};

export default InvoicesQuotes;
