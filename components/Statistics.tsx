import React, { useMemo, useState } from 'react';
import { Project } from '../types';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Sparkles,
    BarChart3,
    PieChart as PieChartIcon,
    Target,
    Lightbulb,
    Activity
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface StatisticsProps {
    projects: Project[];
    selectedProjectIds?: string[];
    onSelectProject?: (id: string, tab: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

const Statistics: React.FC<StatisticsProps> = ({ projects, selectedProjectIds = [], onSelectProject }) => {
    const [showAIInsights, setShowAIInsights] = useState(false);

    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        if (selectedProjectIds && selectedProjectIds.length > 0) {
            return projects.filter(p => selectedProjectIds.includes(p.id));
        }
        // Default: tutti i progetti attivi/completati (escludi preventivi per le statistiche reali)
        return projects.filter(p => p.status !== 'Preventivo' && p.status !== 'Perso');
    }, [projects, selectedProjectIds]);

    // Calcolo statistiche reali e aggregate
    const stats = useMemo(() => {
        let totalBudget = 0;
        let totalExpenses = 0;
        let totalAdvances = 0;

        filteredProjects.forEach(p => {
            totalBudget += (p.budget || 0);
            const projectExpenses = p.expenses || [];
            projectExpenses.forEach(e => {
                const amount = Math.abs(e.amount);
                if (e.category === 'Ricavi') {
                    totalAdvances += amount;
                } else {
                    totalExpenses += amount;
                }
            });
        });

        const profit = totalBudget - totalExpenses;
        const profitMargin = totalBudget > 0 ? (profit / totalBudget) * 100 : 0;
        const budgetUtilization = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

        const activeCount = filteredProjects.filter(p => p.status === 'In Corso').length;
        const completedCount = filteredProjects.filter(p => p.status === 'Completato').length;
        const pendingCount = filteredProjects.filter(p => p.status === 'In attesa' || p.status === 'Pianificato').length;

        return {
            totalBudget,
            totalExpenses,
            totalAdvances,
            profit,
            profitMargin,
            budgetUtilization,
            activeCount,
            completedCount,
            pendingCount
        };
    }, [filteredProjects]);

    // Dati reali per grafico andamento temporale (ultimi 6 mesi)
    const monthlyData = useMemo(() => {
        const data: Record<string, { month: string, sortedDate: string, ricavi: number, spese: number }> = {};
        const now = new Date();

        // Inizializza ultimi 6 mesi
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('it-IT', { month: 'short', year: '2-digit' });
            const sortedDate = d.toISOString().substring(0, 7); // yyyy-mm
            data[key] = { month: key, sortedDate, ricavi: 0, spese: 0 };
        }

        filteredProjects.forEach(p => {
            (p.expenses || []).forEach(e => {
                const d = new Date(e.date);
                const key = d.toLocaleString('it-IT', { month: 'short', year: '2-digit' });
                if (data[key]) {
                    const amount = Math.abs(e.amount);
                    if (e.category === 'Ricavi') {
                        data[key].ricavi += amount;
                    } else {
                        data[key].spese += amount;
                    }
                }
            });
        });

        return Object.values(data).sort((a, b) => a.sortedDate.localeCompare(b.sortedDate));
    }, [filteredProjects]);

    // Ripartizione spese per categoria
    const categoryData = useMemo(() => {
        const cats: Record<string, number> = {};
        filteredProjects.forEach(p => {
            (p.expenses || []).forEach(e => {
                if (e.category !== 'Ricavi') {
                    cats[e.category] = (cats[e.category] || 0) + Math.abs(e.amount);
                }
            });
        });

        return Object.entries(cats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredProjects]);

    // Project health/status data
    const projectStatusData = useMemo(() => [
        { name: 'Attivi', value: stats.activeCount, color: '#3b82f6' },
        { name: 'Completati', value: stats.completedCount, color: '#10b981' },
        { name: 'In Attesa', value: stats.pendingCount, color: '#f59e0b' },
    ].filter(item => item.value > 0), [stats]);

    // Top 5 progetti per profitto
    const topProfitProjects = useMemo(() => {
        return filteredProjects
            .map(p => {
                const b = p.budget || 0;
                const s = (p.expenses || [])
                    .filter(e => e.category !== 'Ricavi')
                    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
                return {
                    name: p.name,
                    profit: b - s,
                    margin: b > 0 ? ((b - s) / b) * 100 : 0,
                    budget: b
                };
            })
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 5);
    }, [filteredProjects]);

    // AI Insights
    const aiInsights = useMemo(() => {
        const insights = [];

        if (stats.profitMargin < 15 && stats.totalBudget > 0) {
            insights.push({
                type: 'warning',
                title: 'Analisi Redditività',
                description: `Il margine medio è al ${stats.profitMargin.toFixed(1)}%. Questo è al di sotto della soglia di sicurezza del 20% consigliata per il settore edile.`,
                action: 'Analizza i costi dei materiali che sembrano incidere per oltre il 40% sul budget totale.'
            });
        }

        if (stats.budgetUtilization > 85) {
            insights.push({
                type: 'alert',
                title: 'Rischio Sforamento',
                description: `L'utilizzo del budget ha raggiunto il ${stats.budgetUtilization.toFixed(1)}%.`,
                action: 'Monitora gli ultimi ordini di materiali; il tasso di spesa attuale suggerisce una possibile erosione del margine finale.'
            });
        }

        const highCostCategory = categoryData[0];
        if (highCostCategory && highCostCategory.value > stats.totalExpenses * 0.5) {
            insights.push({
                type: 'info',
                title: 'Concentrazione Costi',
                description: `La categoria "${highCostCategory.name}" rappresenta il ${(highCostCategory.value / stats.totalExpenses * 100).toFixed(0)}% delle tue uscite.`,
                action: 'Valuta se rinegoziare i listini con i fornitori principali per questa categoria.'
            });
        }

        return insights;
    }, [stats, categoryData]);

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={24} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
            case 'alert': return <AlertTriangle className="text-rose-500" size={24} />;
            default: return <Lightbulb className="text-blue-500" size={24} />;
        }
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header with Selection Context */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-blue-600" size={32} />
                        STATISTICHE & ANALYTICS
                    </h2>
                    <p className="text-slate-500 font-medium">Analisi finanziaria {selectedProjectIds.length > 0 ? `di ${selectedProjectIds.length} cantieri selezionati` : "generale dei lavori"}</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedProjectIds.length > 0 && (
                        <button
                            onClick={() => onSelectProject?.('', 'statistics')}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all"
                        >
                            Mostra Tutti i Cantieri
                        </button>
                    )}
                    <button
                        onClick={() => setShowAIInsights(!showAIInsights)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${showAIInsights
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-blue-200'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        <Sparkles size={18} />
                        {showAIInsights ? 'Nascondi' : 'Mostra'} AI Insights
                    </button>
                </div>
            </div>

            {/* AI Insights Panel */}
            {showAIInsights && aiInsights.length > 0 && (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-3xl border border-indigo-100 shadow-inner animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Business Intelligence</h3>
                            <p className="text-slate-500 text-sm">Ottimizzazione basata sui dati reali</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {aiInsights.map((insight, idx) => (
                            <div key={idx} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-3">
                                    {getInsightIcon(insight.type)}
                                    <h4 className="font-bold text-slate-800">{insight.title}</h4>
                                </div>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">{insight.description}</p>
                                <div className="bg-indigo-50/50 p-3 rounded-xl border-l-4 border-indigo-400">
                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Azione Consigliata</p>
                                    <p className="text-xs text-indigo-600 font-medium">{insight.action}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign size={80} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Budget Potenziale</p>
                    <h3 className="text-3xl font-black text-slate-800">€{stats.totalBudget.toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-full w-fit">
                        <Target size={14} />
                        {filteredProjects.length} Cantieri
                    </div>
                </div>

                <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-rose-600">
                        <TrendingDown size={80} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Uscite Complessive</p>
                    <h3 className="text-3xl font-black text-slate-800">€{stats.totalExpenses.toLocaleString()}</h3>
                    <div className={`mt-4 flex items-center gap-2 font-bold text-xs px-3 py-1.5 rounded-full w-fit ${stats.budgetUtilization > 85 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                        <Activity size={14} />
                        {stats.budgetUtilization.toFixed(1)}% del budget
                    </div>
                </div>

                <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-emerald-600">
                        <TrendingUp size={80} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Profitto Maturato</p>
                    <h3 className="text-3xl font-black text-emerald-600">€{stats.profit.toLocaleString()}</h3>
                    <div className={`mt-4 flex items-center gap-2 font-bold text-xs px-3 py-1.5 rounded-full w-fit ${stats.profitMargin > 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        <Sparkles size={14} />
                        {stats.profitMargin.toFixed(1)}% Margine
                    </div>
                </div>

                <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-indigo-600">
                        <Clock size={80} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Stato Operativo</p>
                    <h3 className="text-3xl font-black text-slate-800">{stats.activeCount} <span className="text-base font-bold text-slate-400 lowercase">Attivi</span></h3>
                    <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-full w-fit">
                        <CheckCircle2 size={14} />
                        {stats.completedCount} Chiusi
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Real Cash Flow Trend */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <BarChart3 size={22} className="text-blue-600" />
                            Cash Flow Storico (6 Mesi)
                        </h3>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} fontStyle="bold" />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '15px' }}
                                    labelStyle={{ fontWeight: 'black', marginBottom: '8px', color: '#1e293b' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                                <Line type="monotone" dataKey="ricavi" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} name="Entrate" />
                                <Line type="monotone" dataKey="spese" stroke="#f43f5e" strokeWidth={4} dot={{ fill: '#f43f5e', r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} name="Uscite" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <PieChartIcon size={22} className="text-indigo-600" />
                            Ripartizione Spese per Categoria
                        </h3>
                    </div>
                    <div className="h-80 flex flex-col sm:flex-row items-center">
                        <div className="w-full sm:w-1/2 h-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={6}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `€${value.toLocaleString()}`}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full sm:w-1/2 space-y-3 pl-4">
                            {categoryData.slice(0, 5).map((entry, index) => (
                                <div key={index} className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{entry.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">€{entry.value.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${(entry.value / stats.totalExpenses * 100)}%`,
                                                backgroundColor: COLORS[index % COLORS.length]
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Projects Table Style */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                            <Target className="text-emerald-600" size={24} />
                            Analisi Redditività Cantieri
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">Ranking dei progetti per utile maturato</p>
                    </div>
                </div>
                <div className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Cantiere</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Budget</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Utile</th>
                                    <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Margine</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProfitProjects.map((project, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none">
                                        <td className="px-8 py-6 font-bold text-slate-800">{project.name}</td>
                                        <td className="px-8 py-6 text-right font-medium text-slate-500">€{project.budget.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`font-black ${project.profit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                €{project.profit.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-[100px] h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${project.margin > 20 ? 'bg-emerald-500' : project.margin > 10 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                        style={{ width: `${Math.max(0, Math.min(100, project.margin))}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-black text-slate-800">{project.margin.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
