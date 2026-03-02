import React, { useState } from 'react';
import { X, Save, Building, User, Calendar, Euro, MapPin } from 'lucide-react';
import { Project } from '../types';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: any) => Promise<void>;
    initialType?: 'In Corso' | 'Preventivo';
    isLoading?: boolean;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSave, initialType, isLoading }) => {
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        location: '',
        budget: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        ivaSelection: '10',
        ivaCustom: '',
        description: '',
        type: (initialType || 'In Corso') as 'In Corso' | 'Preventivo'
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert("Inserisci almeno il Nome del Progetto o Condominio");
            return;
        }

        const clientName = formData.client.trim() || "Potenziale Cliente";

        // Mappatura tipo per il salvataggio (escludiamo ID perché lo genera il DB)
        const projectToSave: any = {
            name: formData.name,
            client: clientName,
            location: formData.location,
            budget: parseFloat(formData.budget.replace(/\./g, '')) || 0,
            startDate: formData.startDate,
            endDate: formData.endDate,
            iva: formData.ivaSelection === 'custom' ? (parseFloat(formData.ivaCustom) || 0) : parseInt(formData.ivaSelection),
            description: formData.description,
            status: formData.type,
            progress: 0,
            computo: [],
            expenses: []
        };

        try {
            await onSave(projectToSave);
            // Il reset e la chiusura avvengono solo se onSave va a buon fine
            setFormData({
                name: '',
                client: '',
                location: '',
                budget: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                ivaSelection: '10',
                ivaCustom: '',
                description: '',
                type: 'In Corso'
            });
            onClose();
        } catch (error) {
            // L'errore viene gestito dal toast in App.tsx, qui giriamo solo il caricamento
            console.error("Errore durante il salvataggio nel modal:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                    <h2 className="text-xl font-bold flex items-center">
                        <Building className="mr-2" size={24} />
                        {formData.type === 'Preventivo' ? 'Nuovo Computo Metrico' : 'Nuovo Cantiere Attivo'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'In Corso' })}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === 'In Corso' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Cantiere Attivo
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'Preventivo' })}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.type === 'Preventivo' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Preventivo / Studio
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Progetto *</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all capitalize"
                                placeholder="Es. Ristrutturazione Villa..."
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <Building size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Cliente / Condominio (Opzionale)</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all capitalize"
                                placeholder="Nome committente o condominio..."
                                value={formData.client}
                                onChange={e => setFormData({ ...formData, client: e.target.value })}
                            />
                            <User size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Totale Preventivo (€)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="0"
                                    value={formData.budget}
                                    onChange={e => {
                                        // Rimuovi tutto ciò che non è numero
                                        const value = e.target.value.replace(/\D/g, '');
                                        // Formatta con i punti per le migliaia
                                        const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                        setFormData({ ...formData, budget: formatted });
                                    }}
                                />
                                <Euro size={18} className="absolute left-3 top-2.5 text-slate-400" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">IVA</label>
                            <div className="flex gap-2">
                                <select
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.ivaSelection}
                                    onChange={e => setFormData({ ...formData, ivaSelection: e.target.value })}
                                >
                                    <option value="10">10%</option>
                                    <option value="20">20%</option>
                                    <option value="custom">Altro</option>
                                </select>
                                {formData.ivaSelection === 'custom' && (
                                    <input
                                        type="number"
                                        placeholder="%"
                                        className="w-20 px-2 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        value={formData.ivaCustom}
                                        onChange={e => setFormData({ ...formData, ivaCustom: e.target.value })}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Totale IVA Inclusa (€)</label>
                        <div className="relative">
                            <input
                                type="text"
                                readOnly
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 font-bold outline-none"
                                value={(() => {
                                    const budget = parseFloat(formData.budget.replace(/\./g, '')) || 0;
                                    const ivaRate = formData.ivaSelection === 'custom'
                                        ? (parseFloat(formData.ivaCustom) || 0)
                                        : parseInt(formData.ivaSelection);
                                    const total = budget + (budget * ivaRate / 100);
                                    // Formatta anche il totale con i punti
                                    return total > 0 ? total.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '0,00';
                                })()}
                            />
                            <Euro size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Data Prevista Fine</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    value={formData.endDate}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
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
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all capitalize"
                                placeholder="Indirizzo del cantiere..."
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                            <MapPin size={18} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 transition-all flex justify-center items-center disabled:opacity-70"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save size={18} className="mr-2" />
                                    {formData.type === 'Preventivo' ? 'Salva Computo' : 'Crea Progetto'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProjectModal;
