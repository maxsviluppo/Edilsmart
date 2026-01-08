import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import { Quote, QuoteItem, Client, Project } from '../types';
import { calculateTotals, generateQuoteNumber } from '../services/invoiceService';

interface QuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (quote: Quote) => void;
    quote?: Quote | null;
    clients: Client[];
    projects: Project[];
}

const QuoteModal: React.FC<QuoteModalProps> = ({
    isOpen,
    onClose,
    onSave,
    quote,
    clients,
    projects,
}) => {
    const [formData, setFormData] = useState<Partial<Quote>>({
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Bozza',
        taxRate: 22,
        items: [],
    });

    useEffect(() => {
        if (quote) {
            setFormData(quote);
        } else {
            const today = new Date();
            const validUntil = new Date(today);
            validUntil.setDate(validUntil.getDate() + 30);

            setFormData({
                date: today.toISOString().split('T')[0],
                validUntil: validUntil.toISOString().split('T')[0],
                status: 'Bozza',
                taxRate: 22,
                items: [],
            });
        }
    }, [quote]);

    const handleClientChange = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setFormData(prev => ({
                ...prev,
                clientId: client.id,
                clientName: client.name,
                clientEmail: client.email,
                clientPhone: client.phone,
            }));
        }
    };

    const handleAddItem = () => {
        const newItem: QuoteItem = {
            id: `item-${Date.now()}`,
            description: '',
            quantity: 1,
            unit: 'pz',
            unitPrice: 0,
            amount: 0,
        };
        setFormData(prev => ({
            ...prev,
            items: [...(prev.items || []), newItem],
        }));
    };

    const handleUpdateItem = (index: number, field: keyof QuoteItem, value: any) => {
        const items = [...(formData.items || [])];
        items[index] = { ...items[index], [field]: value };

        if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
            const item = items[index];
            const baseAmount = item.quantity * item.unitPrice;
            const discount = item.discount || 0;
            items[index].amount = baseAmount - (baseAmount * discount / 100);
        }

        const totals = calculateTotals(items, formData.taxRate || 22);

        setFormData(prev => ({
            ...prev,
            items,
            ...totals,
        }));
    };

    const handleRemoveItem = (index: number) => {
        const items = (formData.items || []).filter((_, i) => i !== index);
        const totals = calculateTotals(items, formData.taxRate || 22);

        setFormData(prev => ({
            ...prev,
            items,
            ...totals,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientName || !formData.title || !formData.items || formData.items.length === 0) {
            alert('Compila tutti i campi obbligatori e aggiungi almeno una voce');
            return;
        }

        const quoteData: Quote = {
            id: quote?.id || `quote-${Date.now()}`,
            number: quote?.number || generateQuoteNumber(),
            date: formData.date!,
            validUntil: formData.validUntil!,
            projectId: formData.projectId,
            clientId: formData.clientId,
            clientName: formData.clientName!,
            clientEmail: formData.clientEmail,
            clientPhone: formData.clientPhone,
            title: formData.title!,
            description: formData.description,
            items: formData.items!,
            subtotal: formData.subtotal || 0,
            taxRate: formData.taxRate || 22,
            taxAmount: formData.taxAmount || 0,
            totalAmount: formData.totalAmount || 0,
            status: formData.status as any,
            notes: formData.notes,
            linkedToComputo: formData.linkedToComputo || false,
            computoIds: formData.computoIds,
            template: formData.template,
        };

        onSave(quoteData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileSpreadsheet size={28} />
                        <h2 className="text-2xl font-bold">
                            {quote ? 'Modifica Preventivo' : 'Nuovo Preventivo Rapido'}
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
                        {/* Informazioni Base */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Titolo Preventivo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="es. Ristrutturazione Appartamento"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Cliente *
                                </label>
                                <select
                                    value={formData.clientId || ''}
                                    onChange={(e) => handleClientChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    required
                                >
                                    <option value="">Seleziona cliente...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date e Progetto */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Data Emissione *
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Valido fino al *
                                </label>
                                <input
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Stato *
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    required
                                >
                                    <option value="Bozza">Bozza</option>
                                    <option value="Inviato">Inviato</option>
                                    <option value="Accettato">Accettato</option>
                                    <option value="Rifiutato">Rifiutato</option>
                                    <option value="Scaduto">Scaduto</option>
                                </select>
                            </div>
                        </div>

                        {/* Progetto */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Collega a Progetto (opzionale)
                            </label>
                            <select
                                value={formData.projectId || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value || undefined }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Nessun progetto</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>{project.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Descrizione */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Descrizione
                            </label>
                            <textarea
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                rows={2}
                                placeholder="Breve descrizione del preventivo..."
                            />
                        </div>

                        {/* Voci Preventivo */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-slate-700">
                                    Voci Preventivo *
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Plus size={16} />
                                    Aggiungi Voce
                                </button>
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Descrizione</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 w-32">Categoria</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 w-20">Q.tà</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 w-24">U.M.</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 w-28">Prezzo</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 w-28">Totale</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {(formData.items || []).map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                                        placeholder="Descrizione..."
                                                        required
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.category || ''}
                                                        onChange={(e) => handleUpdateItem(index, 'category', e.target.value)}
                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                                        placeholder="Categoria"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.unit}
                                                        onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                                        placeholder="pz"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="text-sm font-semibold text-slate-900">
                                                        € {item.amount.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1 hover:bg-slate-100 rounded text-red-600"
                                                        title="Rimuovi"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {(!formData.items || formData.items.length === 0) && (
                                    <div className="text-center py-8 text-slate-500">
                                        Nessuna voce aggiunta. Clicca "Aggiungi Voce" per iniziare.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Totali */}
                        <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700">IVA %</span>
                                <input
                                    type="number"
                                    value={formData.taxRate}
                                    onChange={(e) => {
                                        const taxRate = parseFloat(e.target.value) || 0;
                                        const totals = calculateTotals(formData.items || [], taxRate);
                                        setFormData(prev => ({ ...prev, taxRate, ...totals }));
                                    }}
                                    className="w-24 px-2 py-1 border border-slate-300 rounded text-sm text-right"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Subtotale</span>
                                <span className="font-semibold text-slate-900">€ {(formData.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">IVA ({formData.taxRate}%)</span>
                                <span className="font-semibold text-slate-900">€ {(formData.taxAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                                <span className="font-bold text-slate-900">Totale</span>
                                <span className="text-xl font-bold text-purple-600">€ {(formData.totalAmount || 0).toFixed(2)}</span>
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                rows={3}
                                placeholder="Note aggiuntive..."
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
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-sm"
                    >
                        {quote ? 'Salva Modifiche' : 'Crea Preventivo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuoteModal;
