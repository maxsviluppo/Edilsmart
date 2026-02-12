
import React, { useMemo, useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon,
    ArrowUpRight, ArrowDownRight, Activity, Calendar, Sparkles
} from 'lucide-react';
import { Expense, Supplier } from '../types';
import { generateFinancialReport, isAIConfigured } from '../services/aiService';

interface AccountingReportsTabProps {
    transactions: Expense[];
    suppliers: Supplier[];
    categories: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const AccountingReportsTab: React.FC<AccountingReportsTabProps> = ({ transactions, suppliers, categories }) => {
    const [aiInsight, setAiInsight] = useState<string>('');
    const [loadingAi, setLoadingAi] = useState(false);

    // 1. Andamento Mensile (Cash Flow)
    const monthlyData = useMemo(() => {
        const data: Record<string, { month: string, entrate: number, uscite: number }> = {};
        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

        // Initialize with last 6 months
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            data[key] = { month: months[d.getMonth()], entrate: 0, uscite: 0 };
        }

        transactions.forEach(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (data[key]) {
                if (t.amount > 0) data[key].entrate += t.amount;
                else data[key].uscite += Math.abs(t.amount);
            }
        });

        return Object.values(data);
    }, [transactions]);

    // 2. Distribuzione Spese per Categoria
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        transactions.filter(t => t.amount < 0).forEach(t => {
            const cat = t.category || 'Altro';
            counts[cat] = (counts[cat] || 0) + Math.abs(t.amount);
        });

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [transactions]);

    // 3. Top Fornitori
    const topSuppliers = useMemo(() => {
        const spend: Record<string, number> = {};
        transactions.filter(t => t.amount < 0).forEach(t => {
            // Simple heuristic to find supplier name from description or separate field if added later
            const supplierMatch = t.description.match(/\(([^)]+)\)$/);
            const name = supplierMatch ? supplierMatch[1] : 'Generico';
            spend[name] = (spend[name] || 0) + Math.abs(t.amount);
        });

        return Object.entries(spend)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [transactions]);

    const totalIncomes = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netProfit = totalIncomes - totalExpenses;

    // AI Insight Generator
    useEffect(() => {
        const fetchInsight = async () => {
            if (isAIConfigured() && transactions.length > 0) {
                setLoadingAi(true);
                try {
                    const insight = await generateFinancialReport(transactions, netProfit);
                    if (insight) setAiInsight(insight);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoadingAi(false);
                }
            }
        };

        fetchInsight();
    }, [transactions.length, netProfit]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Executive Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Totale Entrate</p>
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <ArrowUpRight size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">€ {totalIncomes.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                        <Activity size={12} /> Flusso di cassa in entrata
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Totale Uscite</p>
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <ArrowDownRight size={20} />
                        </div>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800">€ {totalExpenses.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-xs text-rose-600 font-bold mt-2 flex items-center gap-1">
                        <Activity size={12} /> Flusso di cassa in uscita
                    </p>
                </div>

                <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 ${netProfit >= 0 ? 'border-l-blue-500' : 'border-l-amber-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Saldo Netto</p>
                        <div className={`p-2 rounded-lg ${netProfit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <h3 className={`text-3xl font-black ${netProfit >= 0 ? 'text-slate-800' : 'text-amber-700'}`}>
                        € {netProfit.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        <Calendar size={12} /> Risultato periodo corrente
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cash Flow Chart */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        Andamento Flussi di Cassa
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${Math.round(val / 1000)}k`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`€ ${Number(value).toLocaleString('it-IT')}`, '']}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Bar dataKey="entrate" fill="#10b981" radius={[4, 4, 0, 0]} name="Entrate" />
                                <Bar dataKey="uscite" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Uscite" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>


            </div>

            {/* Bottom Section: Top Suppliers & Monthly Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                            <Sparkles className="text-blue-200" size={24} />
                            Insight Finanziario AI
                        </h3>
                        <div className="text-blue-50 text-sm leading-relaxed mb-8">
                            {loadingAi ? (
                                <div className="flex items-center gap-2 animate-pulse">
                                    <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                                    <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                                    <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                                    <span>L'intelligenza artificiale sta analizzando i dati...</span>
                                </div>
                            ) : aiInsight ? (
                                <p className="italic font-medium">"{aiInsight}"</p>
                            ) : (
                                <p>
                                    L'analisi dei dati evidenzia che il <strong>{categoryData[0]?.name || 'settore principale'}</strong> rappresenta la quota maggiore delle uscite ({Math.round((categoryData[0]?.value || 0) / (totalExpenses || 1) * 100)}%).
                                    {netProfit > 0
                                        ? " Il bilancio è in attivo, suggerendo una buona gestione dei margini operativi."
                                        : " Attenzione al saldo negativo: si consiglia di rinegoziare i termini con i top fornitori per migliorare la liquidità."}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 relative z-10">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Margine di Redditività</span>
                            <span className="text-xl font-black">{totalIncomes > 0 ? Math.round((netProfit / totalIncomes) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-300 rounded-full shadow-[0_0_10px_rgba(147,197,253,0.5)]"
                                style={{ width: `${Math.max(0, Math.min(100, totalIncomes > 0 ? (netProfit / totalIncomes) * 100 : 0))}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingReportsTab;
