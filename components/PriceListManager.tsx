
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Trash2, Plus, Database, TrendingUp, MapPin, Calendar, Globe, Sparkles } from 'lucide-react';
import { PriceList, PriceListItem } from '../types';
import {
    loadPriceLists,
    deletePriceList,
    searchPriceListItems,
    getCategories,
    getPriceListStats,
    ITALIAN_REGIONS,
} from '../services/priceListService';
import { semanticSearch, isAIConfigured } from '../services/aiService';
import PriceListImport from './PriceListImport';
import APIImport from './APIImport';

const PriceListManager: React.FC = () => {
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [searchResults, setSearchResults] = useState<PriceListItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAPIImportModal, setShowAPIImportModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'search' | 'manage'>('search');

    // AI State
    const [useAI, setUseAI] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    // Filters
    const [filterRegion, setFilterRegion] = useState('');
    const [filterMunicipality, setFilterMunicipality] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterMinPrice, setFilterMinPrice] = useState<number | undefined>();
    const [filterMaxPrice, setFilterMaxPrice] = useState<number | undefined>();

    const stats = getPriceListStats();
    const categories = getCategories();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const lists = loadPriceLists();
        setPriceLists(lists);
    };

    const handleSearch = async () => {
        // Se la query è vuota, non cercare (a meno che non ci siano filtri attivi, ma per AI serve query)
        if (!searchQuery.trim() && !filterRegion && !filterCategory) {
            setSearchResults([]);
            return;
        }

        if (useAI && searchQuery.trim()) {
            setAiLoading(true);
            try {
                // Raccogli tutti gli items disponibili per la ricerca
                const allItems = priceLists.flatMap(pl => pl.items);
                // Nota: Semantic search al momento filtra solo per testo AI, i filtri extra li applichiamo dopo se necessario
                const aiResults = await semanticSearch(searchQuery, allItems);
                setSearchResults(aiResults);
            } catch (e) {
                console.error("AI search error", e);
            } finally {
                setAiLoading(false);
            }
        } else {
            const results = searchPriceListItems(searchQuery, {
                region: filterRegion || undefined,
                municipality: filterMunicipality || undefined,
                category: filterCategory || undefined,
                minPrice: filterMinPrice,
                maxPrice: filterMaxPrice,
            });
            setSearchResults(results);
        }
    };

    useEffect(() => {
        // Debounce search per evitare troppe chiamate AI mentre si scrive
        const timeoutId = setTimeout(() => {
            handleSearch();
        }, 800);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filterRegion, filterMunicipality, filterCategory, filterMinPrice, filterMaxPrice, useAI]);

    const handleDelete = (id: string) => {
        if (confirm('Sei sicuro di voler eliminare questo prezzario?')) {
            deletePriceList(id);
            loadData();
        }
    };

    const handleImportComplete = (priceList: PriceList) => {
        loadData();
        setShowImportModal(false);
        setShowAPIImportModal(false);
    };

    const handleAddToComputo = (item: PriceListItem) => {
        // Emette un evento custom che ComputoMetrico ascolterà
        const event = new CustomEvent('add-computo-item', { detail: item });
        window.dispatchEvent(event);
        alert(`Voce "${item.description}" aggiunta al computo metrico!`);
    };

    const handleExport = (format: 'csv' | 'json') => {
        const dataStr = format === 'json'
            ? JSON.stringify(priceLists, null, 2)
            : priceLists.flatMap(pl => pl.items.map(item =>
                `${item.code},"${item.description}",${item.unit},${item.price},${item.category},${pl.region}`
            )).join('\n'); // CSV Semplificato header: Code,Description,Unit,Price,Category,Region

        const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_prezziari_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const clearFilters = () => {
        setFilterRegion('');
        setFilterMunicipality('');
        setFilterCategory('');
        setFilterMinPrice(undefined);
        setFilterMaxPrice(undefined);
    };

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Database className="w-8 h-8" />
                            Gestione Prezziari
                        </h1>
                        <p className="text-blue-100 mt-1">
                            Importa, cerca e gestisci i prezziari regionali e comunali
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="bg-white text-blue-600 px-4 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Importa CSV
                        </button>
                        <button
                            onClick={() => setShowAPIImportModal(true)}
                            className="bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg text-sm"
                        >
                            <Globe className="w-4 h-4" />
                            Importa da API
                        </button>
                        <button
                            onClick={() => handleExport('csv')}
                            className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export Backup
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <Database className="w-8 h-8 text-blue-200" />
                            <div>
                                <p className="text-blue-100 text-sm">Prezziari Caricati</p>
                                <p className="text-2xl font-bold">{stats.totalPriceLists}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-blue-200" />
                            <div>
                                <p className="text-blue-100 text-sm">Voci Totali</p>
                                <p className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-8 h-8 text-blue-200" />
                            <div>
                                <p className="text-blue-100 text-sm">Regioni</p>
                                <p className="text-2xl font-bold">{stats.regionsCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-blue-200" />
                            <div>
                                <p className="text-blue-100 text-sm">Anno più recente</p>
                                <p className="text-2xl font-bold">{stats.latestYear}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setSelectedTab('search')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${selectedTab === 'search'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Search className="w-5 h-5 inline mr-2" />
                        Ricerca Voci
                    </button>
                    <button
                        onClick={() => setSelectedTab('manage')}
                        className={`flex-1 px-6 py-4 font-semibold transition-colors ${selectedTab === 'manage'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Database className="w-5 h-5 inline mr-2" />
                        Gestisci Prezziari
                    </button>
                </div>

                {/* Search Tab */}
                {selectedTab === 'search' && (
                    <div className="p-6 space-y-6">
                        {/* Search Bar */}
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    {aiLoading ? (
                                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${useAI ? 'text-indigo-500' : 'text-slate-400'}`} />
                                    )}
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={useAI ? "Descrivi cosa devi costruire (es. muro in cemento armato)..." : "Cerca per codice, descrizione o categoria..."}
                                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${useAI
                                                ? 'border-indigo-300 focus:ring-indigo-500 bg-indigo-50'
                                                : 'border-slate-300 focus:ring-blue-500'
                                            }`}
                                    />
                                    {useAI && (
                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setUseAI(!useAI)}
                                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 border ${useAI
                                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <Sparkles className={`w-5 h-5 ${useAI ? 'fill-current' : ''}`} />
                                    {useAI ? 'AI Attiva' : 'Usa AI'}
                                </button>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${showFilters
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <Filter className="w-5 h-5" />
                                    Filtri
                                </button>
                            </div>

                            {useAI && (
                                <p className="text-sm text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                    ✨ <strong>Ricerca Semantica Attiva:</strong> Descrivi il lavoro o i materiali in linguaggio naturale. L'AI troverà le voci più rilevanti nel tuo prezzario.
                                </p>
                            )}
                        </div>

                        {/* Filters Panel */}
                        {showFilters && (
                            <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-700">Filtri Avanzati</h3>
                                    <button
                                        onClick={clearFilters}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                    >
                                        Cancella Filtri
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Regione
                                        </label>
                                        <select
                                            value={filterRegion}
                                            onChange={(e) => setFilterRegion(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Tutte le regioni</option>
                                            {ITALIAN_REGIONS.map((region) => (
                                                <option key={region.code} value={region.name}>
                                                    {region.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Comune
                                        </label>
                                        <input
                                            type="text"
                                            value={filterMunicipality}
                                            onChange={(e) => setFilterMunicipality(e.target.value)}
                                            placeholder="es. Milano"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Categoria
                                        </label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Tutte le categorie</option>
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Prezzo Minimo (€)
                                        </label>
                                        <input
                                            type="number"
                                            value={filterMinPrice || ''}
                                            onChange={(e) => setFilterMinPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="0.00"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Prezzo Massimo (€)
                                        </label>
                                        <input
                                            type="number"
                                            value={filterMaxPrice || ''}
                                            onChange={(e) => setFilterMaxPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                                            placeholder="999999.99"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-slate-700">
                                    Risultati ({searchResults.length})
                                </h3>
                            </div>

                            {searchResults.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50 rounded-xl">
                                    {useAI ? (
                                        <Sparkles className="w-16 h-16 text-indigo-300 mx-auto mb-4" />
                                    ) : (
                                        <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    )}
                                    <p className="text-slate-500">
                                        {priceLists.length === 0
                                            ? 'Nessun prezzario caricato. Importa il tuo primo prezzario!'
                                            : useAI
                                                ? 'Prova a descrivere un lavoro (es. "demolizione parete")'
                                                : 'Nessun risultato trovato. Prova a modificare i filtri.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {searchResults.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow ${useAI ? 'border-indigo-100 hover:border-indigo-300' : 'border-slate-200'}`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm font-semibold">
                                                            {item.code}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {item.region}{item.municipality ? ` - ${item.municipality}` : ''}
                                                        </span>
                                                        {useAI && (
                                                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                                                                <Sparkles className="w-3 h-3" />
                                                                AI Match
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-800 font-medium mb-2">{item.description}</p>
                                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                                        <span className="bg-slate-100 px-2 py-1 rounded">
                                                            {item.category}
                                                        </span>
                                                        <span>Unità: {item.unit}</span>
                                                        <span>Anno: {item.year}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-2xl font-bold text-blue-600 mb-2">
                                                        €{item.price.toFixed(2)}
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddToComputo(item)}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Aggiungi
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Manage Tab */}
                {selectedTab === 'manage' && (
                    <div className="p-6">
                        {priceLists.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl">
                                <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 mb-4">Nessun prezzario caricato</p>
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    Importa il tuo primo prezzario
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {priceLists.map((priceList) => (
                                    <div
                                        key={priceList.id}
                                        className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                                    {priceList.name}
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-slate-500">Regione</p>
                                                        <p className="font-semibold text-slate-700">{priceList.region}</p>
                                                    </div>
                                                    {priceList.municipality && (
                                                        <div>
                                                            <p className="text-slate-500">Comune</p>
                                                            <p className="font-semibold text-slate-700">{priceList.municipality}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-slate-500">Anno</p>
                                                        <p className="font-semibold text-slate-700">{priceList.year}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500">Voci</p>
                                                        <p className="font-semibold text-slate-700">
                                                            {priceList.itemCount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500">Fonte</p>
                                                        <p className="font-semibold text-slate-700 truncate">
                                                            {priceList.source}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-500">Importato il</p>
                                                        <p className="font-semibold text-slate-700">
                                                            {new Date(priceList.importDate).toLocaleDateString('it-IT')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button
                                                    onClick={() => handleDelete(priceList.id)}
                                                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Elimina prezzario"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <PriceListImport
                    onImportComplete={handleImportComplete}
                    onClose={() => setShowImportModal(false)}
                />
            )}

            {/* API Import Modal */}
            {showAPIImportModal && (
                <APIImport
                    onImportComplete={handleImportComplete}
                    onClose={() => setShowAPIImportModal(false)}
                />
            )}
        </div>
    );
};

export default PriceListManager;
