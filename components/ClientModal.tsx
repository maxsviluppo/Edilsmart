import React, { useState, useEffect } from 'react';
import { X, User, Building2 } from 'lucide-react';
import { Client } from '../types';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (client: Client) => void;
    client?: Client | null;
}

const ClientModal: React.FC<ClientModalProps> = ({
    isOpen,
    onClose,
    onSave,
    client,
}) => {
    const [formData, setFormData] = useState<Partial<Client>>({
        type: 'Privato',
    });

    useEffect(() => {
        if (client) {
            setFormData(client);
        } else {
            setFormData({
                type: 'Privato',
            });
        }
    }, [client]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            alert('Inserisci il nome del cliente');
            return;
        }

        const clientData: Client = {
            id: client?.id || `client-${Date.now()}`,
            name: formData.name!,
            type: formData.type as any,
            vatNumber: formData.vatNumber,
            fiscalCode: formData.fiscalCode,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            notes: formData.notes,
            createdDate: client?.createdDate || new Date().toISOString(),
        };

        onSave(clientData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {formData.type === 'Privato' ? <User size={28} /> : <Building2 size={28} />}
                        <h2 className="text-2xl font-bold">
                            {client ? 'Modifica Cliente' : 'Nuovo Cliente'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Tipo Cliente */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Tipo Cliente *
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['Privato', 'Azienda', 'Ente Pubblico'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                                        className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${formData.type === type
                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nome */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                {formData.type === 'Privato' ? 'Nome e Cognome *' : 'Ragione Sociale *'}
                            </label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder={formData.type === 'Privato' ? 'Mario Rossi' : 'Azienda SRL'}
                                required
                            />
                        </div>

                        {/* P.IVA e Codice Fiscale */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.type !== 'Privato' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Partita IVA
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.vatNumber || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, vatNumber: e.target.value }))}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="IT12345678901"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Codice Fiscale
                                </label>
                                <input
                                    type="text"
                                    value={formData.fiscalCode || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fiscalCode: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="RSSMRA80A01H501Z"
                                />
                            </div>
                        </div>

                        {/* Contatti */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="email@esempio.it"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Telefono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="+39 333 1234567"
                                />
                            </div>
                        </div>

                        {/* Indirizzo */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Indirizzo
                            </label>
                            <input
                                type="text"
                                value={formData.address || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Via Roma 10"
                            />
                        </div>

                        {/* Città e CAP */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Città
                                </label>
                                <input
                                    type="text"
                                    value={formData.city || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Milano"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    CAP
                                </label>
                                <input
                                    type="text"
                                    value={formData.postalCode || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="20100"
                                    maxLength={5}
                                />
                            </div>
                        </div>

                        {/* Note */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Note
                            </label>
                            <textarea
                                value={formData.notes || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Note aggiuntive sul cliente..."
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                    >
                        {client ? 'Salva Modifiche' : 'Crea Cliente'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientModal;
