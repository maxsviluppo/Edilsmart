
import React from 'react';
import {
  LayoutDashboard,
  HardHat,
  Calculator,
  Receipt,
  PieChart,
  Settings,
  Menu,
  X,
  Plus,
  Database,
  ChevronDown,
  Folder
} from 'lucide-react';
import { Project } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewProject: () => void;
  projects: Project[];
  selectedProjectId: string;
  onProjectSelect: (id: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onNewProject,
  projects,
  selectedProjectId,
  onProjectSelect
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Cantieri', icon: HardHat },
    { id: 'computo', label: 'Computo Metrico', icon: Calculator },
    { id: 'pricelists', label: 'Prezziari', icon: Database },
    { id: 'accounting', label: 'Contabilità', icon: Receipt },
    { id: 'reports', label: 'Statistiche', icon: PieChart },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col print:hidden`}>
        <div className="p-6 flex items-center justify-between text-white border-b border-slate-800">
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">EdilSmart</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Project Selector */}
        {isSidebarOpen && (
          <div className="px-4 pt-4 pb-0">
            <div className="relative group">
              <select
                value={selectedProjectId}
                onChange={(e) => onProjectSelect(e.target.value)}
                className="w-full bg-slate-800 text-white p-3 pl-10 pr-8 rounded-lg appearance-none border border-slate-700 hover:border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer text-sm font-medium transition-colors"
              >
                <option value="" disabled>Seleziona Cantiere</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Folder size={18} className="absolute left-3 top-3 text-slate-400 group-hover:text-blue-400 transition-colors" />
              <ChevronDown size={16} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="p-4 pb-2">
          <button
            onClick={onNewProject}
            className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20 group ${isSidebarOpen ? 'px-4 py-3' : 'p-3 aspect-square'}`}
            title="Crea Nuovo Progetto"
          >
            <Plus size={24} className={`${isSidebarOpen ? 'mr-2' : ''} transition-transform group-hover:rotate-90`} />
            {isSidebarOpen && <span className="font-bold whitespace-nowrap">Nuovo Progetto</span>}
          </button>
        </div>

        <nav className="flex-1 mt-2 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon size={22} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center w-full p-2 transition-colors rounded-lg ${activeTab === 'settings' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Settings size={22} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
            {isSidebarOpen && <span>Impostazioni</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col print:overflow-visible">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 print:hidden">
          <h1 className="text-xl font-semibold text-slate-800">
            {menuItems.find(m => m.id === activeTab)?.label}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={onNewProject}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm text-sm font-medium hover:shadow-md transition-all active:scale-95"
            >
              <Plus size={18} className="mr-2" />
              Nuovo Progetto
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
              AD
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
