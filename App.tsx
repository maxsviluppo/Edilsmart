
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ComputoMetrico from './components/ComputoMetrico';
import Accounting from './components/Accounting';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'computo':
        return <ComputoMetrico />;
      case 'accounting':
        return <Accounting />;
      case 'projects':
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="text-slate-400 mb-4">Sezione Gestione Cantieri</div>
            <p className="text-slate-600">Seleziona un cantiere dalla lista o creane uno nuovo per iniziare.</p>
          </div>
        );
      case 'reports':
        return (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="text-slate-400 mb-4">Modulo Statistiche Avanzate</div>
            <p className="text-slate-600">Sincronizza i dati per generare report SAL e bilanci preventivo/consuntivo.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
