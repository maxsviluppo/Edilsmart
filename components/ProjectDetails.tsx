import React, { useState, useEffect } from 'react';
import { Project, Employee, PayrollEntry } from '../types';
import {
    Building,
    User,
    MapPin,
    Calendar,
    Euro,
    TrendingUp,
    FileText,
    Receipt,
    Settings as SettingsIcon,
    ArrowRight,
    Clock,
    GanttChart,
    StickyNote,
    Edit2,
    DollarSign,
    Package,
    Trash2,
    Plus,
    Printer
} from 'lucide-react';

interface ProjectDetailsProps {
    project: Project;
    onNavigate: (tab: string) => void;
    onOpenSettings: () => void;
    onUpdateProject?: (project: Project) => void; // Optional to avoid breaking other usages immediately
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onNavigate, onOpenSettings, onUpdateProject }) => {
    const [monthlyNotes, setMonthlyNotes] = useState<Record<string, string>>({});
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [tempNote, setTempNote] = useState('');
    const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        const savedNotes = localStorage.getItem('edilsmart_project_monthly_notes');
        if (savedNotes) {
            try { setMonthlyNotes(JSON.parse(savedNotes)); } catch (e) { }
        }

        const savedPayroll = localStorage.getItem('edilsmart_payroll_entries');
        if (savedPayroll) {
            try { setPayrollEntries(JSON.parse(savedPayroll)); } catch (e) { }
        }

        const savedEmployees = localStorage.getItem('edilsmart_employees');
        if (savedEmployees) {
            try { setEmployees(JSON.parse(savedEmployees)); } catch (e) { }
        }
    }, [project.id]);

    const currentDate = new Date();
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const currentNoteKey = `${project.id}-${monthKey}`;
    const currentNote = monthlyNotes[currentNoteKey] || '';

    // Acconti State
    const [isAccontoModalOpen, setIsAccontoModalOpen] = useState(false);
    const [newAcconto, setNewAcconto] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });

    // Filter State
    const [dateFilter, setDateFilter] = useState('all');

    const [editingId, setEditingId] = useState<string | null>(null);


    const handleSaveNote = () => {
        const updated = { ...monthlyNotes, [currentNoteKey]: tempNote };
        setMonthlyNotes(updated);
        localStorage.setItem('edilsmart_project_monthly_notes', JSON.stringify(updated));
        setIsEditingNote(false);
    };

    const handleAddAcconto = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAcconto.amount || !onUpdateProject) return;

        const amount = parseFloat(newAcconto.amount);

        // Handle Edit or Create
        if (editingId) {
            const updatedExpenses = (project.expenses || []).map(exp => {
                if (exp.id === editingId) {
                    return {
                        ...exp,
                        date: newAcconto.date,
                        description: `Acconto Cantiere: ${newAcconto.description || 'Nessuna descrizione'}`,
                        amount: amount,
                    };
                }
                return exp;
            });

            onUpdateProject({ ...project, expenses: updatedExpenses });
        } else {
            const transaction = {
                id: Math.random().toString(36).substr(2, 9),
                date: newAcconto.date,
                description: `Acconto Cantiere: ${newAcconto.description || 'Nessuna descrizione'}`,
                amount: amount, // Positive for Revenue
                category: 'Ricavi',
                status: 'Pagato' as const,
                projectId: project.id
            };
            const updatedExpenses = [...(project.expenses || []), transaction];
            onUpdateProject({ ...project, expenses: updatedExpenses });
        }

        setIsAccontoModalOpen(false);
        setEditingId(null);
        setNewAcconto({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    };


    const handleEditTransaction = (t: any) => {
        setEditingId(t.id);
        if (t.category === 'Ricavi' || t.amount > 0) {
            setNewAcconto({
                amount: Math.abs(t.amount).toString(),
                description: t.description.replace('Acconto Cantiere: ', ''),
                date: t.date
            });
            setIsAccontoModalOpen(true);
        }
    };

    const handleDeleteTransaction = (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questa registrazione?')) return;
        if (!onUpdateProject) return;

        const exp = project.expenses?.find(e => e.id === id);
        const amountAbs = exp ? Math.abs(exp.amount) : 0;
        const isExpense = exp && exp.amount < 0;

        const updatedExpenses = (project.expenses || []).filter(e => e.id !== id);

        onUpdateProject({
            ...project,
            expenses: updatedExpenses,
            totalExpenses: isExpense ? (project.totalExpenses || 0) - amountAbs : (project.totalExpenses || 0)
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const calculateTotalWithIVA = () => {
        if (!project.budget || !project.iva) return project.budget || 0;
        return project.budget + (project.budget * project.iva / 100);
    };

    const totalRevenue = (project.expenses || [])
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalWithIVA = calculateTotalWithIVA();
    const remainingBalance = totalWithIVA - totalRevenue;

    const consolidatedTransactions = (project.expenses || []).map(t => ({ ...t, isVirtual: false }));

    // Add Payroll
    payrollEntries.forEach(pe => {
        const emp = employees.find(e => e.id === pe.employeeId);
        consolidatedTransactions.push({
            id: `payroll_${pe.id}`,
            date: pe.date,
            description: `Paga: ${emp?.name || 'Dipendente'}`,
            amount: -(pe.amount || 0),
            category: 'Manodopera',
            status: 'Pagato' as any,
            projectId: project.id,
            isVirtual: true
        } as any);
    });

    const filteredTransactions = consolidatedTransactions
        .filter(t => t.amount > 0 || (t as any).category === 'Ricavi') // Only show Incomes/Revenue
        .filter(t => {
            if (dateFilter === 'all') return true;
            const txDate = new Date(t.date);
            const now = new Date();
            if (dateFilter === 'thisMonth') {
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            }
            if (dateFilter === 'lastMonth') {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
            }
            if (dateFilter === 'thisYear') {
                return txDate.getFullYear() === now.getFullYear();
            }
            return true;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const quickActions = [
        {
            id: 'cronoprogramma',
            label: 'Cronoprogramma',
            icon: GanttChart,
            color: 'orange',
            description: 'Pianifica le attività'
        },
        {
            id: 'accounting',
            label: 'Contabilità',
            icon: Receipt,
            color: 'blue',
            description: 'Visualizza spese e fatture'
        },
        {
            id: 'statistics',
            label: 'Statistiche',
            icon: TrendingUp,
            color: 'purple',
            description: 'Report e analisi'
        }
    ];

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
            {/* Header Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl print:hidden">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <Building size={32} className="text-emerald-400" />
                            <h1 className="text-3xl font-bold">{project.name}</h1>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(project.status)}`}>
                            {project.status}
                        </span>
                    </div>
                    <button
                        onClick={onOpenSettings}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="Impostazioni Cantiere"
                    >
                        <SettingsIcon size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                            <User size={16} />
                            <span>Cliente</span>
                        </div>
                        <p className="font-bold text-lg">{project.client}</p>
                    </div>

                    {project.location && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                                <MapPin size={16} />
                                <span>Ubicazione</span>
                            </div>
                            <p className="font-bold text-lg truncate">{project.location}</p>
                        </div>
                    )}

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                            <Calendar size={16} />
                            <span>Data Inizio</span>
                        </div>
                        <p className="font-bold text-lg">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString('it-IT') : 'N/D'}
                        </p>
                    </div>

                    {project.endDate && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                                <Clock size={16} />
                                <span>Fine Prevista</span>
                            </div>
                            <p className="font-bold text-lg">
                                {new Date(project.endDate).toLocaleDateString('it-IT')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative group hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Euro size={16} />
                            <span className="font-semibold">Totale Preventivo</span>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">
                        € {project.budget?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                    <div className="mt-1 text-xs text-slate-400">
                        + IVA {project.iva}%: € {((project.budget || 0) * (project.iva || 0) / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-emerald-600 text-sm mb-2">
                        <TrendingUp size={16} />
                        <span className="font-semibold">Totale Acconti</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">
                        € {totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-1 text-xs text-emerald-500">
                        Incassato finora
                    </div>
                </div>

                <div className={`rounded-xl border shadow-sm p-6 ${remainingBalance > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`flex items-center gap-2 text-sm mb-2 ${remainingBalance > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                        <Clock size={16} />
                        <span className="font-semibold">Residuo da Incassare</span>
                    </div>
                    <p className={`text-2xl font-bold ${remainingBalance > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                        € {Math.max(0, remainingBalance).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                    <div className={`mt-1 text-xs ${remainingBalance > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        su Totale IVA Inclusa
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
                        <Euro size={16} />
                        <span className="font-semibold">Totale IVA Inclusa</span>
                    </div>
                    <p className="text-2xl font-bold">
                        € {calculateTotalWithIVA().toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Nota del Mese & Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
                {/* Nota del Mese Preview Box */}
                <div className="bg-yellow-100 rounded-xl border border-yellow-200 shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="p-4 border-b border-yellow-200 bg-yellow-200/50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-700">
                            <StickyNote size={18} />
                            <h3 className="font-bold text-sm uppercase tracking-wider">Nota del Mese</h3>
                        </div>
                        {!isEditingNote && (
                            <button
                                onClick={() => { setTempNote(currentNote); setIsEditingNote(true); }}
                                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors bg-white/50 px-2 py-1 rounded"
                            >
                                <Edit2 size={12} />
                                {currentNote ? 'Modifica' : 'Aggiungi'}
                            </button>
                        )}
                        {isEditingNote && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsEditingNote(false)}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-600"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                >
                                    Salva
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="p-4 flex-1">
                        {isEditingNote ? (
                            <textarea
                                className="w-full h-24 p-2 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none bg-white"
                                value={tempNote}
                                onChange={(e) => setTempNote(e.target.value)}
                                placeholder="Scrivi qui la nota del mese..."
                                autoFocus
                            />
                        ) : (
                            <div
                                className={`text-sm leading-relaxed ${currentNote ? 'text-amber-900/80' : 'text-amber-600/50 italic'} h-24 overflow-y-auto pr-1 whitespace-pre-wrap font-medium`}
                                style={{ scrollbarWidth: 'thin' }}
                            >
                                {currentNote || 'Nessuna nota inserita per questo mese. Clicca su aggiungi per scrivere un promemoria.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Box */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Avanzamento Lavori</h3>
                        <span className="text-2xl font-bold text-emerald-600">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden" title={`${project.progress || 0}% completato`}>
                        <div
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500 shadow-inner"
                            style={{ width: `${project.progress || 0}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Transaction List Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col print:hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Registrazioni e Movimenti</h3>
                        <p className="text-sm text-slate-500">Storico completo di spese e incassi</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setDateFilter('all')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${dateFilter === 'all' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Tutto
                            </button>
                            <button
                                onClick={() => setDateFilter('thisMonth')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${dateFilter === 'thisMonth' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Mese Corrente
                            </button>
                            <button
                                onClick={() => setDateFilter('thisYear')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${dateFilter === 'thisYear' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Anno Corrente
                            </button>
                        </div>
                        <button
                            onClick={handlePrint}
                            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm transition-colors"
                        >
                            <Printer size={16} className="mr-1.5" />
                            Stampa Report
                        </button>
                        <button
                            onClick={() => { setEditingId(null); setIsAccontoModalOpen(true); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center shadow-sm transition-colors"
                        >
                            <Plus size={16} className="mr-1.5" />
                            Incasso
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Data</th>
                                <th className="px-6 py-3">Descrizione</th>
                                <th className="px-6 py-3">Categoria</th>
                                <th className="px-6 py-3 text-right">Importo</th>
                                <th className="px-6 py-3 text-center">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions
                                    .map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600 font-mono text-xs whitespace-nowrap">{t.date}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">
                                                {t.description}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                                    {t.category || 'Entrata'}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                {t.amount > 0 ? '+' : ''} € {Math.abs(t.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {!(t as any).isVirtual ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditTransaction(t)}
                                                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="Modifica"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteTransaction(t.id)}
                                                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="Elimina"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-bold">SOLO LETTURA</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        Nessun incasso registrato per questo cantiere.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="print:hidden">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Azioni Rapide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <button
                            key={action.id}
                            onClick={() => onNavigate(action.id)}
                            className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group text-left`}
                        >
                            <div className={`inline-flex p-3 rounded-lg bg-${action.color}-50 text-${action.color}-600 mb-4`}>
                                <action.icon size={24} />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                                {action.label}
                                <ArrowRight size={18} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                            </h4>
                            <p className="text-sm text-slate-500">{action.description}</p>
                        </button>
                    ))}
                </div>
            </div>
            {/* Acconto Modal */}
            {isAccontoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-emerald-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                <DollarSign className="mr-2 text-emerald-600" size={20} />
                                {editingId ? 'Modifica Acconto' : 'Registra Acconto'}
                            </h3>
                            <button
                                onClick={() => setIsAccontoModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <Edit2 size={20} className="rotate-45" /> {/* Close icon substitution */}
                            </button>
                        </div>

                        <form onSubmit={handleAddAcconto} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Data</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={newAcconto.date}
                                    onChange={(e) => setNewAcconto({ ...newAcconto, date: e.target.value })}
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
                                        className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={newAcconto.amount}
                                        onChange={(e) => setNewAcconto({ ...newAcconto, amount: e.target.value })}
                                        autoFocus
                                    />
                                    <Euro className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Descrizione (Opzionale)</label>
                                <input
                                    type="text"
                                    placeholder="Es: Acconto inizio lavori"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={newAcconto.description}
                                    onChange={(e) => setNewAcconto({ ...newAcconto, description: e.target.value })}
                                />
                            </div>

                            <div className="bg-emerald-50 p-4 rounded-xl flex items-start space-x-3 border border-emerald-100 mt-2">
                                <TrendingUp className="text-emerald-600 mt-0.5" size={18} />
                                <p className="text-xs text-emerald-800 leading-relaxed">
                                    Questo acconto verrà registrato come <strong>Ricavo</strong> nella contabilità del cantiere e aggiornerà il bilancio generale.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAccontoModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                >
                                    {editingId ? 'Salva Modifiche' : 'Registra Incasso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Printable Report Section */}
            <div className="hidden print:block bg-white p-8">
                <style>{`
                    @media print {
                        @page { size: A4 portrait; margin: 15mm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
                    }
                `}</style>

                {/* Report Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase">Report Movimenti Cantiere</h1>
                        <p className="text-slate-500 mt-1">Edilsmart - Gestione Professionale</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800">{project.name}</h2>
                        <p className="font-bold text-slate-600">Prospetto al: {new Date().toLocaleDateString('it-IT')}</p>
                        {dateFilter !== 'all' && (
                            <p className="text-xs text-slate-500 mt-1 uppercase">
                                Filtro Periodo: {dateFilter === 'thisMonth' ? 'Mese Corrente' : dateFilter === 'thisYear' ? 'Anno Corrente' : dateFilter}
                            </p>
                        )}
                    </div>
                </div>

                {/* Totals Summary */}
                <div className="grid grid-cols-3 gap-6 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Totale Preventivo (IVA inc.)</p>
                        <p className="text-lg font-black text-slate-900">€ {calculateTotalWithIVA().toLocaleString('it-IT')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Totale Incassato</p>
                        <p className="text-lg font-black text-emerald-600">€ {totalRevenue.toLocaleString('it-IT')}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Residuo da Incassare</p>
                        <p className="text-lg font-black text-amber-600">€ {Math.max(0, remainingBalance).toLocaleString('it-IT')}</p>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-y border-slate-300">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-700">Data</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-700">Descrizione</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-700">Categoria</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-700 text-right">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((t) => (
                            <tr key={t.id} className="border-b border-slate-200">
                                <td className="px-4 py-3 text-xs text-slate-600 font-mono">{t.date}</td>
                                <td className="px-4 py-3 text-xs text-slate-800 font-medium">{t.description}</td>
                                <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{t.category || 'Ricavo'}</td>
                                <td className={`px-4 py-3 text-xs font-bold text-right ${t.amount > 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                                    {t.amount > 0 ? '+' : '-'} € {Math.abs(t.amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
                    <span>Generato da Edilsmart - Gestione Professionale Cantieri</span>
                    <span>Pagina 1 di 1</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;
