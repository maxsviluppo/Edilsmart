import React, { useState } from 'react';
import { Project } from '../types';
import {
    Building,
    User,
    MapPin,
    Calendar,
    Euro,
    FileText,
    Clock,
    Edit2,
    Trash2,
    X,
    AlertTriangle,
    Save
} from 'lucide-react';

interface ProjectSettingsProps {
    project: Project;
    onUpdate: (project: Project) => void;
    onDelete: (projectId: string) => void;
    onClose: () => void;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project, onUpdate, onDelete, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editedProject, setEditedProject] = useState<Project>(project);

    const handleSave = () => {
        onUpdate(editedProject);
        setIsEditing(false);
    };

    const handleDelete = () => {
        onDelete(project.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Corso': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'Completato': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'In attesa': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Building className="text-emerald-600" size={32} />
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Anagrafica Cantiere</h2>
                            <p className="text-slate-500 text-sm">Gestisci i dati del progetto</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Chiudi"
                    >
                        <X size={24} className="text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Main Info Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Informazioni Principali</h3>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            <Edit2 size={18} />
                            Modifica
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                            >
                                <Save size={18} />
                                Salva
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditedProject(project);
                                }}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                            >
                                Annulla
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome Progetto */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Progetto</label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                                value={editedProject.name}
                                onChange={e => setEditedProject({ ...editedProject, name: e.target.value })}
                            />
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="font-semibold text-slate-800">{project.name}</p>
                            </div>
                        )}
                    </div>

                    {/* Cliente */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <User size={16} className="inline mr-1" />
                            Cliente / Committente
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                                value={editedProject.client}
                                onChange={e => setEditedProject({ ...editedProject, client: e.target.value })}
                            />
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="font-semibold text-slate-800">{project.client}</p>
                            </div>
                        )}
                    </div>

                    {/* Ubicazione */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <MapPin size={16} className="inline mr-1" />
                            Ubicazione
                        </label>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                                value={editedProject.location || ''}
                                onChange={e => setEditedProject({ ...editedProject, location: e.target.value })}
                            />
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-slate-800">{project.location || 'Non specificata'}</p>
                            </div>
                        )}
                    </div>

                    {/* Stato */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Stato Progetto</label>
                        {isEditing ? (
                            <select
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={editedProject.status}
                                onChange={e => setEditedProject({ ...editedProject, status: e.target.value as Project['status'] })}
                            >
                                <option value="Pianificato">Pianificato</option>
                                <option value="In attesa">In attesa</option>
                                <option value="In Corso">In Corso</option>
                                <option value="Completato">Completato</option>
                            </select>
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Data Inizio */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            Data Inizio
                        </label>
                        {isEditing ? (
                            <input
                                type="date"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={editedProject.startDate || ''}
                                onChange={e => setEditedProject({ ...editedProject, startDate: e.target.value })}
                            />
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-slate-800">
                                    {project.startDate ? new Date(project.startDate).toLocaleDateString('it-IT') : 'Non specificata'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Data Fine */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Clock size={16} className="inline mr-1" />
                            Data Fine Prevista
                        </label>
                        {isEditing ? (
                            <input
                                type="date"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={editedProject.endDate || ''}
                                onChange={e => setEditedProject({ ...editedProject, endDate: e.target.value })}
                            />
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-slate-800">
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString('it-IT') : 'Non specificata'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Avanzamento */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Avanzamento Lavori (%)</label>
                        {isEditing ? (
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={editedProject.progress || 0}
                                onChange={e => setEditedProject({ ...editedProject, progress: parseInt(e.target.value) || 0 })}
                            />
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-emerald-600 h-full rounded-full transition-all"
                                            style={{ width: `${project.progress || 0}%` }}
                                        />
                                    </div>
                                    <span className="font-bold text-slate-800 w-12 text-right">{project.progress || 0}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Financial Info */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6">Informazioni Economiche</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Budget */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Euro size={16} className="inline mr-1" />
                            Totale Preventivo (€)
                        </label>
                        {isEditing ? (
                            <input
                                type="number"
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={editedProject.budget}
                                onChange={e => setEditedProject({ ...editedProject, budget: parseFloat(e.target.value) || 0 })}
                            />
                        ) : (
                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="text-2xl font-bold text-emerald-700">
                                    € {project.budget?.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* IVA */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <FileText size={16} className="inline mr-1" />
                            IVA (%)
                        </label>
                        {isEditing ? (
                            <select
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={editedProject.iva || 10}
                                onChange={e => setEditedProject({ ...editedProject, iva: parseInt(e.target.value) })}
                            >
                                <option value="10">10%</option>
                                <option value="20">20%</option>
                                <option value="22">22%</option>
                            </select>
                        ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <p className="text-xl font-bold text-slate-800">{project.iva || 0}%</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    € {((project.budget || 0) * (project.iva || 0) / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Totale con IVA */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Totale IVA Inclusa</label>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-2xl font-bold text-blue-700">
                                € {((editedProject.budget || 0) + ((editedProject.budget || 0) * (editedProject.iva || 0) / 100)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-rose-50 p-6 rounded-xl border-2 border-rose-200">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="text-rose-600 flex-shrink-0 mt-1" size={24} />
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-rose-800 mb-2">Zona Pericolosa</h3>
                        <p className="text-sm text-rose-700 mb-4">
                            L'eliminazione del cantiere è permanente e rimuoverà tutti i dati associati (computo metrico, cronoprogramma, ecc.).
                            Questa azione non può essere annullata.
                        </p>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors"
                        >
                            <Trash2 size={18} />
                            Elimina Cantiere
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-rose-600 px-6 py-4 flex items-center gap-3 text-white">
                            <AlertTriangle size={28} />
                            <h3 className="text-xl font-bold">Conferma Eliminazione</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700 mb-2">
                                Stai per eliminare il cantiere:
                            </p>
                            <p className="text-lg font-bold text-slate-900 mb-4">
                                "{project.name}"
                            </p>
                            <p className="text-sm text-slate-600 mb-6">
                                Tutti i dati associati (computo metrico, cronoprogramma, documenti) verranno eliminati definitivamente.
                                Questa azione non può essere annullata.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Sì, Elimina
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectSettings;
