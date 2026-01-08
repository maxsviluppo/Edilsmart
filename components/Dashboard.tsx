

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
  Pie
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { Project } from '../types';

interface DashboardProps {
  projects: Project[];
}

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 uppercase">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon size={24} />
      </div>
    </div>
    {trend !== undefined && (
      <div className="flex items-center mt-4">
        {trend > 0 ? (
          <TrendingUp size={16} className="text-emerald-500 mr-1" />
        ) : (
          <TrendingDown size={16} className="text-rose-500 mr-1" />
        )}
        <span className={`text-xs font-semibold ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {Math.abs(trend)}% vs mese scorso
        </span>
      </div>
    )}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  const stats = useMemo(() => {
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalExpenses = projects.reduce((sum, p) => sum + (p.totalExpenses || 0), 0);
    const activeProjects = projects.filter(p => p.status === 'in-progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    return {
      totalBudget,
      totalExpenses,
      activeProjects,
      completedProjects
    };
  }, [projects]);

  const chartData = useMemo(() => {
    return projects.slice(0, 6).map(project => ({
      name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      budget: project.budget || 0,
      speso: project.totalExpenses || 0
    }));
  }, [projects]);

  const pieData = [
    { name: 'Materiali', value: 400, color: '#3b82f6' },
    { name: 'Manodopera', value: 300, color: '#10b981' },
    { name: 'Noleggi', value: 150, color: '#f59e0b' },
    { name: 'Altro', value: 50, color: '#6366f1' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Budget Totale"
          value={`€ ${(stats.totalBudget / 1000).toFixed(0)}k`}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Spese Totali"
          value={`€ ${(stats.totalExpenses / 1000).toFixed(0)}k`}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Cantieri Attivi"
          value={stats.activeProjects.toString()}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Completati"
          value={stats.completedProjects.toString()}
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Stato Avanzamento Lavori (SAL)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val / 1000}k`} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Budget Previsto" />
                <Bar dataKey="speso" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Spesa Reale" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Ripartizione Costi Media</h3>
          <div className="flex items-center">
            <div className="h-80 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 pr-8">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
