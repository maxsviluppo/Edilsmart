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
import Materials from './components/Materials';
import AdminPanel from './components/AdminPanel';
import {
  HardHat, Clock, Calendar, DollarSign, Package,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';
import { Project } from './types';
import { loadInvoices, saveInvoices, loadQuotes, saveQuotes } from './services/invoiceService';
import { loadDocuments, saveDocuments } from './services/documentService';
import { formatCurrency } from './services/formatUtils';
import LoginHome from './components/LoginHome';
import { projectService } from './services/projectService';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<{ role: string, status: string } | null>(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carica Profilo Utente
  useEffect(() => {
    if (session?.user) {
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', session.user.id)
          .single();

        if (!error && data) {
          setUserProfile(data);
          // Se l'utente è bloccato, forziamo il logout
          if (data.status === 'blocked') {
            alert("Il tuo account è stato bloccato dall'amministratore.");
            handleLogout();
          }
        }
      };
      fetchProfile();
    } else {
      setUserProfile(null);
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects));
  }, [projects]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [invoicesAction, setInvoicesAction] = useState<'new-quote' | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Carica progetti da Supabase
  useEffect(() => {
    // One-time cleanup of old demo data from localStorage
    const isCleaned = localStorage.getItem('edilsmart_demo_cleaned_v2');
    if (!isCleaned) {
      const keysToClear = [
        'projects', 'edilsmart_employees', 'edilsmart_payroll_entries',
        'edilsmart_payroll_notes', 'edilsmart_employee_notes', 'edilsmart_project_monthly_notes',
        'global_transactions', 'accounting_categories', 'edilsmart_suppliers',
        'edilsmart_invoices', 'edilsmart_quotes', 'edilsmart_clients',
        'edilsmart_invoice_counter', 'edilsmart_quote_counter'
      ];
      keysToClear.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('edilsmart_demo_cleaned_v2', 'true');
      console.log("Demo data cleared successfully.");
      // Refresh logic state if needed
      setProjects([]);
    }

    if (isAuthenticated) {
      const fetchProjects = async () => {
        setIsLoading(true);
        try {
          const data = await projectService.getProjects();
          setProjects(data);
        } catch (error) {
          console.error("Errore nel caricamento dei progetti:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjects();
    }
  }, [isAuthenticated]);

  const handleAuth = async (data: { email: string; password?: string }, type: 'login' | 'register') => {
    if (type === 'register') {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password!,
      });
      if (error) throw error;
      alert("Registrazione effettuata! Controlla la tua email per confermare l'account (se richiesto dal provider).");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password!,
      });
      if (error) throw error;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const visibleProjects = selectedProjectId ? projects.filter(p => p.id === selectedProjectId) : projects;

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleSaveProject = async (newProject: Project) => {
    try {
      // @ts-ignore - Rimuoviamo l'id per lasciarlo generare a Supabase
      const { id, ...projectData } = newProject;
      const savedProject = await projectService.createProject(projectData);
      setProjects([savedProject, ...projects]);
      setSelectedProjectId(savedProject.id);
      setActiveTab('projects');
    } catch (error) {
      console.error("Errore nel salvataggio del progetto:", error);
      alert("Errore durante il salvataggio nel database.");
    }
  };

  const handleUpdateProject = async (updatedProject: Project) => {
    try {
      const saved = await projectService.updateProject(updatedProject);
      setProjects(projects.map(p => p.id === saved.id ? saved : p));
    } catch (error) {
      console.error("Errore nell'aggiornamento del progetto:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Sei sicuro? Questa azione eliminerà permanentemente il cantiere dal database.")) return;

    try {
      await projectService.deleteProject(projectId);
      // Pulizia locale (rimane uguale a prima)
      localStorage.removeItem(`computo_${projectId}`);
      localStorage.removeItem(`cronoprogramma_${projectId}`);
      // ... (altre pulizie locali)

      setProjects(projects.filter(p => p.id !== projectId));
      setSelectedProjectId('');
      setActiveTab('projects');
    } catch (error) {
      console.error("Errore nell'eliminazione:", error);
    }
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
        return <Accounting
          selectedProjectId={selectedProjectId}
          projects={projects}
          onUpdateProject={handleUpdateProject}
          onCreateQuote={() => {
            setActiveTab('invoices');
            setInvoicesAction('new-quote');
            setTimeout(() => setInvoicesAction(undefined), 100);
          }}
        />;
      case 'documents':
        return <Documents projects={projects} selectedProjectId={selectedProjectId} />;
      case 'statistics':
        return <Statistics projects={visibleProjects} />;
      case 'payroll':
        return <Payroll projects={visibleProjects} selectedProjectId={selectedProjectId} />;
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
                  onUpdateProject={handleUpdateProject}
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
                      <p className="text-3xl font-bold text-slate-800 mt-1">{formatCurrency(projects.reduce((acc, p) => acc + p.budget, 0))}</p>
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
                            {formatCurrency(project.budget)}
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
      case 'materials':
        return <Materials projects={projects} selectedProjectId={selectedProjectId} onUpdateProject={handleUpdateProject} />;
      case 'admin':
        return userProfile?.role === 'superadmin' ? <AdminPanel /> : <Dashboard projects={projects} />;
      default:
        return <Dashboard projects={projects} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginHome onAuth={handleAuth} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onNewProject={handleNewProject}
      projects={projects}
      selectedProjectId={selectedProjectId}
      onProjectSelect={setSelectedProjectId}
      onLogout={handleLogout}
      userRole={userProfile?.role}
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
