
import React from 'react';
import {
  LayoutDashboard,
  HardHat,
  Calculator,
  Receipt,
  Wallet,
  PieChart,
  Settings,
  Menu,
  X,
  Plus,
  Database,
  ChevronDown,
  Folder,
  GanttChart,
  FileText,
  FileCheck,
  Package,
  LogOut,
  ShieldCheck,
  LayoutTemplate
} from 'lucide-react';
import { Project } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewProject: (type?: 'In Corso' | 'Preventivo') => void;
  projects: Project[];
  selectedProjectIds: string[];
  onProjectSelect: (ids: string[]) => void;
  onLogout?: () => void;
  userRole?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onNewProject,
  projects,
  selectedProjectIds,
  onProjectSelect,
  onLogout,
  userRole
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isProjectListExpanded, setIsProjectListExpanded] = React.useState(false);

  // Close mobile sidebar and project list when active tab changes
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
    setIsProjectListExpanded(false);
  }, [activeTab]);

  const toggleProject = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      onProjectSelect(selectedProjectIds.filter(id => id !== projectId));
    } else {
      onProjectSelect([...selectedProjectIds, projectId]);
    }
  };

  const activeProjects = projects.filter(p => p.status !== 'Preventivo' && p.status !== 'Perso');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-computo', label: 'Nuovo Computo Metrico', icon: Plus },
    { id: 'estimates', label: 'Archivio Preventivi', icon: LayoutTemplate },
    { id: 'projects', label: 'Cantieri', icon: HardHat },
    { id: 'cronoprogramma', label: 'Cronoprogramma', icon: GanttChart },
    { id: 'materials', label: 'Materiale', icon: Package },
    { id: 'payroll', label: 'Paghe', icon: Wallet },
    { id: 'accounting', label: 'Contabilità', icon: Receipt },
    { id: 'computo', label: 'Computo Metrico', icon: Calculator },
    { id: 'invoices', label: 'Fatture', icon: FileText },
    { id: 'pricelists', label: 'Prezziari', icon: Database },
    { id: 'statistics', label: 'Statistiche', icon: PieChart },
  ];

  if (userRole === 'superadmin') {
    menuItems.push({ id: 'admin', label: 'Amministrazione', icon: ShieldCheck });
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-20 flex items-center justify-between px-4 text-white">
        <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 hover:bg-slate-800 rounded-lg">
          <Menu size={24} />
        </button>
        <span className="font-bold text-lg">EdilSmart</span>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-40 h-full bg-slate-900 transition-all duration-300 ease-in-out flex flex-col print:hidden
        ${isMobileSidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        ${isSidebarOpen ? 'md:w-64' : 'md:w-20'}
      `}>
        <div className="p-6 flex items-center justify-between text-white border-b border-slate-800">
          {(isSidebarOpen || isMobileSidebarOpen) && <span className="font-bold text-xl tracking-tight">EdilSmart</span>}
          <button
            onClick={() => {
              if (window.innerWidth >= 768) {
                setIsSidebarOpen(!isSidebarOpen);
              } else {
                setIsMobileSidebarOpen(false);
              }
            }}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {/* Show X on mobile or when open on desktop */}
            {(isMobileSidebarOpen || (isSidebarOpen && window.innerWidth >= 768)) ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Project Selector - Collapsible multi-selection */}
        {(isSidebarOpen || isMobileSidebarOpen) && (
          <div className="px-4 pt-4 pb-2 border-b border-slate-800/50">
            <button
              onClick={() => setIsProjectListExpanded(!isProjectListExpanded)}
              className="w-full flex items-center justify-between bg-slate-800 text-white p-2.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Folder size={18} className="text-slate-400 shrink-0" />
                <span className="truncate">
                  {selectedProjectIds.length === 0 || selectedProjectIds.length === activeProjects.length
                    ? 'Tutti i cantieri'
                    : `${selectedProjectIds.length} selezionati`}
                </span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${isProjectListExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isProjectListExpanded && (
              <div className="mt-2 space-y-1 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">Filtra Cantieri</span>
                  <button
                    onClick={() => onProjectSelect(selectedProjectIds.length === activeProjects.length ? [] : activeProjects.map(p => p.id))}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                  >
                    {selectedProjectIds.length === activeProjects.length ? 'Nessuno' : 'Tutti'}
                  </button>
                </div>
                {activeProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${selectedProjectIds.includes(project.id) ? 'bg-blue-600/20 text-blue-100' : 'hover:bg-slate-800 text-slate-400'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selectedProjectIds.includes(project.id) ? 'bg-blue-600 border-blue-500' : 'border-slate-600'}`}>
                      {selectedProjectIds.includes(project.id) && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                    </div>
                    <span className="text-xs truncate">{project.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Primary Action Button */}
        <div className="p-4 pb-2">
          <button
            onClick={() => onNewProject('In Corso')}
            className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20 group 
              ${(isSidebarOpen || isMobileSidebarOpen) ? 'px-4 py-3' : 'p-3 aspect-square'}`}
            title="Crea Nuovo Cantiere"
          >
            <Plus size={24} className={`${(isSidebarOpen || isMobileSidebarOpen) ? 'mr-2' : ''} transition-transform group-hover:rotate-90`} />
            {(isSidebarOpen || isMobileSidebarOpen) && <span className="font-bold whitespace-nowrap">Nuovo Cantiere</span>}
          </button>
        </div>

        <nav className="flex-1 mt-2 px-4 space-y-2 overflow-y-auto sidebar-scroll">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={22} className={(isSidebarOpen || isMobileSidebarOpen) ? 'mr-3' : 'mx-auto'} />
              {(isSidebarOpen || isMobileSidebarOpen) && <span className="font-medium text-left">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center w-full p-2 mt-1 transition-colors rounded-lg ${activeTab === 'settings' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Settings size={22} className={(isSidebarOpen || isMobileSidebarOpen) ? 'mr-3' : 'mx-auto'} />
            {(isSidebarOpen || isMobileSidebarOpen) && <span>Impostazioni</span>}
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center w-full p-2 mt-1 text-rose-400 hover:text-rose-300 hover:bg-rose-900/20 transition-colors rounded-lg"
            >
              <LogOut size={22} className={(isSidebarOpen || isMobileSidebarOpen) ? 'mr-3' : 'mx-auto'} />
              {(isSidebarOpen || isMobileSidebarOpen) && <span>Esci</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col print:overflow-visible pt-16 md:pt-0">
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-10 print:hidden">
          <h1 className="text-xl font-semibold text-slate-800">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNewProject('In Corso')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm text-sm font-medium hover:shadow-md transition-all active:scale-95"
            >
              <Plus size={18} className="mr-2" />
              Nuovo Cantiere
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              AD
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
