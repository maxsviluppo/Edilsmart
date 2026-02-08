import React, { useState, useMemo } from 'react';
import { Project, Expense } from '../types';
import { Package, TrendingUp, Search, Calendar, FileText, ArrowUpRight, ArrowDownRight, Filter, Plus, Edit2, Euro } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MaterialsProps {
    projects: Project[];
    selectedProjectId: string;
    onUpdateProject?: (project: Project) => void;
}

const Materials: React.FC<MaterialsProps> = ({ projects, selectedProjectId, onUpdateProject }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState(selectedProjectId || '');
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
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

    // Chart Data (Last 6 months)
    const chartData = useMemo(() => {
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return d.toISOString().slice(0, 7); // YYYY-MM
        }).reverse();

        return last6Months.map(month => {
            const monthlyTotal = filteredTransactions
                .filter(t => t.date.startsWith(month))
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);

            const [y, m] = month.split('-');
            const monthName = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('it-IT', { month: 'short' });

            return {
                name: monthName,
                cost: monthlyTotal
            };
        });
    }, [filteredTransactions]);

    const handleAddMaterial = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMaterial.amount || !onUpdateProject || !newMaterial.projectId) return;

        const project = projects.find(p => p.id === newMaterial.projectId);
        if (!project) return;

        const amount = parseFloat(newMaterial.amount);
        const transaction: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            date: newMaterial.date,
            description: `Materiale: ${newMaterial.description || 'Nessuna descrizione'} ${newMaterial.supplier ? `(${newMaterial.supplier})` : ''}`,
            amount: -amount, // Negative for Expense
            category: 'Materiali',
            status: 'Pagato' as const,
            projectId: project.id,
            paymentType: (newMaterial.paymentMethod as any) || 'Bonifico'
        };

        const updatedExpenses = [...(project.expenses || []), transaction];

        onUpdateProject({
            ...project,
            expenses: updatedExpenses,
            totalExpenses: (project.totalExpenses || 0) + amount
        });

        setIsMaterialModalOpen(false);
        setNewMaterial({
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            supplier: '',
            projectId: newMaterial.projectId,
            paymentMethod: 'Bonifico'
        });
    });
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transaction List */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                        Nessun acquisto registrato
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                <h3 className="font-bold text-slate-800 mb-6">Andamento Costi Materiali</h3>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Costo Materiali" />
                        </BarChart>
                    </ResponsiveContainer>
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
                            Registra Acquisto Materiale
                        </h3>
                        <button
                            onClick={() => setIsMaterialModalOpen(false)}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <Edit2 size={20} className="rotate-45" />
                        </button>
                    </div>

                    <form onSubmit={handleAddMaterial} className="p-6 space-y-4">
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
                                onClick={() => setIsMaterialModalOpen(false)}
                                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                Registra Spesa
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
