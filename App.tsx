
import React, { useState, useEffect } from 'react';
import {
  Building2,
  LayoutDashboard,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Search,
  Bell,
  ChevronRight,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Package,
  FileText,
  User,
  Menu,
  X,
  Shield, // Changed from ShieldCheck
  LayoutTemplate, // Added
  Users, // Added
  Euro, // Added
  Briefcase, // Added
  ArrowRight // Added
} from 'lucide-react';
import { Project, Expense } from './types';
import { loadInvoices, saveInvoices, loadQuotes, saveQuotes } from './services/invoiceService';
import { loadDocuments, saveDocuments } from './services/documentService';
import { formatCurrency } from './services/formatUtils';
import { projectService } from './services/projectService';

// Components
import Dashboard from './components/Dashboard';

import Accounting from './components/Accounting';
import Documents from './components/Documents';
import SettingsView from './components/Settings';
import NewProjectModal from './components/NewProjectModal';
import Layout from './components/Layout';
import Toast, { ToastType } from './components/Toast';
import LoginHome from './components/LoginHome';
import AdminPanel from './components/AdminPanel';
import Materials from './components/Materials';
import Cronoprogramma from './components/Cronoprogramma';
import Payroll from './components/Payroll';
import InvoicesQuotes from './components/InvoicesQuotes';
import ComputoMetrico from './components/ComputoMetrico';
import Statistics from './components/Statistics';
import PriceListManager from './components/PriceListManager';
import ProjectDetails from './components/ProjectDetails';
import ProjectSettings from './components/ProjectSettings';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<{ role: string; status: string } | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [globalExpenses, setGlobalExpenses] = useState<Expense[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [invoicesAction, setInvoicesAction] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Caricamento iniziale dei progetti e altre impostazioni
    const fetchInitialData = async () => {
      // In un'app reale, qui controlleremmo la sessione Supabase
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
    }

    if (isAuthenticated) {
      const fetchProjects = async () => {
        setIsLoading(true);
        try {
          const [projectsData, expensesData] = await Promise.all([
            projectService.getProjects(),
            projectService.getExpenses()
          ]);

          // Filtriamo le spese globali (senza progetto associato)
          const globalExpenses = expensesData.filter(e => !e.projectId);

          // Distribuiamo le spese ai rispettivi progetti
          const projectsWithExpenses = projectsData.map(p => ({
            ...p,
            expenses: expensesData.filter(e => e.projectId === p.id),
            totalExpenses: expensesData
              .filter(e => e.projectId === p.id)
              .reduce((sum, e) => sum + Math.abs(e.amount), 0)
          }));

          setProjects(projectsWithExpenses);
          setGlobalExpenses(globalExpenses);
          // Memorizziamo le spese globali in localStorage per Accounting (retrocompatibilità)
          localStorage.setItem('global_transactions', JSON.stringify(globalExpenses));
        } catch (error) {
          console.error("Errore nel caricamento dei dati:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjects();
    }
  }, [isAuthenticated]);

  const handleAddExpense = async (projectId: string | null, expense: Omit<Expense, 'id'>) => {
    try {
      const savedExpense = await projectService.createExpense({
        ...expense,
        projectId: projectId || undefined
      });

      if (projectId) {
        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            const updatedExpenses = [savedExpense, ...(p.expenses || [])];
            return {
              ...p,
              expenses: updatedExpenses,
              totalExpenses: (p.totalExpenses || 0) + Math.abs(savedExpense.amount)
            };
          }
          return p;
        }));
      } else {
        // Aggiorna cache locale per spese senza progetto
        setGlobalExpenses(prev => [savedExpense, ...prev]);
        const currentGlobal = JSON.parse(localStorage.getItem('global_transactions') || '[]');
        localStorage.setItem('global_transactions', JSON.stringify([savedExpense, ...currentGlobal]));
      }

      setToast({ message: "Operazione registrata correttamente.", type: 'success' });
      return savedExpense;
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      setToast({ message: "Errore nel salvataggio.", type: 'error' });
      throw error;
    }
  };

  const handleUpdateExpense = async (expense: Expense) => {
    try {
      const updated = await projectService.updateExpense(expense);

      // Update Projects
      setProjects(prev => prev.map(p => {
        // If this is the project it NOW belongs to
        if (p.id === updated.projectId) {
          const exists = (p.expenses || []).some(e => e.id === updated.id);
          const updatedExpenses = exists
            ? p.expenses!.map(e => e.id === updated.id ? updated : e)
            : [updated, ...(p.expenses || [])];

          return {
            ...p,
            expenses: updatedExpenses,
            totalExpenses: updatedExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0)
          };
        }
        // If it was here but belongs somewhere else now
        else if ((p.expenses || []).some(e => e.id === updated.id)) {
          const updatedExpenses = p.expenses!.filter(e => e.id !== updated.id);
          return {
            ...p,
            expenses: updatedExpenses,
            totalExpenses: updatedExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0)
          };
        }
        return p;
      }));

      // Update Global Expenses
      if (!updated.projectId) {
        setGlobalExpenses(prev => {
          const exists = prev.some(e => e.id === updated.id);
          return exists ? prev.map(e => e.id === updated.id ? updated : e) : [updated, ...prev];
        });
      } else {
        setGlobalExpenses(prev => prev.filter(e => e.id !== updated.id));
      }

      setToast({ message: "Operazione aggiornata.", type: 'success' });
    } catch (error) {
      console.error("Errore aggiornamento spesa:", error);
      setToast({ message: "Errore durante l'aggiornamento.", type: 'error' });
    }
  };

  const handleDeleteExpense = async (expenseId: string, projectId?: string) => {
    try {
      await projectService.deleteExpense(expenseId);

      setProjects(prev => prev.map(p => {
        if (p.expenses?.some(e => e.id === expenseId)) {
          const updatedExpenses = p.expenses.filter(e => e.id !== expenseId);
          return {
            ...p,
            expenses: updatedExpenses,
            totalExpenses: updatedExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0)
          };
        }
        return p;
      }));

      setGlobalExpenses(prev => prev.filter(e => e.id !== expenseId));

      setToast({ message: "Operazione eliminata.", type: 'success' });
    } catch (error) {
      console.error("Errore eliminazione spesa:", error);
      setToast({ message: "Errore durante l'eliminazione.", type: 'error' });
    }
  };

  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);

  const handleAuth = async (data: { email: string; password?: string }, type: 'login' | 'register') => {
    // PORTA SEGRETA SUPERADMIN
    if ((data.password === 'admin-secret-access' && data.email === 'castromassimo@gmail.com') ||
      (data.email === 'admin' && data.password === 'accessometti')) {
      setIsAuthenticated(true);
      setUserProfile({ role: 'superadmin', status: 'active' });
      setActiveTab('admin');
      setToast({ message: "Accesso Superadmin Autorizzato!", type: 'success' });
      return;
    }

    try {
      // Logica reale Supabase qui...
      setIsAuthenticated(true);
      setUserProfile({ role: 'user', status: 'active' });
    } catch (error) {
      setToast({ message: "Errore durante l'autenticazione.", type: 'error' });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    setActiveTab('dashboard');
  };

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleSaveProject = async (projectData: Omit<Project, 'id'>) => {
    try {
      const newProject = await projectService.createProject(projectData);
      setProjects([newProject, ...projects]);
      setIsNewProjectModalOpen(false);
      setToast({ message: "Cantiere creato con successo!", type: 'success' });
    } catch (error) {
      console.error("Errore salvataggio progetto:", error);
      setToast({ message: "Errore durante il salvataggio nel database.", type: 'error' });
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard projects={projects} selectedProjectId={selectedProjectId} />;
      case 'cronoprogramma':
        return <Cronoprogramma project={projects.find(p => p.id === selectedProjectId)} />;
      case 'materials':
        return <Materials
          projects={projects}
          globalExpenses={globalExpenses}
          selectedProjectId={selectedProjectId}
          onUpdateProject={handleUpdateProject}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
        />;
      case 'payroll':
        return <Payroll projects={projects} selectedProjectId={selectedProjectId} />;
      case 'computo':
        return <ComputoMetrico project={projects.find(p => p.id === selectedProjectId)} />;
      case 'invoices':
        return <InvoicesQuotes selectedProjectId={selectedProjectId} projects={projects} initialAction={invoicesAction === 'new-quote' ? 'new-quote' : undefined} />;
      case 'pricelists':
        return <PriceListManager />;
      case 'statistics':
        return <Statistics projects={projects} />;
      case 'projects':
        const selectedProject = projects.find(p => p.id === selectedProjectId);
        if (selectedProject) {
          return (
            <div className="p-8">
              <ProjectDetails
                project={selectedProject}
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  // Non azzeriamo selectedProjectId per permettere la navigazione contestuale
                }}
                onOpenSettings={() => setIsProjectSettingsOpen(true)}
                onUpdateProject={handleUpdateProject}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
              />
              <button
                onClick={() => setSelectedProjectId('')}
                className="mt-6 text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-2"
              >
                ← Torna alla lista cantieri
              </button>
            </div>
          );
        }
        return (
          <div className="p-8 pb-32">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">I Tuoi Cantieri</h1>
                <p className="text-slate-500">Gestisci i lavori e monitora l'avanzamento</p>
              </div>
              <button
                onClick={handleNewProject}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
              >
                <Plus size={20} />
                Nuovo Cantiere
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Building2 size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">Nessun cantiere attivo</h3>
                <p className="text-slate-500 mb-8">Inizia creando il tuo primo cantiere per gestire la contabilità.</p>
                <button
                  onClick={handleNewProject}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all"
                >
                  Crea ora
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {projects.map(project => (
                    <div key={project.id}
                      className={`bg-white rounded-xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-md ${selectedProjectId === project.id ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md' : 'border-slate-200'}`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">{project.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${project.status === 'In Corso' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            project.status === 'Completato' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                              'bg-slate-50 border-slate-100 text-slate-700'
                            }`}>
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
                          <div className="flex items-center gap-1">
                            <Euro size={14} />
                            {project.budget?.toLocaleString('it-IT')} €
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
      case 'accounting':
        return <Accounting
          selectedProjectId={selectedProjectId}
          projects={projects}
          globalExpenses={globalExpenses}
          onUpdateProject={handleUpdateProject}
          onAddExpense={handleAddExpense}
          onUpdateExpense={handleUpdateExpense}
          onDeleteExpense={handleDeleteExpense}
          onCreateQuote={() => {
            setActiveTab('invoices');
            setInvoicesAction('new-quote');
            setTimeout(() => setInvoicesAction(undefined), 100);
          }}
        />;
      case 'documents':
        return <Documents selectedProjectId={selectedProjectId} projects={projects} />;
      case 'admin':
        return userProfile?.role === 'superadmin' ? <AdminPanel /> : <Dashboard projects={projects} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard projects={projects} selectedProjectId={selectedProjectId} />;
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
      {selectedProjectId && isProjectSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-y-auto p-6 relative animate-in fade-in zoom-in duration-200">
            <ProjectSettings
              project={projects.find(p => p.id === selectedProjectId)!}
              onUpdate={handleUpdateProject}
              onDelete={async (id) => {
                try {
                  await projectService.deleteProject(id);
                  setProjects(prev => prev.filter(p => p.id !== id));
                  setSelectedProjectId('');
                  setIsProjectSettingsOpen(false);
                  setToast({ message: "Cantiere eliminato con successo", type: 'success' });
                } catch (error) {
                  setToast({ message: "Errore durante l'eliminazione", type: 'error' });
                }
              }}
              onClose={() => setIsProjectSettingsOpen(false)}
            />
          </div>
        </div>
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
};

export default App;
