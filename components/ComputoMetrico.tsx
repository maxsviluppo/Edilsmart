
import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Download, FileText, Trash2, PlusCircle } from 'lucide-react';
import { searchPriceList } from '../services/geminiService';
import { ComputoRow } from '../types';

const ComputoMetrico: React.FC = () => {
  const [rows, setRows] = useState<ComputoRow[]>([
    { id: '1', code: 'NP.01.001', description: 'Scavo di sbancamento in materie di qualsiasi natura e consistenza...', unit: 'm3', quantity: 150, price: 12.50, total: 1875, category: 'Scavi' },
    { id: '2', code: 'NP.02.045', description: 'Calcestruzzo per fondazioni a resistenza garantita C25/30...', unit: 'm3', quantity: 45, price: 145.00, total: 6525, category: 'Strutture' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState('Lombardia');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsAiLoading(true);
    const results = await searchPriceList(searchQuery, region);
    setAiSuggestions(results);
    setIsAiLoading(false);
  };

  const addRow = (suggestion: any) => {
    const newRow: ComputoRow = {
      id: Math.random().toString(36).substr(2, 9),
      code: suggestion.code,
      description: suggestion.description,
      unit: suggestion.unit,
      quantity: 1,
      price: suggestion.price,
      total: suggestion.price,
      category: 'Generale'
    };
    setRows([...rows, newRow]);
    setAiSuggestions([]);
    setSearchQuery('');
  };

  const deleteRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const totalComputo = useMemo(() => rows.reduce((acc, row) => acc + row.total, 0), [rows]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Cerca voce nel prezziario (es. calcestruzzo, cartongesso...)"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          </div>
          <select 
            className="px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option>Lombardia</option>
            <option>Lazio</option>
            <option>Emilia-Romagna</option>
            <option>Sicilia</option>
          </select>
          <button 
            onClick={handleSearch}
            disabled={isAiLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center shadow-sm disabled:opacity-50"
          >
            <Sparkles size={18} className="mr-2" />
            {isAiLoading ? 'Ricerca...' : 'Ricerca IA'}
          </button>
        </div>

        {aiSuggestions.length > 0 && (
          <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center">
              <Sparkles size={14} className="mr-2" />
              Risultati suggeriti da Prezziario {region}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiSuggestions.map((s, i) => (
                <div key={i} className="bg-white p-3 rounded border border-indigo-200 flex justify-between items-start text-xs">
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-slate-900">{s.code}</p>
                    <p className="text-slate-600 line-clamp-2 mt-1">{s.description}</p>
                    <p className="mt-1 text-indigo-600 font-semibold">{s.price.toFixed(2)} €/{s.unit}</p>
                  </div>
                  <button 
                    onClick={() => addRow(s)}
                    className="text-indigo-600 hover:text-indigo-800 p-1"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spreadsheet-like Table */}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="px-4 py-3 w-32">Codice</th>
                <th className="px-4 py-3">Descrizione</th>
                <th className="px-4 py-3 w-16">U.M.</th>
                <th className="px-4 py-3 w-24">Quantità</th>
                <th className="px-4 py-3 w-32 text-right">Prezzo Unit.</th>
                <th className="px-4 py-3 w-32 text-right">Importo</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{row.code}</td>
                  <td className="px-4 py-3 max-w-md truncate md:whitespace-normal">{row.description}</td>
                  <td className="px-4 py-3 text-center">{row.unit}</td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      className="w-full p-1 border border-transparent hover:border-slate-300 rounded focus:border-blue-500 outline-none transition-colors"
                      defaultValue={row.quantity}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">€ {row.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold">€ {row.total.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deleteRow(row.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold border-t text-slate-900">
              <tr>
                <td colSpan={5} className="px-4 py-4 text-right">Totale Generale:</td>
                <td className="px-4 py-4 text-right text-lg">€ {totalComputo.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <button className="flex items-center text-slate-600 hover:text-slate-900 px-4 py-2 font-medium">
            <Download size={18} className="mr-2" />
            Esporta PDF
          </button>
          <button className="flex items-center text-slate-600 hover:text-slate-900 px-4 py-2 font-medium">
            <FileText size={18} className="mr-2" />
            Computo Excel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold shadow-md">
            Salva Computo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComputoMetrico;
