import React, { useState, useMemo } from 'react';
import { Project, Expense } from '../types';
import { Package, TrendingUp, Search, Calendar, FileText, ArrowUpRight, ArrowDownRight, Filter, Plus, Edit2, Euro, Trash2 } from 'lucide-react';

interface MaterialsProps {
    projects: Project[];
    selectedProjectId: string;
    onUpdateProject?: (project: Project) => void;
}

const Materials: React.FC<MaterialsProps> = ({ projects, selectedProjectId, onUpdateProject }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState(selectedProjectId || '');
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [editingState, setEditingState] = useState<{ id: string, originalProjectId: string } | null>(null);
    const [newMaterial, setNewMaterial] = useState({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        projectId: selectedProjectId || (projects.length > 0 ? projects[0].id : ''),
        paymentMethod: 'Bonifico'
    });

    // Aggregate all material expenses from all projects (or filtered)
    const materialTransactions = useMemo(() => {
        let allExpenses: (Expense & { projectName: string })[] = [];

        const projectsToScan = selectedProjectFilter
            ? projects.filter(p => p.id === selectedProjectFilter)
            : projects;

        projectsToScan.forEach(project => {
            if (project.expenses) {
                const materials = project.expenses
                    .filter(e => e.category === 'Materiali')
                    .map(e => ({ ...e, projectName: project.name }));
                allExpenses = [...allExpenses, ...materials];
            }
        });

        // Sort by date desc
        return allExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [projects, selectedProjectFilter]);

    // Filter by search term
    const filteredTransactions = useMemo(() => {
        return materialTransactions.filter(t =>
            t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.amount.toString().includes(searchTerm) ||
            t.projectName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [materialTransactions, searchTerm]);

    // Calculate totals
    const totalMaterialsCost = filteredTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgMaterialCost = filteredTransactions.length > 0 ? totalMaterialsCost / filteredTransactions.length : 0;

    const handleCloseModal = () => {
        setIsMaterialModalOpen(false);
        setEditingState(null);
        setNewMaterial({
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            supplier: '',
            projectId: selectedProjectId || (projects.length > 0 ? projects[0].id : ''),
            paymentMethod: 'Bonifico'
        });
    };

    const handleEditClick = (t: any) => {
        const matchSupplier = t.description.match(/\s\(([^)]+)\)$/);
        let rawDesc = t.description.replace(/^Materiale: /, '');
        let supplier = '';
        if (matchSupplier) {
            supplier = matchSupplier[1];
            rawDesc = rawDesc.replace(matchSupplier[0], '');
        }

        setNewMaterial({
            amount: Math.abs(t.amount).toString(),
            description: rawDesc,
            date: t.date,
            supplier: supplier,
            projectId: t.projectId,
            paymentMethod: t.paymentType || 'Bonifico'
        });
        setEditingState({ id: t.id, originalProjectId: t.projectId });
        setIsMaterialModalOpen(true);
    };

    const handleDeleteMaterial = (t: any) => {
        if (!confirm('Sei sicuro di voler eliminare questa spesa?')) return;
        if (!onUpdateProject) return;

        const project = projects.find(p => p.id === t.projectId);
        if (!project) return;

        const amountAbs = Math.abs(t.amount);
        const updatedExpenses = project.expenses?.filter(e => e.id !== t.id) || [];

        onUpdateProject({
            ...project,
            expenses: updatedExpenses,
            totalExpenses: (project.totalExpenses || 0) - amountAbs
        });
    };

    const handleSaveMaterial = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMaterial.amount || !onUpdateProject || !newMaterial.projectId) return;

        const amountVal = parseFloat(newMaterial.amount);
        const descriptionComplete = `Materiale: ${newMaterial.description || 'Nessuna descrizione'} ${newMaterial.supplier ? `(${newMaterial.supplier})` : ''}`;

        if (editingState) {
            const originalProject = projects.find(p => p.id === editingState.originalProjectId);
            const targetProject = projects.find(p => p.id === newMaterial.projectId);

            if (originalProject && targetProject) {
                const updatedExpense: Expense = {
                    id: editingState.id,
                    date: newMaterial.date,
                    description: descriptionComplete,
                    amount: -amountVal,
                    category: 'Materiali',
                    status: 'Pagato',
                    projectId: targetProject.id,
                    paymentType: (newMaterial.paymentMethod as any) || 'Bonifico'
                };

                // Same Project
                if (originalProject.id === targetProject.id) {
                    const oldExpense = originalProject.expenses?.find(e => e.id === editingState.id);
                    const oldAmountAbs = oldExpense ? Math.abs(oldExpense.amount) : 0;
                    const updatedExpenses = originalProject.expenses?.map(e =>
                        e.id === editingState.id ? updatedExpense : e
                    ) || [];

                    onUpdateProject({
                        ...originalProject,
                        expenses: updatedExpenses,
                        totalExpenses: (originalProject.totalExpenses || 0) - oldAmountAbs + amountVal
                    });
                }
                // Changed Project
                else {
                    const oldExpense = originalProject.expenses?.find(e => e.id === editingState.id);
                    const oldAmountAbs = oldExpense ? Math.abs(oldExpense.amount) : 0;
                    const originalExpenses = originalProject.expenses?.filter(e => e.id !== editingState.id) || [];

                    onUpdateProject({
                        ...originalProject,
                        expenses: originalExpenses,
                        totalExpenses: (originalProject.totalExpenses || 0) - oldAmountAbs
                    });

                    const targetExpenses = [...(targetProject.expenses || []), updatedExpense];
                    onUpdateProject({
                        ...targetProject,
                        expenses: targetExpenses,
                        totalExpenses: (targetProject.totalExpenses || 0) + amountVal
                    });
                }
            }
        } else {
            // New Creation
            const project = projects.find(p => p.id === newMaterial.projectId);
            if (project) {
                const transaction: Expense = {
                    id: Math.random().toString(36).substr(2, 9),
                    date: newMaterial.date,
                    description: descriptionComplete,
                    amount: -amountVal, // Negative
                    category: 'Materiali',
                    status: 'Pagato',
                    projectId: project.id,
                    paymentType: (newMaterial.paymentMethod as any) || 'Bonifico'
                };

                const updatedExpenses = [...(project.expenses || []), transaction];
                onUpdateProject({
                    ...project,
                    expenses: updatedExpenses,
                    totalExpenses: (project.totalExpenses || 0) + amountVal
                });
            }
        }
        handleCloseModal();
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="text-blue-600" />
                        Gestione Materiali
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Monitoraggio costi e acquisti materiali per cantiere</p>
                </div>

                {/* Project Filter */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMaterialModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-lg shadow-blue-200 transition-all font-bold text-sm"
                    >
                        <Plus size={18} className="mr-2" />
                        Registra Materiale
                    </button>

                    <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <Filter size={16} className="text-slate-400 ml-2" />
                        <select
                            value={selectedProjectFilter}
                            onChange={(e) => setSelectedProjectFilter(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700 outline-none cursor-pointer p-2 min-w-[200px]"
                        >
                            <option value="">Tutti i Cantieri</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Totale Speso</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">€ {totalMaterialsCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Acquisti Totali</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">{filteredTransactions.length}</h3>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                            <Package size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Costo Medio Acquisto</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">€ {avgMaterialCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                {/* Transaction List */}
                <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Storico Acquisti</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cerca materiale..."
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Descrizione</th>
                                    <th className="px-6 py-3">Cantiere</th>
                                    <th className="px-6 py-3 text-right">Importo</th>
                                    <th className="px-6 py-3 text-center">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">{t.date}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <Package size={14} className="text-slate-400" />
                                                    {t.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                    {t.projectName}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700">
                                                € {Math.abs(t.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEditClick(t)} className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded" title="Modifica">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteMaterial(t)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded" title="Elimina">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            Nessun acquisto registrato
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Material Modal */}
            {isMaterialModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-blue-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <Package className="mr-2 text-blue-600" size={20} />
                                {editingState ? 'Modifica Spesa' : 'Registra Acquisto Materiale'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <Edit2 size={20} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMaterial} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Cantiere</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newMaterial.projectId}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, projectId: e.target.value })}
                                >
                                    <option value="">Seleziona un cantiere</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newMaterial.date}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, date: e.target.value })}
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
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newMaterial.amount}
                                        onChange={(e) => setNewMaterial({ ...newMaterial, amount: e.target.value })}
                                    />
                                    <Euro className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Metodo di Pagamento</label>
                                <select
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newMaterial.paymentMethod}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, paymentMethod: e.target.value })}
                                >
                                    <option value="Bonifico">Bonifico</option>
                                    <option value="Carta di Credito">Carta di Credito</option>
                                    <option value="Contanti">Contanti</option>
                                    <option value="Assegno">Assegno</option>
                                    <option value="RiBa">RiBa</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Fornitore (Opzionale)</label>
                                <input
                                    type="text"
                                    placeholder="Es: Leroy Merlin"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newMaterial.supplier}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Descrizione</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Es: Cemento, mattoni, etc."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newMaterial.description}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                                />
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100 mt-2">
                                <TrendingUp className="text-blue-600 mt-0.5" size={18} />
                                <p className="text-xs text-blue-800 leading-relaxed">
                                    Questa spesa verrà registrata automaticamente nella contabilità del cantiere selezionato.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    {editingState ? 'Salva Modifiche' : 'Registra Spesa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Materials;
