import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Download,
  Trash2,
  PlusCircle,
  Save,
  Printer,
  FileText,
  AlertTriangle,
  ChevronDown,
  Calculator,
  Library
} from 'lucide-react';
import { ComputoRow, Project, PriceListItem } from '../types';
import { loadPriceLists, searchPriceListItems, ITALIAN_REGIONS } from '../services/priceListService';
import { semanticSearch, getAISuggestions } from '../services/aiService';

interface ComputoMetricoProps {
  project?: Project;
}

const ComputoMetrico: React.FC<ComputoMetricoProps> = ({ project }) => {
  const [rows, setRows] = useState<ComputoRow[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [region, setRegion] = useState('');
  const [isAISearchLoading, setIsAISearchLoading] = useState(false);
  const [showPriceListModal, setShowPriceListModal] = useState(false);
  const [priceListSearchQuery, setPriceListSearchQuery] = useState('');
  const [priceListSearchResults, setPriceListSearchResults] = useState<PriceListItem[]>([]);

  // Autocomplete State
  const [activeCell, setActiveCell] = useState<{ rowId: string, field: 'code' | 'description' } | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('company_settings');
        if (saved) setCompanySettings(JSON.parse(saved));
      } catch (e) { console.error(e); }
    };
    loadSettings();
    window.addEventListener('company-settings-updated', loadSettings);
    return () => window.removeEventListener('company-settings-updated', loadSettings);
  }, []);

  // Load saved computo and notes when project changes
  useEffect(() => {
    if (project?.id) {
      // Load Rows
      const savedRows = localStorage.getItem(`computo_${project.id}`);
      if (savedRows) {
        try {
          setRows(JSON.parse(savedRows));
        } catch (e) { console.error("Failed to load saved computo", e); }
      } else {
        setRows([]);
      }

      // Load Notes
      const savedNotes = localStorage.getItem(`computo_notes_${project.id}`);
      setNotes(savedNotes || '');
    }
  }, [project?.id]);

  // Save on change
  useEffect(() => {
    if (project?.id) {
      if (rows.length > 0) {
        localStorage.setItem(`computo_${project.id}`, JSON.stringify(rows));
      }
      localStorage.setItem(`computo_notes_${project.id}`, notes);
    }
  }, [rows, notes, project?.id]);

  const addNewRow = () => {
    const newRow: ComputoRow = {
      id: Math.random().toString(36).substr(2, 9),
      code: '',
      description: '',
      unit: '',
      quantity: 0,
      price: 0,
      total: 0,
      category: '',
      dimensions: { par_ug: 1, lung: 0, larg: 0, h_peso: 0 }
    };
    setRows(prev => [...prev, newRow]);
  };

  const deleteRow = (id: string) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const duplicateRow = (row: ComputoRow) => {
    const newRow = { ...row, id: Math.random().toString(36).substr(2, 9) };
    setRows(prev => {
      const idx = prev.findIndex(r => r.id === row.id);
      const newRows = [...prev];
      newRows.splice(idx + 1, 0, newRow);
      return newRows;
    });
  };

  const updateRow = (id: string, field: keyof ComputoRow, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        const updated = { ...r, [field]: value };
        // Recalculate total if price or quantity changes
        if (field === 'price' || field === 'quantity') {
          const price = field === 'price' ? (typeof value === 'number' ? value : parseFloat(value) || 0) : r.price;
          const quantity = field === 'quantity' ? (typeof value === 'number' ? value : parseFloat(value) || 0) : r.quantity;
          updated.total = parseFloat((quantity * price).toFixed(2));
        }
        return updated;
      }
      return r;
    }));

    if (field === 'code' || field === 'description') {
      if (!region) return;
      if (typeof value === 'string' && value.length > 2) {
        const matches = searchPriceListItems(value, { region });
        setSuggestions(matches.slice(0, 5));
        setActiveCell({ rowId: id, field: field as 'code' | 'description' });
      } else {
        setSuggestions([]);
      }
    }
  };

  const handleAISearch = async (id: string, query: string) => {
    if (!query || !region) return;
    setIsAISearchLoading(true);
    try {
      // In a real app, we'd fetch the full list of items for this region
      const allItems = loadPriceLists().find(l => l.region === region)?.items || [];
      const aiMatches = await semanticSearch(query, allItems);
      setSuggestions(aiMatches.slice(0, 5));
      setActiveCell({ rowId: id, field: 'description' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAISearchLoading(false);
    }
  };

  const handleGetAISuggestions = async (row: ComputoRow) => {
    try {
      const item: PriceListItem = {
        code: row.code,
        description: row.description,
        unit: row.unit,
        price: row.price,
        category: row.category || '',
        region: region
      };
      const suggestions = await getAISuggestions(item);
      if (suggestions.length > 0) {
        alert("Suggerimenti AI per questa voce:\n\n" + suggestions.map(s => `• ${s}`).join('\n'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateDimensions = (id: string, field: 'par_ug' | 'lung' | 'larg' | 'h_peso', value: number) => {
    setRows(rows.map(r => {
      if (r.id === id) {
        const newDims = { ...(r.dimensions || { par_ug: 1, lung: 0, larg: 0, h_peso: 0 }), [field]: value };

        const p = newDims.par_ug || 1;
        const l = newDims.lung || 0;
        const w = newDims.larg || 0;
        const h = newDims.h_peso || 0;

        let qty = r.quantity;
        const hasDimensions = l > 0 || w > 0 || h > 0;

        if (hasDimensions) {
          qty = p * (l !== 0 ? l : 1) * (w !== 0 ? w : 1) * (h !== 0 ? h : 1);
        }

        return {
          ...r,
          dimensions: newDims,
          quantity: parseFloat(qty.toFixed(2)),
          total: parseFloat((qty * r.price).toFixed(2))
        };
      }
      return r;
    }));
  };

  const applySuggestion = (rowId: string, item: any) => {
    setRows(prev => prev.map(r => {
      if (r.id === rowId) {
        return {
          ...r,
          code: item.code,
          description: item.description,
          unit: item.unit,
          price: item.price,
          category: item.category || 'Generale',
          total: parseFloat((r.quantity * item.price).toFixed(2))
        };
      }
      return r;
    }));
    setSuggestions([]);
    setActiveCell(null);
  };

  const handlePriceListSearch = (q: string) => {
    setPriceListSearchQuery(q);
    if (!region) return;
    const results = searchPriceListItems(q, { region });
    setPriceListSearchResults(results.slice(0, 50));
  };

  const addFromPriceList = (item: PriceListItem) => {
    const newRow: ComputoRow = {
      id: Math.random().toString(36).substr(2, 9),
      code: item.code,
      description: item.description,
      unit: item.unit,
      quantity: 1,
      price: item.price,
      total: item.price,
      category: item.category || 'Generale',
      dimensions: { par_ug: 1, lung: 0, larg: 0, h_peso: 0 }
    };
    setRows(prev => [...prev, newRow]);
    setShowPriceListModal(false);
  };

  const totalComputo = useMemo(() => rows.reduce((acc, row) => acc + row.total, 0), [rows]);

  const handleExportPDF = () => {
    window.print();
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
        <div className="text-slate-400 mb-4">Nessun Progetto Selezionato</div>
        <p className="text-slate-600">Seleziona un cantiere dal menu laterale.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* CSS for Print Formatting */}
      <style>{`
        @media print {
          @page { margin: 10mm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .print-visible { display: block !important; }
          #page-footer { position: fixed; bottom: 0; width: 100%; text-align: right; font-size: 10px; color: #666; padding-top: 10px; border-top: 1px solid #ccc; }
          #page-footer::after { content: "Pagina " counter(page); }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>

      {/* Control Bar - Hidden in Print */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase">Prezziario di Riferimento</label>
            <div className="relative">
              <select
                className={`pl-3 pr-8 py-2 rounded-lg border ${!region ? 'border-amber-300 bg-amber-50' : 'border-slate-300'} focus:ring-2 focus:ring-emerald-500 outline-none min-w-[250px] appearance-none cursor-pointer`}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">-- Seleziona Prezziario --</option>
                {ITALIAN_REGIONS.map(r => (
                  <option key={r.code} value={r.name}>{r.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>
          </div>
          {!region ? (
            <div className="flex items-center text-amber-600 text-sm bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-pulse">
              <AlertTriangle size={16} className="mr-2" />
              Seleziona prezzario
            </div>
          ) : (
            <button
              onClick={() => setShowPriceListModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-bold hover:bg-blue-100 transition-colors"
              title="Sfoglia Prezzario Completo"
            >
              <Library size={18} />
              Sfoglia Prezzario
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={addNewRow} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center font-bold shadow transition-all active:scale-95">
            <PlusCircle size={18} className="mr-2" />
            Aggiungi Voce
          </button>
          <button onClick={handleExportPDF} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center font-medium shadow transition-all">
            <Printer size={18} className="mr-2" /> Stampa / PDF
          </button>
        </div>
      </div>

      {/* Main Computo Sheet */}
      <div className="w-full mx-auto bg-white shadow-lg rounded-xl overflow-hidden print:shadow-none print:w-full print:rounded-none">
        <div className="p-6 md:p-8 print:p-0 min-h-[500px] flex flex-col relative overflow-x-auto print:overflow-visible">

          {/* Header Documento - Enhanced with Settings */}
          <div className="mb-6 print:mb-8 flex justify-between items-start border-b-2 border-emerald-800 pb-4">
            <div>
              {companySettings?.logoUrl ? (
                <img src={companySettings.logoUrl} alt="Logo" className="h-16 mb-2 object-contain" />
              ) : (
                <div className="h-16 mb-2 flex items-center text-slate-400 border border-dashed px-4 bg-slate-50 border-slate-300 rounded">
                  <span className="text-xs font-bold uppercase tracking-wider">Logo Azienda</span>
                </div>
              )}
              <h2 className="text-sm font-bold text-slate-700 uppercase">{companySettings?.name || 'Nome Azienda'}</h2>
              <p className="text-xs text-slate-500 max-w-[250px] whitespace-pre-line">{companySettings?.address}</p>
              {companySettings?.vat && <p className="text-xs text-slate-500">P.IVA: {companySettings.vat}</p>}
            </div>
            <div className="text-right mt-2">
              <h2 className="text-xl font-bold text-emerald-900 uppercase tracking-wider mb-1">Computo Metrico</h2>
              <h3 className="font-bold text-slate-800 text-lg">{project.name}</h3>
              <p className="text-sm text-slate-600">{project.client}</p>
              <p className="text-xs text-slate-500 max-w-[200px] ml-auto">{project.location || 'Indirizzo cantiere'}</p>
              <p className="text-xs text-slate-400 mt-2">Data: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Main Table */}
          <table className="w-full min-w-[1000px] print:min-w-0 border-collapse border-2 border-emerald-700 text-xs font-sans table-fixed relative print:text-[10px]">
            <thead className="print:table-header-group">
              <tr className="bg-emerald-50 text-emerald-900 border-b border-emerald-700 print:bg-slate-50">
                <th className="border-r border-emerald-700 p-1 w-[8%] align-middle text-center" rowSpan={2}>N. ORD<br />TARIFFA</th>
                <th className="border-r border-emerald-700 p-1 w-[37%] align-middle text-center" rowSpan={2}>DESIGNAZIONE DEI LAVORI</th>
                <th className="border-r border-emerald-700 p-1 border-b align-middle w-[25%]" colSpan={4}>DIMENSIONI</th>
                <th className="border-r border-emerald-700 p-1 w-[10%] align-middle text-center" rowSpan={2}>Quantità</th>
                <th className="p-1 border-b align-middle w-[20%]" colSpan={2}>IMPORTI</th>
              </tr>
              <tr className="bg-emerald-50 text-emerald-900 border-b-double border-emerald-700 text-[10px] print:bg-slate-50">
                <th className="border-r border-emerald-700 p-1 w-[6.25%]">par.ug..</th>
                <th className="border-r border-emerald-700 p-1 w-[6.25%]">lung. .</th>
                <th className="border-r border-emerald-700 p-1 w-[6.25%]">larg. .</th>
                <th className="border-r border-emerald-700 p-1 w-[6.25%]">H/peso</th>
                <th className="border-r border-emerald-700 p-1 w-[10%]">unitario</th>
                <th className="p-1 w-[10%]">TOTALE</th>
              </tr>
            </thead>
            <tbody className="text-slate-900">
              {/* Empty State */}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                    Nessuna voce presente. <button onClick={addNewRow} className="text-emerald-600 font-bold hover:underline print:hidden">Aggiungi voce</button>
                  </td>
                </tr>
              )}

              {rows.map((row, idx) => (
                <tr key={row.id} className="border-b border-emerald-600/30 hover:bg-emerald-50/10 align-top group break-inside-avoid">
                  {/* Num/Code */}
                  <td className="border-r border-emerald-600/50 p-1 relative text-center align-top">
                    <div className="font-bold text-emerald-900/80">{idx + 1}</div>
                    <input
                      className="w-full text-center bg-transparent focus:bg-emerald-50 outline-none mt-1 text-[10px] text-slate-600 font-normal print:hidden"
                      placeholder="CAP..."
                      value={row.code}
                      onChange={(e) => updateRow(row.id, 'code', e.target.value)}
                    />
                    <div className="hidden print:block text-[10px] text-slate-600 mt-1">{row.code}</div>

                    {/* Autocomplete */}
                    {activeCell?.rowId === row.id && activeCell.field === 'code' && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 top-full mt-1 w-[300px] bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden flex flex-col max-h-48 overflow-y-auto print:hidden text-left">
                        {suggestions.map((s, i) => (
                          <div key={i} onClick={() => applySuggestion(row.id, s)} className="p-2 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0">
                            <div className="font-bold text-emerald-700">{s.code}</div>
                            <div className="text-xs text-slate-600 truncate">{s.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Description */}
                  <td className="border-r border-emerald-600/50 p-0 relative group-hover:bg-white transition-colors h-full">
                    <div className="relative">
                      <textarea
                        className="w-full h-full min-h-[80px] print:min-h-0 resize-y bg-transparent focus:bg-emerald-50 outline-none p-2 text-justify text-xs leading-relaxed z-10 relative print:hidden"
                        value={row.description}
                        onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                        placeholder="Descrizione..."
                        rows={4}
                      />
                      {/* AI Button on row */}
                      <div className="hidden group-hover:block absolute bottom-1 right-2 z-20 print:hidden">
                        <button
                          onClick={() => handleAISearch(row.id, row.description)}
                          disabled={isAISearchLoading || !region}
                          className={`p-1.5 rounded bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors ${isAISearchLoading ? 'animate-pulse' : ''}`}
                          title="Ricerca Semantica AI"
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="hidden print:block p-2 text-justify whitespace-pre-wrap">{row.description}</div>

                    <div className="flex justify-between items-center px-2 pb-1">
                      <div className="flex items-center gap-2">
                        <select
                          className="text-[10px] px-2 py-1 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-emerald-500 outline-none print:hidden uppercase"
                          value={row.unit}
                          onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                        >
                          <option value="">-- U.M. --</option>
                          {['M', 'M2', 'M3', 'ML', 'A CORPO', 'CAD.', 'KG', 'TON.', 'ORA'].map((u: string) => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <div className="font-bold text-[10px] text-emerald-800 italic">
                          {row.unit ? `(${row.unit})` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                        <button
                          onClick={() => handleGetAISuggestions(row)}
                          className="text-amber-600 hover:text-amber-700 p-1"
                          title="Suggerimento AI (Prodotti Correlati)"
                        >
                          <Sparkles size={14} />
                        </button>
                        <button onClick={() => duplicateRow(row)} className="text-blue-500 hover:text-blue-700 p-1" title="Duplica"><FileText size={14} /></button>
                        <button onClick={() => deleteRow(row.id)} className="text-rose-500 hover:text-rose-700 p-1" title="Elimina"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    {/* Autocomplete Desc */}
                    {activeCell?.rowId === row.id && activeCell.field === 'description' && suggestions.length > 0 && (
                      <div className="absolute z-50 left-0 top-full mt-1 w-full bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden flex flex-col max-h-48 overflow-y-auto print:hidden text-left">
                        {suggestions.map((s, i) => (
                          <div key={i} onClick={() => applySuggestion(row.id, s)} className="p-2 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0">
                            <div className="font-bold text-emerald-700 flex justify-between">
                              <span>{s.code}</span>
                              <span className="text-[10px] bg-emerald-100 px-1 rounded">€ {s.price}</span>
                            </div>
                            <div className="text-xs text-slate-600">{s.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Dimensions */}
                  {['par_ug', 'lung', 'larg', 'h_peso'].map((field) => (
                    <td key={field} className="border-r border-emerald-600/50 p-0 text-center align-top bg-emerald-50/5 hover:bg-emerald-50/30">
                      <input
                        className="w-full text-center bg-transparent focus:bg-emerald-50 outline-none print:hidden py-2"
                        type="number"
                        placeholder={field === 'par_ug' ? '1' : ''}
                        value={(row.dimensions as any)?.[field] || ''}
                        onChange={(e) => updateDimensions(row.id, field as any, parseFloat(e.target.value))}
                      />
                      <div className="hidden print:block py-2 text-slate-700">
                        {(row.dimensions as any)?.[field] ? (row.dimensions as any)[field].toFixed(2) : ''}
                      </div>
                    </td>
                  ))}

                  {/* Quantity */}
                  <td className="border-r border-emerald-600/50 p-2 text-right font-bold align-top">
                    <input
                      type="number"
                      className="w-full text-right bg-transparent focus:bg-emerald-50 outline-none print:hidden font-bold text-slate-900"
                      placeholder="0.00"
                      value={row.quantity || ''}
                      onChange={(e) => updateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                      step="0.01"
                    />
                    <div className="hidden print:block">
                      {row.quantity ? row.quantity.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </div>
                  </td>

                  {/* Unit Price - Now Editable */}
                  <td className="border-r border-emerald-600/50 p-2 text-right align-top text-slate-600 hover:bg-emerald-50/10">
                    <input
                      type="number"
                      className="w-full text-right bg-transparent focus:bg-emerald-50 outline-none print:hidden mb-1 font-bold text-slate-800"
                      placeholder="0.00"
                      value={row.price || ''}
                      onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                      step="0.01"
                    />
                    <div className="hidden print:block">
                      {row.price ? row.price.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </div>
                  </td>

                  {/* Total Price */}
                  <td className="p-2 text-right font-bold align-top text-emerald-900 bg-emerald-50/10">
                    {row.total ? row.total.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </td>
                </tr>
              ))}

              {/* Add Row Button */}
              <tr className="print:hidden">
                <td colSpan={9} className="p-2 text-center border-t border-emerald-200">
                  <button onClick={addNewRow} className="flex items-center justify-center w-full py-2 text-emerald-600 hover:bg-emerald-50 rounded border border-dashed border-emerald-300 font-semibold transition-colors">
                    <PlusCircle size={18} className="mr-2" /> Aggiungi nuova voce vuota
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot className="print:table-footer-group">
              <tr className="border-t-4 border-double border-emerald-700 bg-emerald-50 font-bold text-emerald-900 shadow-inner print:bg-white print:border-t-2">
                <td colSpan={6} className="border-r border-emerald-700 p-4 text-left uppercase tracking-wider text-sm">
                  <div className="flex items-center">
                    <Calculator size={24} className="mr-3 print:hidden" />
                    <span>Totale Complessivo (IVA Esclusa)</span>
                  </div>
                </td>
                <td colSpan={3} className="p-4 text-right text-3xl print:text-xl font-black bg-white text-emerald-950 tracking-tight">
                  € {totalComputo.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Footer di Pagina (Stampa) */}
          <div id="page-footer" className="hidden print:block fixed bottom-0 left-0 w-full text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2 bg-white">
            EdilSmart Software - {companySettings?.name ? `${companySettings.name} - ` : ''} Committente: {project.client}
          </div>
        </div>
      </div>

      {/* Note del Progetto */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:mt-8">
        <div className="flex items-center gap-2 mb-4 text-emerald-800">
          <FileText size={20} />
          <h3 className="font-bold uppercase text-sm tracking-wider">Note e Osservazioni del Computo</h3>
        </div>
        <textarea
          className="w-full p-4 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[150px] bg-slate-50/50 hover:bg-white transition-all"
          placeholder="Inserisci qui annotazioni particolari, prescrizioni tecniche o note per il cantiere..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <p className="text-[11px] text-slate-400 mt-2 italic">
          Le note vengono salvate automaticamente e sono specifiche per il cantiere: <strong>{project.name}</strong>.
        </p>
      </div>

      {/* Price List Search Modal */}
      {showPriceListModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Library size={28} />
                <div>
                  <h3 className="text-xl font-bold italic">Prezzario {region}</h3>
                  <p className="text-emerald-100 text-xs">Ricerca e importa le voci ufficiali nel computo</p>
                </div>
              </div>
              <button
                onClick={() => setShowPriceListModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Trash2 size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-medium"
                  placeholder="Cerca per codice, descrizione o materiale..."
                  autoFocus
                  value={priceListSearchQuery}
                  onChange={(e) => handlePriceListSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {priceListSearchResults.length > 0 ? (
                priceListSearchResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="group p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex justify-between items-start gap-4"
                    onClick={() => addFromPriceList(item)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{item.code}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.category}</span>
                      </div>
                      <p className="text-slate-800 text-sm font-medium leading-relaxed">{item.description}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-xl font-black text-slate-900 whitespace-nowrap">€ {item.price.toLocaleString('it-IT', { minimumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-normal">/{item.unit}</span></div>
                      <button className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Importa Voce
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <Search size={48} className="mb-4 opacity-20" />
                  <p className="font-bold">Nessun risultato trovato</p>
                  <p className="text-sm">Prova a cercare termini più generici (es: "muro", "intonaco", "scavo")</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">
              Prezzario Regionale Ufficiale - Edilsmart AI Integration
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComputoMetrico;
