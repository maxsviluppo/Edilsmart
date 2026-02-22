
import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  LayoutTemplate,
  Briefcase,
  ArrowRight,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Project, Expense } from '../types';
import { formatChartValue, formatCurrency } from '../services/formatUtils';

interface DashboardProps {
  projects: Project[];
  selectedProjectId?: string;
  onSelectProject?: (id: string, tab: string) => void;
}

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}% vs mese precedente
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ projects, selectedProjectId, onSelectProject }) => {
  const filteredProjects = useMemo(() => {
    // Escludiamo preventivi dalla dashboard principale dei lavori, a meno che non sia selezionato specificamente
    const activeProjects = projects.filter(p => p.status !== 'Preventivo' && p.status !== 'Perso');
    if (selectedProjectId) {
      return projects.filter(p => p.id === selectedProjectId);
    }
    return activeProjects;
  }, [projects, selectedProjectId]);

  const stats = useMemo(() => {
    const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const activeProjectsCount = filteredProjects.filter(p => p.status === 'In Corso').length;
    const completedProjectsCount = filteredProjects.filter(p => p.status === 'Completato').length;
    const pendingEstimatesCount = projects.filter(p => p.status === 'Preventivo' || p.status === 'In attesa').length;

    return {
      totalBudget,
      activeProjects: activeProjectsCount,
      completedProjects: completedProjectsCount,
      pendingEstimates: pendingEstimatesCount
    };
  }, [filteredProjects, projects]);

  // Calcolo dati per lo schema di guadagno (Schema richiesto dall'utente)
  const economicData = useMemo(() => {
    let totalBudget = 0;
    let totalMaterials = 0;
    let totalLabor = 0;
    let totalAdvances = 0;
    let totalOther = 0;

    filteredProjects.forEach(p => {
      totalBudget += (p.budget || 0);
      (p.expenses || []).forEach(e => {
        const amount = Math.abs(e.amount);
        if (e.category === 'Ricavi') {
          totalAdvances += amount;
        } else if (e.category === 'Materiali' || e.category === 'Materiali Speciali') {
          totalMaterials += amount;
        } else if (e.category === 'Manodopera') {
          totalLabor += amount;
        } else {
          totalOther += amount;
        }
      });
    });

    const totalCosts = totalMaterials + totalLabor + totalOther;
    const currentGain = totalBudget - totalCosts;
    const marginPercent = totalBudget > 0 ? (currentGain / totalBudget) * 100 : 0;

    // Rimanenza da incassare per raggiungere il budget
    const remainingToCollect = Math.max(0, totalBudget - totalAdvances);

    return {
      budget: totalBudget,
      materials: totalMaterials,
      labor: totalLabor,
      other: totalOther,
      totalCosts,
      advances: totalAdvances,
      gain: currentGain,
      marginPercent,
      remainingToCollect
    };
  }, [filteredProjects]);

  const chartData = useMemo(() => {
    return filteredProjects
      .filter(p => p.status === 'In Corso' || p.status === 'Completato')
      .slice(0, 6)
      .map(project => ({
        name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
        budget: project.budget || 0,
      }));
  }, [filteredProjects]);

  const pieData = [
    { name: 'Materiali', value: economicData.materials, color: '#3b82f6' },
    { name: 'Manodopera', value: economicData.labor, color: '#10b981' },
    { name: 'Altro', value: economicData.other, color: '#f59e0b' },
    { name: 'Margine', value: Math.max(0, economicData.gain), color: '#6366f1' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Section with Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">ANALISI GENERALE</h2>
          <p className="text-slate-500 font-medium">Monitoraggio budget, costi e redditività dei cantieri</p>
        </div>
        {selectedProjectId && (
          <button
            onClick={() => onSelectProject?.('', 'dashboard')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-all"
          >
            Mostra Tutti i Cantieri
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Budget Preventivato"
          value={formatCurrency(stats.totalBudget)}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Cantieri Attivi"
          value={stats.activeProjects.toString()}
          icon={Clock}
          color="amber"
          trend={12}
        />
        <StatCard
          title="Preventivi in Studio"
          value={stats.pendingEstimates.toString()}
          icon={LayoutTemplate}
          color="indigo"
        />
        <StatCard
          title="Utili Previsti"
          value={formatCurrency(economicData.gain)}
          icon={CheckCircle}
          color="emerald"
          trend={economicData.marginPercent.toFixed(1)}
        />
      </div>

      {/* SCHEMA DI GUADAGNO - RICHIESTA UTENTE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <Activity className="text-emerald-600" size={24} />
              SCHEMA ANALISI GUADAGNO
            </h3>
            <p className="text-slate-500 text-sm mt-1">Scomposizione del Budget tra Costi, Acconti e Margine</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Margine Attuale</p>
              <p className="text-2xl font-black text-emerald-600">{economicData.marginPercent.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Summary Numbers */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-sm font-bold text-blue-600 uppercase mb-1">Budget Iniziale</p>
                <p className="text-3xl font-black text-blue-900">{formatCurrency(economicData.budget)}</p>
                <p className="text-xs font-medium text-blue-400 mt-2">Valore totale dei contratti attivi</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                      <TrendingDown size={18} />
                    </div>
                    <span className="font-bold text-slate-700">Totale Spese</span>
                  </div>
                  <span className="font-black text-rose-600">{formatCurrency(economicData.totalCosts)}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <DollarSign size={18} />
                    </div>
                    <span className="font-bold text-slate-700">Acconti Ricevuti</span>
                  </div>
                  <span className="font-black text-emerald-600">{formatCurrency(economicData.advances)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center px-4">
                  <span className="text-lg font-black text-slate-800">GUADAGNO</span>
                  <span className="text-2xl font-black text-emerald-600">{formatCurrency(economicData.gain)}</span>
                </div>
              </div>
            </div>

            {/* Center: Visual Breakdown Bars */}
            <div className="lg:col-span-2 space-y-10">
              {/* Visual 1: How budget is split into costs vs gain */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <h4 className="font-black text-slate-700 uppercase text-xs tracking-widest">Composizione Budget (Costi vs Guadagno)</h4>
                  <span className="text-xs font-bold text-slate-400 italic">Target: {formatCurrency(economicData.budget)}</span>
                </div>
                <div className="relative h-12 w-full flex rounded-2xl overflow-hidden shadow-inner bg-slate-100">
                  {economicData.budget > 0 ? (
                    <>
                      <div style={{ width: `${(economicData.materials / economicData.budget) * 100}%` }} className="bg-blue-500 h-full flex items-center justify-center text-[10px] text-white font-bold" title="Materiali">
                        {((economicData.materials / economicData.budget) * 100).toFixed(0)}%
                      </div>
                      <div style={{ width: `${(economicData.labor / economicData.budget) * 100}%` }} className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold border-l border-white/20" title="Manodopera">
                        {((economicData.labor / economicData.budget) * 100).toFixed(0)}%
                      </div>
                      <div style={{ width: `${(economicData.other / economicData.budget) * 100}%` }} className="bg-amber-500 h-full flex items-center justify-center text-[10px] text-white font-bold border-l border-white/20" title="Altre Spese">
                        {((economicData.other / economicData.budget) * 100).toFixed(0)}%
                      </div>
                      <div style={{ width: `${Math.max(0, (economicData.gain / economicData.budget) * 100)}%` }} className="bg-indigo-600 h-full flex items-center justify-center text-[10px] text-white font-black border-l border-white/20" title="Guadagno Residuo">
                        GUADAGNO
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-center text-slate-400 text-xs font-medium italic">Nessun dato budget disponibile</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Materiali</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Manodopera</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Altre Spese</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div><span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Guadagno Residuo</span></div>
                </div>
              </div>

              {/* Visual 2: Advances status against budget */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <h4 className="font-black text-slate-700 uppercase text-xs tracking-widest">Stato Incassi (Acconti vs Rimanenza)</h4>
                  <span className="text-xs font-bold text-indigo-600 italic">Progress: {((economicData.advances / economicData.budget) * 100 || 0).toFixed(1)}%</span>
                </div>
                <div className="relative h-10 w-full flex rounded-2xl overflow-hidden shadow-inner bg-slate-100 border border-slate-200">
                  {economicData.budget > 0 ? (
                    <>
                      <div style={{ width: `${Math.min(100, (economicData.advances / economicData.budget) * 100)}%` }} className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full shadow-lg" title="Acconti Ricevuti"></div>
                      <div className="flex-1 h-full flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        Mancano {formatCurrency(economicData.remainingToCollect)} per chiudere il budget
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-center text-slate-400 text-xs font-medium italic">In attesa di dati...</div>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Inizio</span>
                  <span className="text-emerald-600">Acconti: {formatCurrency(economicData.advances)}</span>
                  <span>Target: {formatCurrency(economicData.budget)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Bar Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <PieChartIcon size={20} className="text-blue-500" />
              SAL per Cantiere
            </h3>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Top 6 Progetti</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} fontStyle="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `€${formatChartValue(val)}`} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 'black', marginBottom: '4px', color: '#1e293b' }}
                />
                <Bar dataKey="budget" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} name="Budget Totale" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown with real data */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <DollarSign size={20} className="text-emerald-500" />
              Ripartizione Costi & Margine
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center">
            <div className="h-72 w-full sm:flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter(d => d.value > 0)}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
