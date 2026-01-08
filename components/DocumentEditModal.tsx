import React, { useState, useEffect } from 'react';
import { X, Save, FileText, AlertCircle } from 'lucide-react';
import { Document, CILAData, PSCData, DiCoData, SALData } from '../types';

interface DocumentEditModalProps {
    isOpen: boolean;
    document: Document | null;
    onClose: () => void;
    onSave: (document: Document) => void;
}

const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
    isOpen,
    document,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState<any>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (document) {
            setFormData(document.data || {});
        }
    }, [document]);

    if (!isOpen || !document) return null;

    const handleSave = () => {
        const updatedDocument: Document = {
            ...document,
            data: formData,
            lastModified: new Date().toISOString()
        };
        onSave(updatedDocument);
        onClose();
    };

    const updateField = (path: string, value: any) => {
        const keys = path.split('.');
        const newData = { ...formData };
        let current: any = newData;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        setFormData(newData);
    };

    const getField = (path: string) => {
        const keys = path.split('.');
        let current: any = formData;

        for (const key of keys) {
            if (current === undefined || current === null) return '';
            current = current[key];
        }

        return current || '';
    };

    // Render form basato sul tipo di documento
    const renderCILAForm = () => {
        return (
            <div className="space-y-6">
                {/* Dati Committente */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-200">
                        Dati del Committente
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nome e Cognome / Ragione Sociale *
                            </label>
                            <input
                                type="text"
                                value={getField('client.name')}
                                onChange={(e) => updateField('client.name', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. Mario Rossi"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Codice Fiscale / P.IVA *
                            </label>
                            <input
                                type="text"
                                value={getField('client.fiscalCode')}
                                onChange={(e) => updateField('client.fiscalCode', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. RSSMRA80A01H501Z"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Indirizzo Completo *
                        </label>
                        <input
                            type="text"
                            value={getField('client.address')}
                            onChange={(e) => updateField('client.address', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Es. Via Roma 123, 00100 Roma (RM)"
                        />
                    </div>
                </div>

                {/* Dati Immobile */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-200">
                        Dati dell'Immobile
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Indirizzo Cantiere *
                            </label>
                            <input
                                type="text"
                                value={getField('property.address')}
                                onChange={(e) => updateField('property.address', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. Via Garibaldi 45, 20100 Milano (MI)"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Dati Catastali *
                                </label>
                                <input
                                    type="text"
                                    value={getField('property.cadastralData')}
                                    onChange={(e) => updateField('property.cadastralData', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Es. Foglio 12, Particella 345, Sub 6"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Zona Urbanistica
                                </label>
                                <input
                                    type="text"
                                    value={getField('property.urbanPlanningZone')}
                                    onChange={(e) => updateField('property.urbanPlanningZone', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Es. Zona B - Residenziale"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Descrizione Intervento */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-200">
                        Descrizione Intervento
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Tipologia Intervento *
                            </label>
                            <select
                                value={getField('interventionType')}
                                onChange={(e) => updateField('interventionType', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Seleziona...</option>
                                <option value="Manutenzione Straordinaria">Manutenzione Straordinaria</option>
                                <option value="Ristrutturazione Edilizia">Ristrutturazione Edilizia</option>
                                <option value="Restauro e Risanamento">Restauro e Risanamento Conservativo</option>
                                <option value="Nuova Costruzione">Nuova Costruzione</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Data Inizio Lavori *
                            </label>
                            <input
                                type="date"
                                value={getField('startDate')}
                                onChange={(e) => updateField('startDate', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Durata Prevista (giorni) *
                            </label>
                            <input
                                type="number"
                                value={getField('estimatedDuration')}
                                onChange={(e) => updateField('estimatedDuration', parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. 90"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Costo Stimato (€) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={getField('estimatedCost')}
                                onChange={(e) => updateField('estimatedCost', parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. 50000.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Descrizione Lavori *
                        </label>
                        <textarea
                            value={getField('works.description')}
                            onChange={(e) => updateField('works.description', e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Descrizione dettagliata dei lavori da eseguire..."
                        />
                    </div>
                    <div className="mt-4 space-y-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={getField('works.affectStructure') || false}
                                onChange={(e) => updateField('works.affectStructure', e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                L'intervento interessa parti strutturali
                            </span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={getField('works.affectEnergy') || false}
                                onChange={(e) => updateField('works.affectEnergy', e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                L'intervento interessa l'efficienza energetica
                            </span>
                        </label>
                    </div>
                </div>

                {/* Tecnico Asseveratore */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-blue-200">
                        Tecnico Asseveratore
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Nome e Cognome *
                            </label>
                            <input
                                type="text"
                                value={getField('technician.name')}
                                onChange={(e) => updateField('technician.name', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. Ing. Giuseppe Verdi"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Qualifica *
                            </label>
                            <input
                                type="text"
                                value={getField('technician.qualification')}
                                onChange={(e) => updateField('technician.qualification', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. Ingegnere Civile"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Numero Iscrizione Albo *
                            </label>
                            <input
                                type="text"
                                value={getField('technician.registrationNumber')}
                                onChange={(e) => updateField('technician.registrationNumber', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. A12345"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                PEC *
                            </label>
                            <input
                                type="email"
                                value={getField('technician.pec')}
                                onChange={(e) => updateField('technician.pec', e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Es. tecnico@pec.it"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderGenericForm = () => {
        return (
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm text-blue-900 font-medium">
                            Form specifico in sviluppo
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                            Per questo tipo di documento, utilizza la funzione di anteprima e stampa per visualizzare i dati.
                            La modifica completa sarà disponibile a breve.
                        </p>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Note Aggiuntive
                    </label>
                    <textarea
                        value={document.notes || ''}
                        onChange={(e) => {
                            const updatedDoc = { ...document, notes: e.target.value };
                            onSave(updatedDoc);
                        }}
                        rows={6}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Aggiungi note o osservazioni..."
                    />
                </div>
            </div>
        );
    };

    const renderForm = () => {
        switch (document.type) {
            case 'CILA':
                return renderCILAForm();
            // Altri form specifici possono essere aggiunti qui
            default:
                return renderGenericForm();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText size={28} />
                        <div>
                            <h2 className="text-2xl font-bold">Modifica Documento</h2>
                            <p className="text-blue-100 text-sm mt-1">
                                {document.type} - {document.number}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {renderForm()}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-between items-center">
                    <p className="text-sm text-slate-600">
                        * Campi obbligatori
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg flex items-center gap-2"
                        >
                            <Save size={18} />
                            Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentEditModal;
