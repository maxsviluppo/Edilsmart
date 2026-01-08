import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Calendar, Plus, Trash2, Edit2, Save, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Task {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'planned' | 'in-progress' | 'completed' | 'delayed';
    progress: number;
    color: string;
}

interface CronoprogrammaProps {
    project?: Project;
}

const Cronoprogramma: React.FC<CronoprogrammaProps> = ({ project }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
    const [newTask, setNewTask] = useState<Partial<Task>>({
        name: '',
        startDate: '',
        endDate: '',
        status: 'planned',
        progress: 0,
        color: '#3b82f6'
    });

    const statusColors = {
        planned: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
        'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
        completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
        delayed: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' }
    };

    const statusLabels = {
        planned: 'Pianificato',
        'in-progress': 'In Corso',
        completed: 'Completato',
        delayed: 'In Ritardo'
    };

    const colorOptions = [
        { value: '#3b82f6', label: 'Blu' },
        { value: '#10b981', label: 'Verde' },
        { value: '#f59e0b', label: 'Arancione' },
        { value: '#ef4444', label: 'Rosso' },
        { value: '#8b5cf6', label: 'Viola' },
        { value: '#ec4899', label: 'Rosa' }
    ];

    // Load tasks from localStorage
    useEffect(() => {
        if (project?.id) {
            const saved = localStorage.getItem(`cronoprogramma_${project.id}`);
            if (saved) {
                try {
                    setTasks(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to load cronoprogramma', e);
                }
            }
        }
    }, [project?.id]);

    // Save tasks to localStorage
    useEffect(() => {
        if (project?.id && tasks.length > 0) {
            localStorage.setItem(`cronoprogramma_${project.id}`, JSON.stringify(tasks));
        }
    }, [tasks, project?.id]);

    const addTask = () => {
        if (!newTask.name || !newTask.startDate || !newTask.endDate) {
            alert('Compila tutti i campi obbligatori');
            return;
        }

        const task: Task = {
            id: Math.random().toString(36).substr(2, 9),
            name: newTask.name!,
            startDate: newTask.startDate!,
            endDate: newTask.endDate!,
            status: newTask.status as Task['status'] || 'planned',
            progress: newTask.progress || 0,
            color: newTask.color || '#3b82f6'
        };

        setTasks([...tasks, task]);
        setNewTask({ name: '', startDate: '', endDate: '', status: 'planned', progress: 0, color: '#3b82f6' });
        setIsAddingTask(false);
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
        setDeletingTaskId(null);
    };


    const calculateTaskPosition = (task: Task, minDate: Date, maxDate: Date) => {
        const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const startOffset = Math.max(0, Math.ceil((taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const leftPercent = (startOffset / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;

        // Ensure the bar doesn't overflow
        const maxWidth = 100 - leftPercent;
        const finalWidth = Math.min(widthPercent, maxWidth);

        return {
            left: `${leftPercent}%`,
            width: `${finalWidth}%`
        };
    };

    const getDateRange = () => {
        if (tasks.length === 0) {
            const today = new Date();
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return { minDate: today, maxDate: nextMonth };
        }

        const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
        return {
            minDate: new Date(Math.min(...dates.map(d => d.getTime()))),
            maxDate: new Date(Math.max(...dates.map(d => d.getTime())))
        };
    };

    const generateMonthHeaders = (minDate: Date, maxDate: Date) => {
        const months: { label: string; width: number }[] = [];
        const current = new Date(minDate);
        current.setDate(1);

        while (current <= maxDate) {
            const monthStart = new Date(current);
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            const effectiveEnd = monthEnd > maxDate ? maxDate : monthEnd;

            const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
            const monthDays = Math.ceil((effectiveEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            months.push({
                label: monthStart.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
                width: (monthDays / totalDays) * 100
            });

            current.setMonth(current.getMonth() + 1);
        }

        return months;
    };

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <Calendar className="text-slate-400 mb-4" size={48} />
                <div className="text-slate-400 mb-2">Nessun Progetto Selezionato</div>
                <p className="text-slate-600">Seleziona un cantiere per gestire il cronoprogramma.</p>
            </div>
        );
    }

    const { minDate, maxDate } = getDateRange();
    const monthHeaders = generateMonthHeaders(minDate, maxDate);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <Calendar className="text-emerald-600" size={32} />
                            Cronoprogramma Lavori
                        </h2>
                        <p className="text-slate-500 mt-1">{project.name}</p>
                    </div>
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow transition-all"
                    >
                        <Plus size={20} />
                        Nuova Attività
                    </button>
                </div>
            </div>

            {/* Add/Edit Task Form */}
            {isAddingTask && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Nuova Attività</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nome Attività *</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                                placeholder="Es. Demolizioni, Murature..."
                                value={newTask.name}
                                onChange={e => setNewTask({ ...newTask, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Data Inizio *</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newTask.startDate}
                                onChange={e => setNewTask({ ...newTask, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Data Fine *</label>
                            <input
                                type="date"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newTask.endDate}
                                onChange={e => setNewTask({ ...newTask, endDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Stato</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newTask.status}
                                onChange={e => setNewTask({ ...newTask, status: e.target.value as Task['status'] })}
                            >
                                {Object.entries(statusLabels).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Colore</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newTask.color}
                                onChange={e => setNewTask({ ...newTask, color: e.target.value })}
                            >
                                {colorOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Avanzamento (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newTask.progress}
                                onChange={e => setNewTask({ ...newTask, progress: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={addTask}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
                        >
                            <Save size={18} />
                            Salva
                        </button>
                        <button
                            onClick={() => {
                                setIsAddingTask(false);
                                setNewTask({ name: '', startDate: '', endDate: '', status: 'planned', progress: 0, color: '#3b82f6' });
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
                        >
                            <X size={18} />
                            Annulla
                        </button>
                    </div>
                </div>
            )}

            {/* Gantt Chart */}
            {tasks.length > 0 ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <div className="min-w-[800px]">
                        {/* Month Headers */}
                        <div className="flex border-b-2 border-slate-300 mb-4">
                            {monthHeaders.map((month, idx) => (
                                <div
                                    key={idx}
                                    className="text-center font-bold text-slate-700 py-2 border-r border-slate-200 last:border-r-0"
                                    style={{ width: `${month.width}%` }}
                                >
                                    {month.label}
                                </div>
                            ))}
                        </div>

                        {/* Tasks */}
                        <div className="space-y-3">
                            {tasks.map(task => {
                                const position = calculateTaskPosition(task, minDate, maxDate);
                                const colors = statusColors[task.status];
                                const isEditing = editingTaskId === task.id;

                                return (
                                    <div key={task.id} className="relative">
                                        {isEditing ? (
                                            // Edit Mode
                                            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                                                    <div className="lg:col-span-2">
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Attività</label>
                                                        <input
                                                            type="text"
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none capitalize text-sm"
                                                            value={task.name}
                                                            onChange={e => updateTask(task.id, { name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Data Inizio</label>
                                                        <input
                                                            type="date"
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                            value={task.startDate}
                                                            onChange={e => updateTask(task.id, { startDate: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Data Fine</label>
                                                        <input
                                                            type="date"
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                            value={task.endDate}
                                                            onChange={e => updateTask(task.id, { endDate: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Stato</label>
                                                        <select
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                            value={task.status}
                                                            onChange={e => updateTask(task.id, { status: e.target.value as Task['status'] })}
                                                        >
                                                            {Object.entries(statusLabels).map(([value, label]) => (
                                                                <option key={value} value={value}>{label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Colore</label>
                                                        <select
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                            value={task.color}
                                                            onChange={e => updateTask(task.id, { color: e.target.value })}
                                                        >
                                                            {colorOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Avanzamento (%)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                            value={task.progress}
                                                            onChange={e => updateTask(task.id, { progress: parseInt(e.target.value) || 0 })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingTaskId(null)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                                    >
                                                        <Save size={16} />
                                                        Salva
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingTaskId(null)}
                                                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-sm transition-colors"
                                                    >
                                                        Chiudi
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // View Mode
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-semibold text-slate-800 text-sm">{task.name}</div>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                                                            {statusLabels[task.status]}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{task.progress}%</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => setEditingTaskId(task.id)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Modifica"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => updateTask(task.id, {
                                                                status: task.status === 'completed' ? 'in-progress' : 'completed',
                                                                progress: task.status === 'completed' ? task.progress : 100
                                                            })}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                            title="Segna come completato"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingTaskId(task.id)}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                            title="Elimina"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="relative h-12 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                                    <div
                                                        className="absolute top-1 h-10 rounded-md shadow-sm flex items-center justify-between px-3 text-white text-xs font-bold transition-all"
                                                        style={{
                                                            left: position.left,
                                                            width: position.width,
                                                            backgroundColor: task.color
                                                        }}
                                                    >
                                                        <span className="truncate">{new Date(task.startDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                                                        <span className="truncate">{new Date(task.endDate).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                                                    </div>
                                                    {/* Progress bar inside */}
                                                    <div
                                                        className="absolute top-1 h-10 rounded-md bg-black/20"
                                                        style={{
                                                            left: position.left,
                                                            width: `calc(${position.width} * ${task.progress / 100})`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
                    <Clock className="mx-auto text-slate-300 mb-4" size={64} />
                    <p className="text-slate-500 mb-4">Nessuna attività pianificata</p>
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold inline-flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Aggiungi Prima Attività
                    </button>
                </div>
            )}

            {/* Legend */}
            {tasks.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Legenda Stati</h4>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries(statusLabels).map(([status, label]) => {
                            const colors = statusColors[status as Task['status']];
                            return (
                                <div key={status} className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border}`} />
                                    <span className="text-sm text-slate-600">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingTaskId && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-rose-600 px-6 py-4 flex items-center gap-3 text-white">
                            <AlertCircle size={28} />
                            <h3 className="text-xl font-bold">Conferma Eliminazione</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700 mb-2">
                                Stai per eliminare l'attività:
                            </p>
                            <p className="text-lg font-bold text-slate-900 mb-4">
                                "{tasks.find(t => t.id === deletingTaskId)?.name}"
                            </p>
                            <p className="text-sm text-slate-600 mb-6">
                                Questa azione non può essere annullata.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => deleteTask(deletingTaskId)}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Sì, Elimina
                                </button>
                                <button
                                    onClick={() => setDeletingTaskId(null)}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cronoprogramma;
