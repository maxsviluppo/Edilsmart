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
    Lightbulb
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
    Cell
} from 'recharts';

interface StatisticsProps {
    projects: Project[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Statistics: React.FC<StatisticsProps> = ({ projects }) => {
    const [showAIInsights, setShowAIInsights] = useState(false);

    // Calcolo statistiche reali
    const stats = useMemo(() => {
        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        const totalExpenses = projects.reduce((sum, p) => sum + (p.totalExpenses || 0), 0);
        const totalRevenue = projects.reduce((sum, p) => sum + (p.revenue || 0), 0);

        const activeProjects = projects.filter(p => p.status === 'in-progress');
        const completedProjects = projects.filter(p => p.status === 'completed');
        const delayedProjects = projects.filter(p => p.status === 'delayed');

        const avgBudgetUtilization = projects.length > 0
            ? (totalExpenses / totalBudget) * 100
            : 0;

        const profitMargin = totalRevenue > 0
            ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
            : 0;

        return {
            totalBudget,
            totalExpenses,
            totalRevenue,
            profit: totalRevenue - totalExpenses,
            activeCount: activeProjects.length,
            completedCount: completedProjects.length,
            delayedCount: delayedProjects.length,
            avgBudgetUtilization,
            profitMargin
        };
    }, [projects]);

    // Dati per grafico andamento mensile (simulato)
    const monthlyData = useMemo(() => {
        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'];
        return months.map((month, idx) => ({
            month,
            ricavi: Math.floor(stats.totalRevenue / 6 * (0.8 + Math.random() * 0.4)),
            spese: Math.floor(stats.totalExpenses / 6 * (0.8 + Math.random() * 0.4)),
        }));
    }, [stats]);

    // Dati per grafico stato progetti
    const projectStatusData = useMemo(() => [
        { name: 'Attivi', value: stats.activeCount, color: COLORS[0] },
        { name: 'Completati', value: stats.completedCount, color: COLORS[1] },
        { name: 'In Ritardo', value: stats.delayedCount, color: COLORS[3] },
    ].filter(item => item.value > 0), [stats]);

    // Top 5 progetti per budget
    const topProjects = useMemo(() => {
        return [...projects]
            .sort((a, b) => (b.budget || 0) - (a.budget || 0))
            .slice(0, 5)
            .map(p => ({
                name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                budget: p.budget || 0,
                speso: p.totalExpenses || 0,
                utilizzo: p.budget ? ((p.totalExpenses || 0) / p.budget) * 100 : 0
            }));
    }, [projects]);

    // AI Insights
    const aiInsights = useMemo(() => {
        const insights = [];

        // Analisi margine di profitto
        if (stats.profitMargin < 15) {
            insights.push({
                type: 'warning',
                title: 'Margine di Profitto Basso',
                description: `Il tuo margine di profitto è del ${stats.profitMargin.toFixed(1)}%. Considera di rivedere i costi o aumentare i prezzi.`,
                action: 'Analizza i costi di manodopera e materiali per identificare aree di ottimizzazione.'
            });
        } else if (stats.profitMargin > 30) {
            insights.push({
                type: 'success',
                title: 'Eccellente Margine di Profitto',
                description: `Il tuo margine di profitto del ${stats.profitMargin.toFixed(1)}% è ottimo! Continua così.`,
                action: 'Mantieni questa efficienza e considera di espandere il business.'
            });
        }

        // Analisi utilizzo budget
        if (stats.avgBudgetUtilization > 90) {
            insights.push({
                type: 'warning',
                title: 'Utilizzo Budget Elevato',
                description: `Stai utilizzando il ${stats.avgBudgetUtilization.toFixed(1)}% del budget totale.`,
                action: 'Monitora attentamente le spese per evitare sforamenti. Considera di aumentare i budget di contingenza.'
            });
        }

        // Progetti in ritardo
        if (stats.delayedCount > 0) {
            insights.push({
                type: 'alert',
                title: 'Progetti in Ritardo',
                description: `Hai ${stats.delayedCount} progett${stats.delayedCount > 1 ? 'i' : 'o'} in ritardo.`,
                action: 'Rivedi la pianificazione e alloca più risorse ai progetti critici. Considera di rinegoziare le scadenze.'
            });
        }

        // Diversificazione portfolio
        if (projects.length < 3) {
            insights.push({
                type: 'info',
                title: 'Diversifica il Portfolio',
                description: 'Hai pochi progetti attivi. Considera di diversificare per ridurre il rischio.',
                action: 'Cerca nuove opportunità di business in settori complementari.'
            });
        }

        // Efficienza operativa
        const avgProjectValue = stats.totalBudget / Math.max(projects.length, 1);
        if (avgProjectValue < 50000) {
            insights.push({
                type: 'info',
                title: 'Valore Medio Progetti',
                description: `Il valore medio dei tuoi progetti è €${(avgProjectValue / 1000).toFixed(0)}k.`,
                action: 'Considera di puntare a progetti di valore più alto per migliorare la redditività.'
            });
        }

        return insights;
    }, [stats, projects]);

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={24} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
            case 'alert': return <AlertTriangle className="text-rose-500" size={24} />;
            default: return <Lightbulb className="text-blue-500" size={24} />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header con AI Toggle */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Statistiche e Analytics</h2>
                    <p className="text-slate-500 text-sm mt-1">Analisi dettagliata delle performance aziendali</p>
                </div>
                <button
                    onClick={() => setShowAIInsights(!showAIInsights)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${showAIInsights
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                >
                    <Sparkles size={20} />
                    {showAIInsights ? 'Nascondi' : 'Mostra'} AI Insights
                </button>
            </div>

            {/* AI Insights Panel */}
            {showAIInsights && aiInsights.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                            <Sparkles className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Suggerimenti AI per Ottimizzazione Business</h3>
                            <p className="text-sm text-slate-600">Analisi automatica basata sui tuoi dati</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiInsights.map((insight, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-start gap-3">
                                    {getInsightIcon(insight.type)}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 mb-1">{insight.title}</h4>
                                        <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
                                        <div className="bg-slate-50 p-2 rounded text-xs text-slate-700 border-l-2 border-blue-500">
                                            <strong>Azione consigliata:</strong> {insight.action}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Budget Totale</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                €{(stats.totalBudget / 1000).toFixed(0)}k
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <DollarSign className="text-blue-600" size={24} />
                        </div>
                    </div>
                    <div className="flex items-center text-sm">
                        <span className="text-slate-600">Su {projects.length} progetti</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Spese Totali</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                €{(stats.totalExpenses / 1000).toFixed(0)}k
                            </h3>
                        </div>
                        <div className="p-3 bg-rose-50 rounded-lg">
                            <TrendingDown className="text-rose-600" size={24} />
                        </div>
                    </div>
                    <div className="flex items-center text-sm">
                        <span className={`font-semibold ${stats.avgBudgetUtilization > 90 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {stats.avgBudgetUtilization.toFixed(1)}% del budget
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Profitto</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                €{(stats.profit / 1000).toFixed(0)}k
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <TrendingUp className="text-emerald-600" size={24} />
                        </div>
                    </div>
                    <div className="flex items-center text-sm">
                        <span className={`font-semibold ${stats.profitMargin < 15 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {stats.profitMargin.toFixed(1)}% margine
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">Progetti Attivi</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                {stats.activeCount}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg">
                            <Clock className="text-amber-600" size={24} />
                        </div>
                    </div>
                    <div className="flex items-center text-sm">
                        <span className="text-slate-600">
                            {stats.completedCount} completati, {stats.delayedCount} in ritardo
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Andamento Mensile */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-600" />
                        Andamento Ricavi vs Spese
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val / 1000}k`} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="ricavi" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} name="Ricavi" />
                                <Line type="monotone" dataKey="spese" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} name="Spese" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stato Progetti */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PieChartIcon size={20} className="text-blue-600" />
                        Distribuzione Progetti
                    </h3>
                    <div className="flex items-center justify-center h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={projectStatusData}
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                >
                                    {projectStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Top 5 Progetti */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Target size={20} className="text-blue-600" />
                    Top 5 Progetti per Budget
                </h3>
                <div className="space-y-4">
                    {topProjects.map((project, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-slate-900">{project.name}</span>
                                <span className="text-sm text-slate-600">
                                    €{(project.speso / 1000).toFixed(0)}k / €{(project.budget / 1000).toFixed(0)}k
                                </span>
                            </div>
                            <div className="relative w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`absolute top-0 left-0 h-full rounded-full transition-all ${project.utilizzo > 90 ? 'bg-rose-500' : project.utilizzo > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}
                                    style={{ width: `${Math.min(project.utilizzo, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-slate-500">Utilizzo Budget</span>
                                <span className={`text-xs font-bold ${project.utilizzo > 90 ? 'text-rose-600' : project.utilizzo > 70 ? 'text-amber-600' : 'text-emerald-600'
                                    }`}>
                                    {project.utilizzo.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Statistics;
