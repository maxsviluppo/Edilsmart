import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { Calendar, Plus, Trash2, Edit2, Save, X, Clock, CheckCircle2, AlertCircle, Link } from 'lucide-react';

interface Task {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'planned' | 'in-progress' | 'completed' | 'delayed';
    progress: number;
    color: string;
    dependencies?: string[];
}

interface CronoprogrammaProps {
    project?: Project;
}

const Cronoprogramma: React.FC<CronoprogrammaProps> = ({ project }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
    const [dependencyMenuTaskId, setDependencyMenuTaskId] = useState<string | null>(null);
    const [statusMenuTaskId, setStatusMenuTaskId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(40); // Pixel per singolo giorno
    const [newTask, setNewTask] = useState<Partial<Task>>({
        name: '',
        startDate: '',
        endDate: '',
        status: 'planned',
        progress: 0,
        color: '#3b82f6'
    });

    const [draggingTask, setDraggingTask] = useState<{
        id: string;
        startX: number;
        startProgress?: number;
        startEndDate?: string;
        barWidth: number;
        mode: 'progress' | 'resize'
    } | null>(null);

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
            color: newTask.color || '#3b82f6',
            dependencies: newTask.dependencies || []
        };

        setTasks([...tasks, task]);
        setNewTask({ name: '', startDate: '', endDate: '', status: 'planned', progress: 0, color: '#3b82f6', dependencies: [] });
        setIsAddingTask(false);
    };

    const updateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prevTasks => {
            const taskToUpdate = prevTasks.find(t => t.id === id);
            if (!taskToUpdate) return prevTasks;

            const updatedTasks = [...prevTasks];
            const taskIndex = updatedTasks.findIndex(t => t.id === id);
            const oldEndDate = taskToUpdate.endDate;
            const oldStartDate = taskToUpdate.startDate;

            updatedTasks[taskIndex] = { ...taskToUpdate, ...updates };

            // Cascade changes if dates changed
            if (updates.endDate && updates.endDate !== oldEndDate) {
                const delta = new Date(updates.endDate).getTime() - new Date(oldEndDate).getTime();
                propagateDependencyChange(id, delta, updatedTasks, 'endDate');
            } else if (updates.startDate && updates.startDate !== oldStartDate) {
                const delta = new Date(updates.startDate).getTime() - new Date(oldStartDate).getTime();
                propagateDependencyChange(id, delta, updatedTasks, 'startDate');
            }

            return updatedTasks;
        });
    };

    const propagateDependencyChange = (parentId: string, deltaMs: number, allTasks: Task[], type: 'startDate' | 'endDate') => {
        allTasks.forEach((task, index) => {
            if (task.dependencies?.includes(parentId)) {
                const newStart = new Date(new Date(task.startDate).getTime() + deltaMs);
                const newEnd = new Date(new Date(task.endDate).getTime() + deltaMs);

                allTasks[index] = {
                    ...task,
                    startDate: newStart.toISOString().split('T')[0],
                    endDate: newEnd.toISOString().split('T')[0]
                };

                // Recursively propagate
                propagateDependencyChange(task.id, deltaMs, allTasks, type);
            }
        });
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
        setDeletingTaskId(null);
    };

    // Helper Functions
    const getDateRange = () => {
        const todayDate = new Date();
        if (tasks.length === 0) {
            const nextSixMonths = new Date(todayDate);
            nextSixMonths.setMonth(todayDate.getMonth() + 6);
            return { minDate: todayDate, maxDate: nextSixMonths };
        }

        const dates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
        const minTaskDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxTaskDate = new Date(Math.max(...dates.map(d => d.getTime())));

        // Aggiungiamo un buffer di 4 mesi alla fine per permettere la visione futura
        const bufferedMaxDate = new Date(maxTaskDate);
        bufferedMaxDate.setMonth(bufferedMaxDate.getMonth() + 4);

        return {
            minDate: minTaskDate,
            maxDate: bufferedMaxDate
        };
    };

    const { minDate, maxDate } = getDateRange();
    const totalDaysInRange = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const calculateTaskPosition = (task: Task) => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        const startOffset = Math.max(0, Math.ceil((taskStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
        const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const leftPercent = (startOffset / totalDaysInRange) * 100;
        const widthPercent = (duration / totalDaysInRange) * 100;

        const maxWidth = 100 - leftPercent;
        const finalWidth = Math.min(widthPercent, maxWidth);

        return { left: `${leftPercent}%`, width: `${finalWidth}%` };
    };

    const generateTimelineData = () => {
        const months: { label: string; width: number; days: { date: number; width: number; isWeekend: boolean }[] }[] = [];
        const current = new Date(minDate);
        current.setDate(1);

        while (current <= maxDate) {
            const monthStart = new Date(current);
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            const effectiveStart = monthStart < minDate ? minDate : monthStart;
            const effectiveEnd = monthEnd > maxDate ? maxDate : monthEnd;
            const monthDaysCount = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const monthDays: { date: number; width: number; isWeekend: boolean }[] = [];
            for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
                monthDays.push({
                    date: d.getDate(),
                    width: (1 / totalDaysInRange) * 100,
                    isWeekend: d.getDay() === 0 || d.getDay() === 6
                });
            }

            months.push({
                label: monthStart.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
                width: (monthDaysCount / totalDaysInRange) * 100,
                days: monthDays
            });
            current.setMonth(current.getMonth() + 1);
        }
        return months;
    };

    const timelineData = generateTimelineData();
    const today = new Date();
    const isTodayInRange = today >= minDate && today <= maxDate;
    const todayPosition = isTodayInRange
        ? (Math.ceil((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDaysInRange) * 100
        : null;

    // Drag to update progress logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingTask) return;

            const deltaX = e.clientX - draggingTask.startX;

            if (draggingTask.mode === 'progress') {
                const percentageChange = (deltaX / draggingTask.barWidth) * 100;
                const newProgress = Math.max(0, Math.min(100, Math.round((draggingTask.startProgress || 0) + percentageChange)));
                updateTask(draggingTask.id, { progress: newProgress });
            } else if (draggingTask.mode === 'resize') {
                // Calculate days from pixels
                const totalDaysRange = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const containerWidth = draggingTask.barWidth / (tasks.find(t => t.id === draggingTask.id)?.progress ? 1 : 1); // This is actually the chart width
                // We need the container width. Let's assume barWidth passed was the chart width or calculate differently
                // Actually, let's use a simpler approach: deltaX / (chartWidth / totalDaysRange) = days
                const chartElement = document.querySelector('.gantt-chart-area');
                if (chartElement) {
                    const chartWidth = chartElement.getBoundingClientRect().width;
                    const pixelsPerDay = chartWidth / totalDaysRange;
                    const daysChange = Math.round(deltaX / pixelsPerDay);

                    const originalEndDate = new Date(draggingTask.startEndDate!);
                    const newEndDate = new Date(originalEndDate);
                    newEndDate.setDate(originalEndDate.getDate() + daysChange);

                    // Validation: end date must be after start date
                    const task = tasks.find(t => t.id === draggingTask.id);
                    if (task && newEndDate > new Date(task.startDate)) {
                        updateTask(draggingTask.id, { endDate: newEndDate.toISOString().split('T')[0] });
                    }
                }
            }
        };

        const handleMouseUp = () => {
            if (draggingTask) {
                setDraggingTask(null);
                document.body.style.cursor = 'default';
                document.body.style.userSelect = 'auto';
            }
        };

        if (draggingTask) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingTask, tasks, minDate, maxDate]);

    const handleProgressMouseDown = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        const barElement = e.currentTarget as HTMLElement;
        const rect = barElement.getBoundingClientRect();

        setDraggingTask({
            id: task.id,
            startX: e.clientX,
            startProgress: task.progress,
            barWidth: rect.width,
            mode: 'progress'
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        const chartElement = document.querySelector('.gantt-chart-area');
        if (!chartElement) return;

        setDraggingTask({
            id: task.id,
            startX: e.clientX,
            startEndDate: task.endDate,
            barWidth: chartElement.getBoundingClientRect().width,
            mode: 'resize'
        });
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
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Dipendenza (Propaga Ritardi)</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={newTask.dependencies?.[0] || ''}
                                onChange={e => setNewTask({ ...newTask, dependencies: e.target.value ? [e.target.value] : [] })}
                            >
                                <option value="">Nessuna (Attività Indipendente)</option>
                                {tasks.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-slate-400 mt-1 italic">
                                Scegli un'attività esistente per collegarle: se la prima viene spostata, questa seguirà automaticamente.
                            </p>
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
                                setNewTask({ name: '', startDate: '', endDate: '', status: 'planned', progress: 0, color: '#3b82f6', dependencies: [] });
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-bold"
                        >
                            <X size={18} />
                            Annulla
                        </button>
                    </div>
                </div>
            )}

            {/* Scale Control Bar */}
            <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">Densità Timeline</span>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg">
                        <button
                            onClick={() => setZoomLevel(Math.max(15, zoomLevel - 10))}
                            className="text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Rimpicciolisci"
                        >
                            <Calendar size={14} className="opacity-70" />
                        </button>
                        <input
                            type="range"
                            min="15"
                            max="120"
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                            className="w-32 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <button
                            onClick={() => setZoomLevel(Math.min(120, zoomLevel + 10))}
                            className="text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Ingrandisci"
                        >
                            <Calendar size={18} />
                        </button>
                    </div>
                </div>
                <div className="text-xs text-slate-500 font-medium italic">
                    Scorri orizzontalmente per vedere tutto il periodo del progetto
                </div>
            </div>

            {/* Gantt Chart */}
            {tasks.length > 0 ? (
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                    <div
                        style={{ width: `${totalDaysInRange * zoomLevel}px`, minWidth: '100%' }}
                        className="relative"
                    >
                        {/* Timeline Header - Sticky */}
                        <div className="sticky top-0 z-30 bg-white border-b-2 border-slate-300 pb-2 mb-6 shadow-sm">
                            {/* Month Row */}
                            <div className="flex border-b border-slate-200">
                                {timelineData.map((month, idx) => (
                                    <div
                                        key={idx}
                                        className="text-center font-bold text-slate-800 py-3 border-r border-slate-200 last:border-r-0 bg-slate-50/50 capitalize text-sm"
                                        style={{ width: `${month.width}%` }}
                                    >
                                        {month.label}
                                    </div>
                                ))}
                            </div>
                            {/* Days Row */}
                            <div className="flex bg-white">
                                {timelineData.map((month) => (
                                    month.days.map((day, dIdx) => {
                                        const showNumber = totalDaysInRange < 45 || day.date === 1 || day.date % 5 === 0 || day.date === month.days[month.days.length - 1].date;
                                        return (
                                            <div
                                                key={`${month.label}-${dIdx}`}
                                                className={`h-8 flex flex-col items-center justify-end border-r border-slate-100 last:border-r-0 relative ${day.isWeekend ? 'bg-rose-50' : ''}`}
                                                style={{ width: `${day.width}%` }}
                                            >
                                                {showNumber ? (
                                                    <span className={`text-[10px] font-bold mb-1 ${day.isWeekend ? 'text-rose-600' : 'text-slate-500'}`}>{day.date}</span>
                                                ) : (
                                                    <div className={`w-[1px] h-2 mb-1 ${day.isWeekend ? 'bg-rose-300' : 'bg-slate-300'}`} />
                                                )}
                                            </div>
                                        );
                                    })
                                ))}
                            </div>

                            {todayPosition !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-40"
                                    style={{ left: `${todayPosition}%` }}
                                    title="Oggi"
                                >
                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                                </div>
                            )}
                        </div>

                        {/* Chart Area with Grid */}
                        <div className="relative gantt-chart-area">
                            {/* Background Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {timelineData.map((month) => (
                                    month.days.map((day, dIdx) => (
                                        <div
                                            key={`${month.label}-${dIdx}`}
                                            className={`h-full border-r border-slate-100 flex-1 last:border-r-0 ${day.isWeekend ? 'bg-rose-50/30' : ''}`}
                                            style={{ width: `${day.width}%` }}
                                        />
                                    ))
                                ))}
                            </div>

                            {/* Today Indicator Line (Chart Area) */}
                            {todayPosition !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-[2px] bg-rose-500/20 z-0 pointer-events-none"
                                    style={{ left: `${todayPosition}%` }}
                                />
                            )}

                            {/* Tasks */}
                            <div className="space-y-4 relative z-10">
                                {tasks.map(task => {
                                    const position = calculateTaskPosition(task);
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
                                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Dipendenza</label>
                                                            <select
                                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                                                value={task.dependencies?.[0] || ''}
                                                                onChange={e => updateTask(task.id, { dependencies: e.target.value ? [e.target.value] : [] })}
                                                            >
                                                                <option value="">Nessuna (Libera)</option>
                                                                {tasks.filter(t => t.id !== task.id).map(t => (
                                                                    <option key={t.id} value={t.id}>{t.name}</option>
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
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                                                {task.name}
                                                                {task.dependencies && task.dependencies.length > 0 && (
                                                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                        <Clock size={10} />
                                                                        Dipendente
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setStatusMenuTaskId(statusMenuTaskId === task.id ? null : task.id)}
                                                                    className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border} hover:brightness-95 transition-all cursor-pointer font-medium`}
                                                                    title="Cambia Stato"
                                                                >
                                                                    {statusLabels[task.status]}
                                                                </button>

                                                                {statusMenuTaskId === task.id && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-[105]" onClick={() => setStatusMenuTaskId(null)} />
                                                                        <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 z-[110] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                                                            {Object.entries(statusLabels).map(([value, label]) => {
                                                                                const sColors = statusColors[value as Task['status']];
                                                                                const isCurrent = task.status === value;
                                                                                return (
                                                                                    <button
                                                                                        key={value}
                                                                                        onClick={() => {
                                                                                            updateTask(task.id, {
                                                                                                status: value as Task['status'],
                                                                                                progress: value === 'completed' ? 100 : task.progress
                                                                                            });
                                                                                            setStatusMenuTaskId(null);
                                                                                        }}
                                                                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between gap-2 group ${isCurrent ? 'bg-slate-50 font-bold' : ''}`}
                                                                                    >
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className={`w-2 h-2 rounded-full ${sColors.bg} border ${sColors.border}`} />
                                                                                            <span className={isCurrent ? 'text-slate-900' : 'text-slate-600'}>{label}</span>
                                                                                        </div>
                                                                                        {isCurrent && <CheckCircle2 size={12} className="text-emerald-500" />}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-slate-500">{task.progress}%</span>

                                                            <div className="h-4 w-[1px] bg-slate-200 mx-1" /> {/* Vertical Divider */}

                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => setEditingTaskId(task.id)}
                                                                    className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Modifica"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={() => setDependencyMenuTaskId(dependencyMenuTaskId === task.id ? null : task.id)}
                                                                        className={`p-1 px-2 rounded transition-colors ${task.dependencies && task.dependencies.length > 0 ? 'text-blue-700 bg-blue-100' : 'text-slate-500 hover:bg-slate-100'}`}
                                                                        title="Gestisci Dipendenze"
                                                                    >
                                                                        <Link size={16} />
                                                                    </button>

                                                                    {dependencyMenuTaskId === task.id && (
                                                                        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-[100] p-4 animate-in fade-in slide-in-from-top-2">
                                                                            <div className="flex items-center justify-between mb-3 border-b pb-2">
                                                                                <h4 className="text-xs font-bold uppercase text-slate-500">Collega a:</h4>
                                                                                <button onClick={() => setDependencyMenuTaskId(null)} className="text-slate-400 hover:text-slate-600">
                                                                                    <X size={14} />
                                                                                </button>
                                                                            </div>
                                                                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                                                                {tasks.filter(t => t.id !== task.id).map(t => {
                                                                                    const isLinked = task.dependencies?.includes(t.id);
                                                                                    return (
                                                                                        <label
                                                                                            key={t.id}
                                                                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isLinked ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                                                                        >
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                                                                checked={isLinked}
                                                                                                onChange={() => {
                                                                                                    const currentDeps = task.dependencies || [];
                                                                                                    const newDeps = isLinked
                                                                                                        ? currentDeps.filter(id => id !== t.id)
                                                                                                        : [...currentDeps, t.id];
                                                                                                    updateTask(task.id, { dependencies: newDeps });
                                                                                                }}
                                                                                            />
                                                                                            <span className="text-xs font-medium truncate">{t.name}</span>
                                                                                        </label>
                                                                                    );
                                                                                })}
                                                                                {tasks.length <= 1 && (
                                                                                    <p className="text-[10px] text-slate-400 italic py-2">Nessuna altra attività disponibile</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => updateTask(task.id, {
                                                                        status: task.status === 'completed' ? 'in-progress' : 'completed',
                                                                        progress: task.status === 'completed' ? task.progress : 100
                                                                    })}
                                                                    className="p-1 px-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                                    title="Segna come completato"
                                                                >
                                                                    <CheckCircle2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeletingTaskId(task.id)}
                                                                    className="p-1 px-2 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                                    title="Elimina"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="relative h-12 bg-slate-100/50 rounded-lg border border-slate-200 overflow-hidden cursor-ew-resize group/bar"
                                                    >
                                                        {/* 1. Full Task Bar Background */}
                                                        <div
                                                            className="absolute top-1 h-10 rounded-md shadow-sm transition-all"
                                                            style={{
                                                                left: position.left,
                                                                width: position.width,
                                                                backgroundColor: task.color,
                                                                opacity: 0.8
                                                            }}
                                                        />

                                                        {/* 2. Progress Overlay (Darker/Different shade) */}
                                                        <div
                                                            className="absolute top-1 h-10 rounded-md bg-black/10 pointer-events-none transition-all"
                                                            style={{
                                                                left: position.left,
                                                                width: `calc(${position.width} * ${task.progress / 100})`,
                                                            }}
                                                        />

                                                        {/* 3. Content Layer (Labels & Dates) - Above everything */}
                                                        <div
                                                            className="absolute top-1 h-10 flex items-center justify-between px-2 text-white text-[10px] font-bold select-none pointer-events-none"
                                                            style={{
                                                                left: position.left,
                                                                width: position.width,
                                                                zIndex: 10
                                                            }}
                                                        >
                                                            <span className="bg-black/20 px-1 rounded backdrop-blur-[2px] whitespace-nowrap">
                                                                {new Date(task.startDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                                                            </span>
                                                            <span className="text-[9px] opacity-90">{task.progress}%</span>
                                                            <span className="bg-black/20 px-1 rounded backdrop-blur-[2px] whitespace-nowrap">
                                                                {new Date(task.endDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                                                            </span>
                                                        </div>

                                                        {/* 4. Interactive Invisible Layer for Dragging */}
                                                        <div
                                                            className="absolute inset-y-0 cursor-ew-resize z-20"
                                                            style={{ left: position.left, width: position.width }}
                                                            onMouseDown={(e) => handleProgressMouseDown(e, task)}
                                                        />

                                                        {/* 5. Resize Handle (Right Edge) */}
                                                        <div
                                                            className="absolute top-1 bottom-1 w-2 hover:bg-white/30 cursor-col-resize z-30 rounded-r-md transition-colors"
                                                            style={{
                                                                left: `calc(${position.left} + ${position.width} - 6px)`,
                                                                width: '10px'
                                                            }}
                                                            onMouseDown={(e) => handleResizeMouseDown(e, task)}
                                                        >
                                                            <div className="h-full w-[2px] bg-white/40 mx-auto rounded-full mt-0" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
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
