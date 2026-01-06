import React, { useState } from 'react';
import { X, Save, Building, User, Calendar, Euro, MapPin } from 'lucide-react';
import { Project } from '../types';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Project) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        location: '',
        budget: '',
        startDate: new Date().toISOString().split('T')[0],
        description: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.client) {
            alert("Compila almeno Nome e Cliente");
            return;
        }

        const newProject: Project = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.name,
            client: formData.client,
            location: formData.location,
            budget: parseFloat(formData.budget) || 0,
            startDate: formData.startDate,
            status: 'Pianificato',
            progress: 0,
            computo: [],
            expenses: []
        };

        onSave(newProject);
        setFormData({
            name: '',
            client: '',
            location: '',
            budget: '',
            startDate: new Date().toISOString().split('T')[0],
            description: ''
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold flex items-center">
                        <Building className="mr-2" size={24} />
                        Nuovo Cantiere
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Progetto *</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Es. Ristrutturazione Villa..."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <Building size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Cliente *</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Nome committente..."
                                value={formData.client}
                                onChange={e => setFormData({ ...formData, client: e.target.value })}
                            />
                            <User size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Budget Stimato (€)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="0.00"
                                    value={formData.budget}
                                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                                />
                                <Euro size={18} className="absolute left-3 top-2.5 text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Data Inizio</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                />
                                <Calendar size={18} className="absolute left-3 top-2.5 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Luogo / Indirizzo</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                placeholder="Indirizzo del cantiere..."
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                            <MapPin size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                            Annulla
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex justify-center items-center">
                            <Save size={18} className="mr-2" />
                            Crea Progetto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProjectModal;
