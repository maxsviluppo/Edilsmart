import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, Plus, Search, Filter, Download, Printer, Eye,
    Edit2, Trash2, CheckCircle, Clock, AlertCircle, XCircle,
    FolderOpen, Award, Shield, ClipboardCheck, FileCheck,
    ChevronDown, ChevronUp, Calendar, User, Building2, X, Upload
} from 'lucide-react';
import { Document, DocumentCategory, DocumentType, Project, Client } from '../types';
import { documentTemplates, getTemplatesByCategory, getDocumentsByPhase } from '../services/documentTemplates';
import {
    loadDocuments,
    createDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocumentsByProject,
    getDocumentStats,
    autoFillCILA,
    autoFillPSC,
    autoFillDiCo,
    autoFillSAL,
    exportDocumentToPrint
} from '../services/documentService';
import { loadClients } from '../services/invoiceService';
import Toast, { ToastType } from './Toast';
import ConfirmModal from './ConfirmModal';
import DocumentEditModal from './DocumentEditModal';
import TemplateManager from './TemplateManager';
import { downloadCompiledCILA } from '../services/pdfFillService';

interface DocumentsProps {
    projects: Project[];
    selectedProjectId?: string;
}

const Documents: React.FC<DocumentsProps> = ({ projects, selectedProjectId }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<'documents' | 'templates'>('documents');
    const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    const [showNewDocModal, setShowNewDocModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [previewHtml, setPreviewHtml] = useState('');

    // Toast e Confirm
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; documentId: string | null }>({
        isOpen: false,
        documentId: null
    });

    useEffect(() => {
        setDocuments(loadDocuments());
        setClients(loadClients());

        if (selectedProjectId) {
            const project = projects.find(p => p.id === selectedProjectId);
            setSelectedProject(project || projects[0] || null);
        } else {
            setSelectedProject(projects[0] || null);
        }
    }, [projects, selectedProjectId]);

    const projectDocuments = useMemo(() => {
        if (!selectedProject) return [];
        return documents.filter(doc => doc.projectId === selectedProject.id);
    }, [documents, selectedProject]);

    const filteredDocuments = useMemo(() => {
        return projectDocuments.filter(doc => {
            if (activeCategory !== 'all' && doc.category !== activeCategory) return false;
            if (statusFilter !== 'all' && doc.status !== statusFilter) return false;

            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return (
                    doc.type.toLowerCase().includes(search) ||
                    doc.number?.toLowerCase().includes(search) ||
                    doc.responsiblePerson?.toLowerCase().includes(search)
                );
            }

            return true;
        });
    }, [projectDocuments, activeCategory, statusFilter, searchTerm]);

    const stats = useMemo(() => {
        if (!selectedProject) return null;
        return getDocumentStats(selectedProject.id);
    }, [selectedProject, documents]);

    const categories: Array<{ id: DocumentCategory | 'all'; name: string; icon: any }> = [
        { id: 'all', name: 'Tutti i Documenti', icon: FileText },
        { id: 'Titoli Abilitativi', name: 'Titoli Abilitativi', icon: Award },
        { id: 'Documentazione Tecnica', name: 'Doc. Tecnica', icon: FileCheck },
        { id: 'Sicurezza sul Lavoro', name: 'Sicurezza', icon: Shield },
        { id: 'Certificazioni Fine Lavori', name: 'Certificazioni', icon: CheckCircle },
        { id: 'Gestione Amministrativa', name: 'Amministrativa', icon: ClipboardCheck }
    ];

    const handleCreateDocument = (type: DocumentType) => {
        if (!selectedProject) return;

        const projectClient = clients.find(c => c.id === selectedProject.clientId);

        // Auto-compila dati in base al tipo
        let autoFilledData = {};

        if (type === 'CILA') {
            autoFilledData = autoFillCILA(selectedProject, projectClient);
        } else if (type === 'PSC') {
            autoFilledData = autoFillPSC(selectedProject);
        } else if (type === 'DiCo Impianti') {
            autoFilledData = autoFillDiCo('Elettrico');
        } else if (type === 'SAL') {
            const salNumber = projectDocuments.filter(d => d.type === 'SAL').length + 1;
            autoFilledData = autoFillSAL(selectedProject, salNumber);
        }

        const newDoc = createDocument(selectedProject.id, type, autoFilledData);
        const updated = addDocument({ ...newDoc, projectName: selectedProject.name });
        setDocuments(updated);
        setShowNewDocModal(false);
        setToast({ message: `Documento ${type} creato con successo!`, type: 'success' });
    };

    const handleDeleteDocument = (id: string) => {
        setConfirmDelete({ isOpen: true, documentId: id });
    };

    const confirmDeleteDocument = () => {
        if (confirmDelete.documentId) {
            const updated = deleteDocument(confirmDelete.documentId);
            setDocuments(updated);
            setToast({ message: 'Documento eliminato con successo', type: 'success' });
        }
        setConfirmDelete({ isOpen: false, documentId: null });
    };

    const handleUpdateStatus = (id: string, status: Document['status']) => {
        const updated = updateDocument(id, { status });
        setDocuments(updated);
        setToast({ message: `Stato aggiornato a: ${status}`, type: 'info' });
    };

    const handleEditDocument = (doc: Document) => {
        setSelectedDocument(doc);
        setShowEditModal(true);
    };

    const handleSaveDocument = (doc: Document) => {
        const updated = updateDocument(doc.id, doc);
        setDocuments(updated);
        setShowEditModal(false);
        setSelectedDocument(null);
        setToast({ message: 'Documento aggiornato con successo', type: 'success' });
    };

    const handleDownloadCompiledPDF = async (doc: Document) => {
        if (doc.type !== 'CILA') {
            setToast({ message: 'Download PDF compilato disponibile solo per CILA', type: 'warning' });
            return;
        }

        try {
            setToast({ message: 'Scaricamento e compilazione PDF in corso...', type: 'info' });
            await downloadCompiledCILA(doc);
            setToast({ message: 'PDF compilato scaricato con successo!', type: 'success' });
        } catch (error) {
            console.error('Errore download PDF:', error);
            setToast({ message: 'Errore nel download del PDF compilato', type: 'error' });
        }
    };

    const handlePreview = (doc: Document) => {
        const html = exportDocumentToPrint(doc);
        setPreviewHtml(html);
        setSelectedDocument(doc);
        setShowPreviewModal(true);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(previewHtml);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const getStatusColor = (status: Document['status']) => {
        switch (status) {
            case 'Bozza': return 'bg-slate-100 text-slate-700 border-slate-300';
            case 'In Compilazione': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'Completato': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'Inviato': return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'Approvato': return 'bg-green-100 text-green-700 border-green-300';
            case 'Scaduto': return 'bg-red-100 text-red-700 border-red-300';
            default: return 'bg-slate-100 text-slate-700 border-slate-300';
        }
    };

    const getStatusIcon = (status: Document['status']) => {
        switch (status) {
            case 'Completato': case 'Approvato': return <CheckCircle size={16} />;
            case 'Scaduto': return <XCircle size={16} />;
            case 'In Compilazione': case 'Inviato': return <Clock size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    if (!selectedProject) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <FolderOpen className="mx-auto text-slate-300 mb-4" size={64} />
                    <p className="text-slate-500 font-medium">Nessun progetto selezionato</p>
                    <p className="text-slate-400 text-sm mt-2">Seleziona un progetto per gestire i documenti</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Documenti e Certificazioni</h1>
                    <p className="text-slate-600">Gestione documentale per {selectedProject.name}</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={selectedProject.id}
                        onChange={(e) => {
                            const project = projects.find(p => p.id === e.target.value);
                            setSelectedProject(project || null);
                        }}
                        className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowNewDocModal(true)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        Nuovo Documento
                    </button>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="bg-white rounded-xl border border-slate-200 p-1.5">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'documents'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <FileText className="inline mr-2" size={18} />
                        Documenti Progetto
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'templates'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Upload className="inline mr-2" size={18} />
                        Gestione Template
                    </button>
                </div>
            </div>

            {/* Render condizionale */}
            {activeTab === 'templates' ? (
                <TemplateManager />
            ) : (
                <>
                    {/* Statistiche */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-blue-700 text-sm font-semibold uppercase">Totali</p>
                                    <FileText className="text-blue-600" size={20} />
                                </div>
                                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                                <p className="text-xs text-blue-600 mt-1">di {stats.required} obbligatori</p>
                            </div>

                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-emerald-700 text-sm font-semibold uppercase">Completati</p>
                                    <CheckCircle className="text-emerald-600" size={20} />
                                </div>
                                <p className="text-2xl font-bold text-emerald-900">{stats.completed}</p>
                                <p className="text-xs text-emerald-600 mt-1">{stats.completionPercentage.toFixed(0)}% completamento</p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-amber-700 text-sm font-semibold uppercase">In Corso</p>
                                    <Clock className="text-amber-600" size={20} />
                                </div>
                                <p className="text-2xl font-bold text-amber-900">{stats.inProgress}</p>
                                <p className="text-xs text-amber-600 mt-1">In compilazione</p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-purple-700 text-sm font-semibold uppercase">Approvati</p>
                                    <Award className="text-purple-600" size={20} />
                                </div>
                                <p className="text-2xl font-bold text-purple-900">{stats.approved}</p>
                                <p className="text-xs text-purple-600 mt-1">Validati</p>
                            </div>

                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-xl border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-slate-700 text-sm font-semibold uppercase">Bozze</p>
                                    <FileText className="text-slate-600" size={20} />
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{stats.draft}</p>
                                <p className="text-xs text-slate-600 mt-1">Da completare</p>
                            </div>
                        </div>
                    )}

                    {/* Filtri Categorie */}
                    <div className="bg-white rounded-xl border border-slate-200 p-1.5 overflow-x-auto">
                        <div className="flex gap-1 min-w-max">
                            {categories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = activeCategory === cat.id;
                                const count = cat.id === 'all'
                                    ? projectDocuments.length
                                    : projectDocuments.filter(d => d.category === cat.id).length;

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap ${isActive
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        {cat.name}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Barra Ricerca e Filtri */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Cerca documenti..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-2 flex-wrap">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="all">Tutti gli stati</option>
                                    <option value="Bozza">Bozza</option>
                                    <option value="In Compilazione">In Compilazione</option>
                                    <option value="Completato">Completato</option>
                                    <option value="Inviato">Inviato</option>
                                    <option value="Approvato">Approvato</option>
                                    <option value="Scaduto">Scaduto</option>
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
                    </div>

                    {/* Lista Documenti */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Documento</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Numero</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Categoria</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Responsabile</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Stato</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredDocuments.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-blue-600" />
                                                    <span className="font-semibold text-slate-900">{doc.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-slate-600">{doc.number}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600">{doc.category}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <Calendar size={14} />
                                                    {new Date(doc.createdDate).toLocaleDateString('it-IT')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                                    <User size={14} />
                                                    {doc.responsiblePerson || 'Non assegnato'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={doc.status}
                                                    onChange={(e) => handleUpdateStatus(doc.id, e.target.value as Document['status'])}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(doc.status)} cursor-pointer`}
                                                >
                                                    <option value="Bozza">Bozza</option>
                                                    <option value="In Compilazione">In Compilazione</option>
                                                    <option value="Completato">Completato</option>
                                                    <option value="Inviato">Inviato</option>
                                                    <option value="Approvato">Approvato</option>
                                                    <option value="Scaduto">Scaduto</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handlePreview(doc)}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"
                                                        title="Anteprima e Stampa"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditDocument(doc)}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                                                        title="Modifica"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {doc.type === 'CILA' && (
                                                        <button
                                                            onClick={() => handleDownloadCompiledPDF(doc)}
                                                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-purple-600 transition-colors"
                                                            title="Scarica PDF Compilato"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                                                        title="Elimina"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredDocuments.length === 0 && (
                            <div className="text-center py-12">
                                <FileText className="mx-auto text-slate-300 mb-3" size={48} />
                                <p className="text-slate-500 font-medium">Nessun documento trovato</p>
                                <p className="text-slate-400 text-sm mt-1">Crea il primo documento per questo progetto</p>
                            </div>
                        )}
                    </div>

                    {/* Modal Nuovo Documento */}
                    {showNewDocModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Seleziona Tipo Documento</h2>
                                    <button
                                        onClick={() => setShowNewDocModal(false)}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="space-y-6">
                                        {categories.filter(c => c.id !== 'all').map((category) => {
                                            const templates = getTemplatesByCategory(category.id as DocumentCategory);
                                            const Icon = category.icon;

                                            return (
                                                <div key={category.id}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Icon size={20} className="text-blue-600" />
                                                        <h3 className="font-bold text-slate-900">{category.name}</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {templates.map((template) => (
                                                            <button
                                                                key={template.id}
                                                                onClick={() => handleCreateDocument(template.type)}
                                                                className="text-left p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                                            >
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-700">
                                                                        {template.type}
                                                                    </h4>
                                                                    {template.isRequired && (
                                                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">
                                                                            OBBLIGATORIO
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-slate-500">Responsabile: {template.responsibleRole}</span>
                                                                    {template.normativeReference && (
                                                                        <span className="text-blue-600 font-medium">{template.normativeReference}</span>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Anteprima e Stampa */}
                    {showPreviewModal && selectedDocument && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold">Anteprima Documento</h2>
                                        <p className="text-emerald-100 text-sm mt-1">{selectedDocument.type} - {selectedDocument.number}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handlePrint}
                                            className="px-4 py-2 bg-white text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                        >
                                            <Printer size={18} />
                                            Stampa
                                        </button>
                                        <button
                                            onClick={() => setShowPreviewModal(false)}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                                    <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="w-full h-[600px] border-0"
                                            title="Document Preview"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Document Edit Modal */}
                    <DocumentEditModal
                        isOpen={showEditModal}
                        document={selectedDocument}
                        onClose={() => {
                            setShowEditModal(false);
                            setSelectedDocument(null);
                        }}
                        onSave={handleSaveDocument}
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
                        title="Elimina Documento"
                        message="Sei sicuro di voler eliminare questo documento? Questa azione non può essere annullata."
                        confirmText="Elimina"
                        cancelText="Annulla"
                        type="danger"
                        onConfirm={confirmDeleteDocument}
                        onCancel={() => setConfirmDelete({ isOpen: false, documentId: null })}
                    />
                </>
            )}
        </div>
    );
};

export default Documents;

