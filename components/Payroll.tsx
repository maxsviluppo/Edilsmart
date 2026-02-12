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
    FileText,
    Printer,
    Filter
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import Toast, { ToastType } from './Toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface PayrollProps {
    projects: Project[];
    selectedProjectId?: string;
}

const Payroll: React.FC<PayrollProps> = ({ projects, selectedProjectId }) => {
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

    // Filter States
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState('');

    // Load Data
    useEffect(() => {
        const savedEmployees = localStorage.getItem('edilsmart_employees');
        if (savedEmployees) {
            try { setEmployees(JSON.parse(savedEmployees)); } catch (e) { }
        }

        const savedEntries = localStorage.getItem('edilsmart_payroll_entries');
        if (savedEntries) {
            try { setEntries(JSON.parse(savedEntries)); } catch (e) { }
        }

        const savedNotes = localStorage.getItem('edilsmart_payroll_notes');
        if (savedNotes) {
            try { setMonthlyNotes(JSON.parse(savedNotes)); } catch (e) { }
        }

        const savedEmpNotes = localStorage.getItem('edilsmart_employee_notes');
        if (savedEmpNotes) {
            try { setEmployeeNotes(JSON.parse(savedEmpNotes)); } catch (e) { }
        }
    }, []);

    // Sync filter with sidebar selection
    useEffect(() => {
        if (selectedProjectId) {
            setSelectedProjectFilter(selectedProjectId);
        }
    }, [selectedProjectId]);

    // Employee Notes State
    const [employeeNotes, setEmployeeNotes] = useState<Record<string, string>>({}); // Key: empId
    const [isEmpNoteModalOpen, setIsEmpNoteModalOpen] = useState<{ empId: string, name: string } | null>(null);
    const [tempEmpNote, setTempEmpNote] = useState('');

    const handleOpenEmpNote = (emp: Employee) => {
        setIsEmpNoteModalOpen({ empId: emp.id, name: emp.name });
        setTempEmpNote(employeeNotes[emp.id] || '');
    };

    const handleSaveEmpNote = () => {
        if (!isEmpNoteModalOpen) return;
        const updated = { ...employeeNotes, [isEmpNoteModalOpen.empId]: tempEmpNote };
        // Remove empty notes
        if (!tempEmpNote) delete updated[isEmpNoteModalOpen.empId];

        setEmployeeNotes(updated);
        localStorage.setItem('edilsmart_employee_notes', JSON.stringify(updated));
        setIsEmpNoteModalOpen(null);
        setToast({ message: 'Nota dipendente salvata', type: 'success' });
        window.dispatchEvent(new CustomEvent('payroll-updated')); // Notify accounting
    };

    // Save Data
    const saveEmployees = (updated: Employee[]) => {
        setEmployees(updated);
        localStorage.setItem('edilsmart_employees', JSON.stringify(updated));
    };

    const saveEntries = (updated: PayrollEntry[]) => {
        setEntries(updated);
        localStorage.setItem('edilsmart_payroll_entries', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('payroll-updated'));
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
        // Use entry projectId if it exists, otherwise fallback to the current sidebar project
        setSelectedProject(entry?.projectId || selectedProjectId || '');
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

    // Filtered Entries for Report
    const filteredEntriesForReport = useMemo(() => {
        return entries.filter(e => {
            // Project matching
            const matchesProject = !selectedProjectFilter || e.projectId === selectedProjectFilter;

            // Date matching using string comparison (YYYY-MM-DD)
            let matchesDate = true;
            if (startDateFilter || endDateFilter) {
                const matchesStartDate = !startDateFilter || e.date >= startDateFilter;
                const matchesEndDate = !endDateFilter || e.date <= endDateFilter;
                matchesDate = matchesStartDate && matchesEndDate;
            } else {
                // If no date filters are set, show only the currently viewed month
                const entryDate = new Date(e.date);
                matchesDate = entryDate.getMonth() === month && entryDate.getFullYear() === year;
            }

            return matchesProject && matchesDate;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [entries, selectedProjectFilter, startDateFilter, endDateFilter, month, year]);

    const totalFilteredAmount = filteredEntriesForReport.reduce((sum, e) => sum + (e.amount || 0), 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={24} className="text-slate-600" />
                        </button>
                        <h2 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-2">
                            <Calendar className="text-blue-600" />
                            {monthName}
                        </h2>
                        <button
                            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ChevronRight size={24} className="text-slate-600" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAddingEmployee(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            Nuovo Dipendente
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <Filter size={16} className="text-slate-400 ml-1" />
                        <select
                            value={selectedProjectFilter}
                            onChange={(e) => setSelectedProjectFilter(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-xs font-semibold text-slate-700 outline-none cursor-pointer min-w-[150px]"
                        >
                            <option value="">Tutti i Cantieri</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDateFilter}
                            onChange={(e) => setStartDateFilter(e.target.value)}
                            className="text-xs bg-transparent border-none focus:ring-0 outline-none p-0 w-24 font-medium"
                        />
                        <span className="text-slate-300">-</span>
                        <input
                            type="date"
                            value={endDateFilter}
                            onChange={(e) => setEndDateFilter(e.target.value)}
                            className="text-xs bg-transparent border-none focus:ring-0 outline-none p-0 w-24 font-medium"
                        />
                    </div>

                    <button
                        onClick={handlePrint}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center transition-all font-bold text-sm shadow-md ml-auto"
                    >
                        <Printer size={18} className="mr-2" />
                        Stampa Report Paghe
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto print:hidden">
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
                            <div className="p-3 border-b border-r border-slate-200 font-medium text-slate-800 sticky left-0 bg-white group flex justify-between items-center text-sm z-10 w-[150px]">
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                    <button
                                        onClick={() => handleOpenEmpNote(emp)}
                                        className={`transition-colors flex-shrink-0 ${employeeNotes[emp.id] ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                                        title={employeeNotes[emp.id] ? "Modifica nota" : "Aggiungi nota"}
                                    >
                                        <StickyNote size={14} fill={employeeNotes[emp.id] ? "currentColor" : "none"} />
                                    </button>
                                    <span className="truncate" title={emp.name}>{emp.name}</span>
                                </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20 print:hidden">
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

            {/* Employee Note Modal */}
            {isEmpNoteModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b bg-amber-50 flex justify-between items-center">
                            <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                <StickyNote size={20} className="text-amber-600" />
                                Nota per {isEmpNoteModalOpen.name}
                            </h3>
                            <button onClick={() => setIsEmpNoteModalOpen(null)}><X size={20} className="text-amber-400 hover:text-amber-600" /></button>
                        </div>
                        <div className="p-4">
                            <textarea
                                className="w-full h-32 p-3 bg-amber-50/50 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none resize-none text-slate-700 placeholder-amber-300"
                                placeholder="Scrivi una nota per questo dipendente..."
                                value={tempEmpNote}
                                onChange={(e) => setTempEmpNote(e.target.value)}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    onClick={() => setIsEmpNoteModalOpen(null)}
                                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSaveEmpNote}
                                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold transition-colors shadow-sm"
                                >
                                    Salva Nota
                                </button>
                            </div>
                        </div>
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

            {/* Printable Report Section */}
            <div className="hidden print:block bg-white p-8">
                <style>{`
                    @media print {
                        @page { size: A4 portrait; margin: 15mm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                `}</style>

                {/* Report Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase">Report Paghe e Stipendi</h1>
                        <p className="text-slate-500 mt-1">Edilsmart - Gestione Personale</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-800">Data Report: {new Date().toLocaleDateString('it-IT')}</p>
                        <p className="text-sm text-slate-600">
                            {selectedProjectFilter
                                ? `Cantiere: ${projects.find(p => p.id === selectedProjectFilter)?.name}`
                                : 'Tutti i Cantieri'}
                        </p>
                        {(startDateFilter || endDateFilter) && (
                            <p className="text-xs text-slate-500 mt-1">
                                Periodo: {startDateFilter ? new Date(startDateFilter).toLocaleDateString('it-IT') : 'Inizio'} - {endDateFilter ? new Date(endDateFilter).toLocaleDateString('it-IT') : 'Fine'}
                            </p>
                        )}
                        {!startDateFilter && !endDateFilter && (
                            <p className="text-xs text-slate-500 mt-1">Mensilità: {monthName}</p>
                        )}
                    </div>
                </div>

                {/* Report Table */}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-y border-slate-300">
                            <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">Data</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">Dipendente</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">Cantiere</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700">Note</th>
                            <th className="px-4 py-3 text-xs font-bold uppercase text-slate-700 text-right">Importo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntriesForReport.length > 0 ? (
                            filteredEntriesForReport.map((e) => (
                                <tr key={e.id} className="border-b border-slate-200">
                                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{new Date(e.date).toLocaleDateString('it-IT')}</td>
                                    <td className="px-4 py-3 text-sm text-slate-900 font-bold">{employees.find(emp => emp.id === e.employeeId)?.name || 'Sconosciuto'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{projects.find(p => p.id === e.projectId)?.name || 'Generale'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500 italic">{e.notes || '-'}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-right text-slate-900">
                                        € {(e.amount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                                    Nessuna voce trovata per i filtri selezionati
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50 font-black">
                            <td colSpan={4} className="px-4 py-4 text-right uppercase tracking-widest text-slate-700">Totale Spettanze</td>
                            <td className="px-4 py-4 text-right text-lg border-t-2 border-slate-900">
                                € {totalFilteredAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* Monthly Notes in Report (if spanning single month) */}
                {!startDateFilter && !endDateFilter && currentNote && (
                    <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <h4 className="text-xs font-bold uppercase text-amber-800 mb-2">Note del Mese:</h4>
                        <p className="text-sm text-amber-900 whitespace-pre-wrap">{currentNote}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
                    <span>Edilsmart HR System - Report Generato il {new Date().toLocaleString('it-IT')}</span>
                    <span>Documento ad uso interno</span>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Payroll;
