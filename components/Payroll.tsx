import React, { useState, useEffect, useMemo } from 'react';
import { Project, Employee, PayrollEntry } from '../types';
import {
    Users,
    Calendar,
    Plus,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Save,
    X,
    Trash2,
    Euro,
    Download,
    PieChart as PieIcon,
    StickyNote,
    Edit,
    FileText
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import Toast, { ToastType } from './Toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface PayrollProps {
    projects: Project[];
}

const Payroll: React.FC<PayrollProps> = ({ projects }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [entries, setEntries] = useState<PayrollEntry[]>([]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCell, setSelectedCell] = useState<{ empId: string, day: number } | null>(null);
    const [isEditingEmployee, setIsEditingEmployee] = useState<Employee | null>(null);
    const [isAddingEmployee, setIsAddingEmployee] = useState(false);
    const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ name: '', role: 'Operaio', hourlyRate: 0 });

    // Modal State for Entry
    const [entryValue, setEntryValue] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [entryNote, setEntryNote] = useState<string>('');

    // Notes State
    const [monthlyNotes, setMonthlyNotes] = useState<Record<string, string>>({});
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [tempNote, setTempNote] = useState('');

    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string | null, type: 'employee' | null }>({ id: null, type: null });

    // Load Data
    useEffect(() => {
        const savedEmployees = localStorage.getItem('edilsmart_employees');
        if (savedEmployees) {
            try { setEmployees(JSON.parse(savedEmployees)); } catch (e) { }
        } else {
            // Initial Dummy Data based on image
            setEmployees([
                { id: '1', name: 'Enzo', role: 'Operaio', hourlyRate: 15 },
                { id: '2', name: 'Lello', role: 'Operaio', hourlyRate: 14 },
                { id: '3', name: "Papa'", role: 'Operaio', hourlyRate: 16 },
                { id: '4', name: 'Stefano', role: 'Autista', hourlyRate: 15 },
            ]);
        }

        const savedEntries = localStorage.getItem('edilsmart_payroll_entries');
        if (savedEntries) {
            try { setEntries(JSON.parse(savedEntries)); } catch (e) { }
        }

        const savedNotes = localStorage.getItem('edilsmart_payroll_notes');
        if (savedNotes) {
            try { setMonthlyNotes(JSON.parse(savedNotes)); } catch (e) { }
        }
    }, []);

    // Save Data
    const saveEmployees = (updated: Employee[]) => {
        setEmployees(updated);
        localStorage.setItem('edilsmart_employees', JSON.stringify(updated));
    };

    const saveEntries = (updated: PayrollEntry[]) => {
        setEntries(updated);
        localStorage.setItem('edilsmart_payroll_entries', JSON.stringify(updated));
    };

    // Month Helpers
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = currentDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

    const getEntry = (empId: string, day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return entries.find(e => e.employeeId === empId && e.date === dateStr);
    };

    const handleCellClick = (empId: string, day: number) => {
        const entry = getEntry(empId, day);
        setSelectedCell({ empId, day });
        // Format with thousand separator for the input
        const value = entry?.amount ? entry.amount.toLocaleString('it-IT') : '';
        setEntryValue(value);
        setSelectedProject(entry?.projectId || '');
        setEntryNote(entry?.notes || '');
    };

    const handleSaveEntry = (empId: string, day: number, value: string) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // Parse the Italian format (replace . with nothing and , with .)
        const cleanValue = value.replace(/\./g, '').replace(/,/g, '.');
        const amount = parseFloat(cleanValue);

        let updatedEntries = [...entries];
        updatedEntries = updatedEntries.filter(e => !(e.employeeId === empId && e.date === dateStr));

        if (!isNaN(amount) && amount > 0) {
            updatedEntries.push({
                id: Math.random().toString(36).substr(2, 9),
                employeeId: empId,
                date: dateStr,
                amount,
                projectId: selectedProject || undefined,
                notes: entryNote
            });
        }

        saveEntries(updatedEntries);
        setSelectedCell(null);
    };

    const handleBlur = () => {
        if (selectedCell) {
            handleSaveEntry(selectedCell.empId, selectedCell.day, entryValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setSelectedCell(null);
        }
    };

    const formatInputValue = (val: string) => {
        // Simple formatter for thousand separator as user types
        const clean = val.replace(/\D/g, '');
        if (!clean) return '';
        return parseInt(clean).toLocaleString('it-IT');
    };

    const handleAddEmployee = (e: React.FormEvent) => {
        e.preventDefault();
        if (newEmployee.name) {
            const emp: Employee = {
                id: Math.random().toString(36).substr(2, 9),
                name: newEmployee.name!,
                role: newEmployee.role || 'Operaio',
                hourlyRate: newEmployee.hourlyRate || 0
            };
            saveEmployees([...employees, emp]);
            setIsAddingEmployee(false);
            setNewEmployee({ name: '', role: 'Operaio', hourlyRate: 0 });
            setToast({ message: 'Dipendente aggiunto', type: 'success' });
        }
    };

    const deleteEmployee = (id: string) => {
        const updated = employees.filter(e => e.id !== id);
        saveEmployees(updated);
        setConfirmDelete({ id: null, type: null });
        setToast({ message: 'Dipendente eliminato', type: 'success' });
    };

    // Calculations
    const employeeTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        employees.forEach(emp => {
            let sum = 0;
            entries.forEach(entry => {
                const entryDate = new Date(entry.date);
                if (entry.employeeId === emp.id && entryDate.getMonth() === month && entryDate.getFullYear() === year) {
                    sum += entry.amount || 0;
                }
            });
            totals[emp.id] = sum;
        });
        return totals;
    }, [entries, employees, month, year]);

    const dailyTotals = useMemo(() => {
        const totals: Record<number, number> = {};
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const sum = entries
                .filter(e => e.date === dateStr)
                .reduce((acc, curr) => acc + (curr.amount || 0), 0);
            totals[d] = sum;
        }
        return totals;
    }, [entries, month, year, daysInMonth]);

    const grandTotal = Object.values(employeeTotals).reduce((a, b) => a + b, 0);

    // Notes Handler
    const currentNoteKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const currentNote = monthlyNotes[currentNoteKey] || '';

    const handleSaveNote = () => {
        const updated = { ...monthlyNotes, [currentNoteKey]: tempNote };
        setMonthlyNotes(updated);
        localStorage.setItem('edilsmart_payroll_notes', JSON.stringify(updated));
        setIsEditingNote(false);
        setToast({ message: 'Nota salvata', type: 'success' });
    };

    const handleDeleteNote = () => {
        if (confirm('Eliminare la nota di questo mese?')) {
            const updated = { ...monthlyNotes };
            delete updated[currentNoteKey];
            setMonthlyNotes(updated);
            localStorage.setItem('edilsmart_payroll_notes', JSON.stringify(updated));
            setToast({ message: 'Nota eliminata', type: 'success' });
        }
    };

    // Chart Data
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ef4444', '#a855f7'];

    const chartData = useMemo(() => {
        return employees.map((emp, index) => ({
            name: emp.name,
            value: employeeTotals[emp.id] || 0,
            color: COLORS[index % COLORS.length]
        })).filter(d => d.value > 0);
    }, [employees, employeeTotals]);

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <ChevronLeft size={24} className="text-slate-600" />
                    </button>
                    <h2 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-2">
                        <Calendar className="text-blue-600" />
                        {monthName}
                    </h2>
                    <button
                        onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                    >
                        <ChevronRight size={24} className="text-slate-600" />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddingEmployee(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm"
                    >
                        <Plus size={20} />
                        Nuovo Dipendente
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <div className="min-w-max">
                    {/* Table Header */}
                    <div className="grid" style={{ gridTemplateColumns: `150px repeat(${daysInMonth}, 40px) 100px` }}>
                        <div className="p-3 bg-slate-100 border-b border-r border-slate-200 font-bold text-slate-700 sticky left-0 z-10 text-sm">
                            Operai
                        </div>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                            <div key={day} className="p-2 bg-slate-50 border-b border-r border-slate-200 text-center text-xs font-semibold text-slate-600">
                                {day}
                            </div>
                        ))}
                        <div className="p-3 bg-slate-100 border-b border-l border-slate-200 font-bold text-slate-700 text-center sticky right-0 z-10 text-sm">
                            Totale
                        </div>
                    </div>

                    {/* Rows */}
                    {employees.map(emp => (
                        <div key={emp.id} className="grid hover:bg-slate-50 transition-colors" style={{ gridTemplateColumns: `150px repeat(${daysInMonth}, 40px) 100px` }}>
                            <div className="p-3 border-b border-r border-slate-200 font-medium text-slate-800 sticky left-0 bg-white group flex justify-between items-center text-sm">
                                <span className="truncate">{emp.name}</span>
                                <button
                                    onClick={() => setConfirmDelete({ id: emp.id, type: 'employee' })}
                                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const entry = getEntry(emp.id, day);
                                return (
                                    <div
                                        key={day}
                                        onClick={() => handleCellClick(emp.id, day)}
                                        className={`
                                    border-b border-r border-slate-100 text-center text-xs flex items-center justify-center cursor-pointer select-none h-10
                                    ${entry ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-slate-50'}
                                    ${selectedCell?.empId === emp.id && selectedCell?.day === day ? 'ring-2 ring-blue-500 z-20 bg-white' : ''}
                                `}
                                    >
                                        {selectedCell?.empId === emp.id && selectedCell?.day === day ? (
                                            <input
                                                autoFocus
                                                className="w-full h-full text-center outline-none bg-white font-bold text-blue-600"
                                                value={entryValue}
                                                onChange={(e) => setEntryValue(formatInputValue(e.target.value))}
                                                onBlur={handleBlur}
                                                onKeyDown={handleKeyDown}
                                            />
                                        ) : (
                                            entry?.amount ? `€${entry.amount.toLocaleString('it-IT')}` : ''
                                        )}
                                    </div>
                                );
                            })}
                            <div className="p-3 border-b border-l border-slate-200 font-bold text-slate-800 text-right sticky right-0 bg-slate-50 text-sm">
                                € {employeeTotals[emp.id].toLocaleString('it-IT')}
                            </div>
                        </div>
                    ))}

                    {/* Daily Totals Row */}
                    <div className="grid bg-blue-50" style={{ gridTemplateColumns: `150px repeat(${daysInMonth}, 40px) 100px` }}>
                        <div className="p-3 border-r border-blue-100 font-bold text-blue-900 sticky left-0 bg-blue-50 text-sm">
                            Totale Giornaliero
                        </div>
                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                            <div key={day} className="p-2 border-r border-blue-100 text-center text-[10px] font-bold text-blue-800 flex items-center justify-center">
                                {dailyTotals[day] > 0 ? `€${dailyTotals[day]}` : '-'}
                            </div>
                        ))}
                        <div className="p-3 border-l border-blue-200 font-bold text-blue-900 text-right sticky right-0 bg-blue-100 text-sm">
                            € {grandTotal.toLocaleString('it-IT')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Report & Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                {/* Chart Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PieIcon className="text-purple-600" size={20} />
                        Ripartizione Spese
                    </h3>
                    {grandTotal > 0 ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => `€ ${value.toLocaleString('it-IT')}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 opacity-50">
                            <PieIcon size={48} className="mb-2" />
                            <p>Nessun dato presente per il grafico</p>
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <StickyNote className="text-amber-500" size={20} />
                            Note del Mese
                        </h3>
                        {!isEditingNote && currentNote && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setTempNote(currentNote); setIsEditingNote(true); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Modifica Note"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={handleDeleteNote}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Elimina Note"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-amber-50 rounded-xl p-4 border border-amber-100 relative min-h-[200px]">
                        {isEditingNote ? (
                            <div className="h-full flex flex-col gap-3">
                                <textarea
                                    className="w-full h-full min-h-[150px] p-3 bg-white rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none resize-none text-slate-700"
                                    placeholder="Scrivi qui eventuali note, scadenze o promemoria per questo mese..."
                                    value={tempNote}
                                    onChange={(e) => setTempNote(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setIsEditingNote(false)}
                                        className="px-3 py-1.5 text-slate-600 hover:bg-amber-100 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        Annulla
                                    </button>
                                    <button
                                        onClick={handleSaveNote}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm transition-colors shadow-sm"
                                    >
                                        Salva Nota
                                    </button>
                                </div>
                            </div>
                        ) : (
                            currentNote ? (
                                <div className="prose prose-sm text-slate-700 whitespace-pre-wrap">
                                    {currentNote}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-amber-300">
                                    <FileText size={48} className="mb-2 opacity-50" />
                                    <p className="text-sm font-medium opacity-70">Nessuna nota inserita</p>
                                    <button
                                        onClick={() => { setTempNote(''); setIsEditingNote(true); }}
                                        className="mt-4 px-4 py-2 bg-white text-amber-600 border border-amber-200 rounded-lg font-bold text-sm hover:bg-amber-100 transition-colors shadow-sm"
                                    >
                                        Aggiungi Nota
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>


            {/* Add Employee Modal */}
            {isAddingEmployee && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Nuovo Dipendente</h3>
                            <button onClick={() => setIsAddingEmployee(false)}><X size={20} className="text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newEmployee.name}
                                    onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Ruolo</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newEmployee.role}
                                    onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 mt-4"
                            >
                                Aggiungi Dipendente
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmDelete.id}
                title="Elimina Dipendente"
                message="Sei sicuro di voler rimuovere questo dipendente dalla lista?"
                onConfirm={() => confirmDelete.id && deleteEmployee(confirmDelete.id)}
                onCancel={() => setConfirmDelete({ id: null, type: null })}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Payroll;
