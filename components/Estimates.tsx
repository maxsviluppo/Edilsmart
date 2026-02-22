import React, { useMemo, useState } from 'react';
import { Project } from '../types';
import {
    FileSearch,
    Plus,
    Search,
    Euro,
    Calendar,
    User,
    CheckCircle2,
    Trash2,
    LayoutTemplate,
    XCircle,
    Archive
} from 'lucide-react';
import { formatCurrency } from '../services/formatUtils';
import ConfirmModal from './ConfirmModal';

interface EstimatesProps {
    projects: Project[];
    onUpdateProject: (project: Project) => void;
    onSelectProject: (id: string, tab?: string) => void;
    onNewEstimate: () => void;
    onDeleteProject: (id: string) => Promise<void>;
    isLoading?: boolean;
}

const Estimates: React.FC<EstimatesProps> = ({
    projects,
    onUpdateProject,
    onSelectProject,
    onNewEstimate,
    onDeleteProject,
    isLoading
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; projectId: string | null }>({
        isOpen: false,
        projectId: null
    });

    const estimates = useMemo(() => {
        return projects
            .filter(p => p.status === 'Preventivo' || p.status === 'In attesa' || p.status === 'Pianificato')
            .filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.client || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
    }, [projects, searchTerm]);

    const handleActivate = (project: Project) => {
        onUpdateProject({
            ...project,
            status: 'In Corso',
            startDate: project.startDate || new Date().toISOString().split('T')[0]
        });
    };

    const handleDeleteClick = (id: string) => {
        setDeleteConfirm({ isOpen: true, projectId: id });
    };

    const confirmDelete = () => {
        if (deleteConfirm.projectId) {
            onDeleteProject(deleteConfirm.projectId);
        }
        setDeleteConfirm({ isOpen: false, projectId: null });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <LayoutTemplate className="text-amber-500" />
                        Archivio Preventivi & Computi
                    </h2>
                    <p className="text-slate-500">Gestisci i computi metrici per i potenziali futuri cantieri</p>
                </div>
                <button
                    onClick={onNewEstimate}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-100 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    Nuovo Preventivo
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cerca per nome cantiere o cliente..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Estimates Grid */}
            {estimates.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-200">
                        <FileSearch size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Nessun preventivo trovato</h3>
                    <p className="text-slate-500 mb-8">Inizia creando un nuovo computo metrico per un potenziale cantiere.</p>
                    <button
                        onClick={onNewEstimate}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl font-bold transition-all"
                    >
                        Crea Preventivo
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {estimates.map(project => (
                        <div key={project.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 hover:shadow-lg transition-all group">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase ${project.status === 'Perso'
                                        ? 'bg-rose-50 border-rose-100 text-rose-700'
                                        : 'bg-amber-50 border-amber-100 text-amber-700'
                                        }`}>
                                        {project.status === 'Perso' ? 'Esito Negativo' : project.status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                                    <div className="flex items-center gap-1.5">
                                        <User size={16} className="text-slate-400" />
                                        <span className="font-medium">{project.client}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Euro size={16} className="text-slate-400" />
                                        <span className="font-bold text-slate-700">{formatCurrency(project.budget)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span>Creato il: {new Date(project.startDate || '').toLocaleDateString('it-IT')}</span>
                                    </div>
                                </div>

                                {project.location && (
                                    <p className="text-xs text-slate-400 font-medium">📍 {project.location}</p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => onSelectProject(project.id, 'computo')}
                                    className="flex-1 md:flex-none px-4 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-md active:scale-95"
                                >
                                    <FileSearch size={18} />
                                    Vedi Computo
                                </button>

                                {(project.client || '').trim().toLowerCase() === 'potenziale cliente' && (
                                    <button
                                        onClick={() => {
                                            const newClient = prompt("Inserisci il nome del Cliente/Condominio definitivo:", "");
                                            if (newClient) {
                                                onUpdateProject({ ...project, client: newClient });
                                            }
                                        }}
                                        className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all active:scale-95 animate-in fade-in zoom-in duration-200"
                                    >
                                        <User size={18} />
                                        Associa Cliente
                                    </button>
                                )}
                                <button
                                    onClick={() => handleActivate(project)}
                                    disabled={isLoading}
                                    className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <CheckCircle2 size={18} />}
                                    Attiva Cantiere
                                </button>

                                <div className="flex items-center gap-2 ml-0 md:ml-4 border-l border-slate-100 pl-4">
                                    <button
                                        onClick={() => handleDeleteClick(project.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Elimina"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Elimina Preventivo"
                message="Sei sicuro di voler eliminare definitivamente questo preventivo? Questa operazione non può essere annullata."
                confirmText="Sì, elimina"
                cancelText="Annulla"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, projectId: null })}
                type="danger"
            />
        </div>
    );
};

export default Estimates;
