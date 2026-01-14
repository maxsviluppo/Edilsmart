import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ComputoMetrico from './components/ComputoMetrico';
import Cronoprogramma from './components/Cronoprogramma';
import Accounting from './components/Accounting';
import PriceListManager from './components/PriceListManager';
import NewProjectModal from './components/NewProjectModal';
import ProjectDetails from './components/ProjectDetails';
import ProjectSettings from './components/ProjectSettings';
import Settings from './components/Settings'; // New Import
import Statistics from './components/Statistics';
import InvoicesQuotes from './components/InvoicesQuotes';
import Documents from './components/Documents';
import Payroll from './components/Payroll';
import { HardHat, Clock, Calendar, DollarSign, User } from 'lucide-react';
import { Project } from './types';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'Ristrutturazione Villa Rossi', client: 'Giuseppe Rossi', status: 'In Corso', budget: 150000, startDate: '2024-01-15', endDate: '2024-12-31', iva: 10, progress: 45, location: 'Via Roma 10', totalExpenses: 65000, revenue: 150000 },
    { id: '2', name: 'Rifacimento Facciata Condominio', client: 'Amm. Bianchi', status: 'In attesa', budget: 85000, startDate: '2024-03-01', endDate: '2024-09-30', iva: 20, progress: 0, location: 'Piazza Garibaldi 2', totalExpenses: 5000, revenue: 85000 },
    { id: '3', name: 'Nuova Costruzione Box Auto', client: 'Luigi Verdi', status: 'Pianificato', budget: 35000, startDate: '2024-04-10', endDate: '2024-08-15', iva: 10, progress: 0, totalExpenses: 0, revenue: 35000 },
    { id: '4', name: 'Manutenzione Straordinaria Tetto', client: 'Condominio Parco', status: 'Completato', budget: 28000, startDate: '2023-11-05', endDate: '2024-02-20', iva: 20, progress: 100, totalExpenses: 22000, revenue: 28000 },
  ]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [invoicesAction, setInvoicesAction] = useState<'new-quote' | undefined>(undefined);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const visibleProjects = selectedProjectId ? projects.filter(p => p.id === selectedProjectId) : projects;

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleSaveProject = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setSelectedProjectId(newProject.id);
    setActiveTab('projects');
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
    setSelectedProjectId('');
    setActiveTab('projects');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Corso': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Completato': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'In attesa': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard projects={visibleProjects} />;
      case 'computo':
        return <ComputoMetrico project={selectedProject} />;
      case 'cronoprogramma':
        return <Cronoprogramma project={selectedProject} />;
      case 'invoices':
        return <InvoicesQuotes projects={projects} selectedProjectId={selectedProjectId} initialAction={invoicesAction} />;
      case 'pricelists':
        return <PriceListManager />;
      case 'accounting':
        return <Accounting onCreateQuote={() => {
          setActiveTab('invoices');
          setInvoicesAction('new-quote');
          setTimeout(() => setInvoicesAction(undefined), 100);
        }} />;
      case 'documents':
        return <Documents projects={projects} selectedProjectId={selectedProjectId} />;
      case 'statistics':
        return <Statistics projects={visibleProjects} />;
      case 'payroll':
        return <Payroll projects={visibleProjects} />;
      case 'projects':
        return (
          <div className="space-y-6">
            {/* Show project settings if enabled */}
            {showProjectSettings && selectedProject ? (
              <ProjectSettings
                project={selectedProject}
                onUpdate={handleUpdateProject}
                onDelete={handleDeleteProject}
                onClose={() => setShowProjectSettings(false)}
              />
            ) : selectedProject ? (
              <div>
                <button
                  onClick={() => setSelectedProjectId('')}
                  className="mb-4 text-slate-600 hover:text-slate-800 flex items-center gap-2 font-medium"
                >
                  ← Torna alla lista cantieri
                </button>
                <ProjectDetails
                  project={selectedProject}
                  onNavigate={setActiveTab}
                  onOpenSettings={() => setShowProjectSettings(true)}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium uppercase">Cantieri Attivi</p>
                      <p className="text-3xl font-bold text-slate-800 mt-1">{projects.filter(p => p.status === 'In Corso').length}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                      <HardHat size={24} />
                    </div>
                  </div>
                  <div
                    onClick={() => setActiveTab('statistics')}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div>
                      <p className="text-slate-500 text-sm font-medium uppercase group-hover:text-blue-600 transition-colors">Valore Totale</p>
                      <p className="text-3xl font-bold text-slate-800 mt-1">€ {(projects.reduce((acc, p) => acc + p.budget, 0) / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <DollarSign size={24} />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium uppercase">In Attesa</p>
                      <p className="text-3xl font-bold text-slate-800 mt-1">{projects.filter(p => p.status === 'In attesa' || p.status === 'Pianificato').length}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
                      <Clock size={24} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {projects.map(project => (
                    <div key={project.id}
                      className={`bg-white rounded-xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-md ${selectedProjectId === project.id ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md' : 'border-slate-200'}`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-slate-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <User size={14} />
                            {project.client}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            Inizio: {new Date(project.startDate || '').toLocaleDateString('it-IT')}
                          </div>
                          {project.endDate && (
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              Fine: {new Date(project.endDate).toLocaleDateString('it-IT')}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <DollarSign size={14} />
                            € {project.budget.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="flex-1 md:w-48">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500 font-medium">Avanzamento</span>
                            <span className="text-slate-700 font-bold">{project.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>
                        <button className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition-colors">
                          Visualizza
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      case 'reports':
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="text-slate-400 mb-4">Modulo Statistiche Avanzate</div>
            <p className="text-slate-600">Sincronizza i dati per generare report SAL e bilanci preventivo/consuntivo.</p>
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard projects={projects} />;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onNewProject={handleNewProject}
      projects={projects}
      selectedProjectId={selectedProjectId}
      onProjectSelect={setSelectedProjectId}
    >
      {renderContent()}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSave={handleSaveProject}
      />
    </Layout>
  );
};

export default App;
