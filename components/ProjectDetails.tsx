import React from 'react';
import { Project } from '../types';
import {
    Building,
    User,
    MapPin,
    Calendar,
    Euro,
    TrendingUp,
    FileText,
    Calculator,
    Receipt,
    Settings as SettingsIcon,
    ArrowRight,
    Clock,
    GanttChart
} from 'lucide-react';

interface ProjectDetailsProps {
    project: Project;
    onNavigate: (tab: string) => void;
    onOpenSettings: () => void;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, onNavigate, onOpenSettings }) => {
    const calculateTotalWithIVA = () => {
        if (!project.budget || !project.iva) return project.budget || 0;
        return project.budget + (project.budget * project.iva / 100);
    };

    const quickActions = [
        {
            id: 'computo',
            label: 'Computo Metrico',
            icon: Calculator,
            color: 'emerald',
            description: 'Gestisci le voci del computo'
        },
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
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                        <Euro size={16} />
                        <span className="font-semibold">Totale Preventivo</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-800">
                        € {project.budget?.toLocaleString('it-IT', { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                </div>

                {project.iva !== undefined && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                            <FileText size={16} />
                            <span className="font-semibold">IVA ({project.iva}%)</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">
                            € {((project.budget || 0) * project.iva / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                )}

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-2 text-emerald-100 text-sm mb-2">
                        <Euro size={16} />
                        <span className="font-semibold">Totale IVA Inclusa</span>
                    </div>
                    <p className="text-3xl font-bold">
                        € {calculateTotalWithIVA().toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Avanzamento Lavori</h3>
                    <span className="text-2xl font-bold text-emerald-600">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500 shadow-inner"
                        style={{ width: `${project.progress || 0}%` }}
                    ></div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Azioni Rapide</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
    );
};

export default ProjectDetails;
