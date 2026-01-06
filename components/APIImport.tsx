
import React, { useState, useEffect } from 'react';
import { Download, Search, Globe, CheckCircle, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { PriceList } from '../types';
import {
    searchPriceListDatasets,
    getAvailableRegionalPriceLists,
    importFromCKANDataset,
    downloadAndImportFromURL
} from '../services/apiPriceListService';
import { addPriceList } from '../services/priceListService';

interface APIDataset {
    dataset: any;
    region: string;
    year: number;
}

interface APIImportProps {
    onImportComplete: (priceList: PriceList) => void;
    onClose: () => void;
}

const APIImport: React.FC<APIImportProps> = ({ onImportComplete, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [datasets, setDatasets] = useState<APIDataset[]>([]);
    const [filteredDatasets, setFilteredDatasets] = useState<APIDataset[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<APIDataset | null>(null);

    useEffect(() => {
        loadDatasets();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = datasets.filter(d =>
                d.dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.region.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredDatasets(filtered);
        } else {
            setFilteredDatasets(datasets);
        }
    }, [searchQuery, datasets]);

    const loadDatasets = async () => {
        setLoading(true);
        setError(null);
        try {
            const available = await getAvailableRegionalPriceLists();
            setDatasets(available);
            setFilteredDatasets(available);
        } catch (err) {
            setError('Impossibile caricare i prezziari disponibili. Verifica la connessione internet.');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (datasetInfo: APIDataset) => {
        setImporting(true);
        setError(null);
        setSelectedDataset(datasetInfo);

        try {
            const priceList = await importFromCKANDataset(
                datasetInfo.dataset,
                datasetInfo.region
            );

            addPriceList(priceList);
            setSuccess(true);

            setTimeout(() => {
                onImportComplete(priceList);
                onClose();
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Errore durante l\'importazione');
            setSelectedDataset(null);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Globe className="w-6 h-6" />
                                Importa da API Ufficiali
                            </h2>
                            <p className="text-green-100 text-sm mt-1">
                                Scarica prezziari regionali da dati.gov.it
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                            disabled={importing}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border-b border-green-200 p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="text-green-800">
                                <p className="font-semibold">Prezzario importato con successo!</p>
                                <p className="text-sm">Chiusura in corso...</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-b border-red-200 p-4">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-red-800">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 hover:text-red-700"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="p-6 border-b border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cerca per regione o nome dataset..."
                            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={loading || importing}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader className="w-12 h-12 text-green-600 animate-spin mb-4" />
                            <p className="text-slate-600">Caricamento prezziari disponibili...</p>
                        </div>
                    ) : filteredDatasets.length === 0 ? (
                        <div className="text-center py-12">
                            <Globe className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">
                                {searchQuery ? 'Nessun prezzario trovato' : 'Nessun prezzario disponibile'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={loadDatasets}
                                    className="mt-4 text-green-600 hover:text-green-700 font-semibold"
                                >
                                    Riprova
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredDatasets.map((datasetInfo, index) => {
                                const dataset = datasetInfo.dataset;
                                const csvResource = dataset.resources?.find((r: any) =>
                                    r.format?.toLowerCase() === 'csv' || r.url?.toLowerCase().endsWith('.csv')
                                );
                                const isImporting = importing && selectedDataset?.dataset.id === dataset.id;

                                return (
                                    <div
                                        key={dataset.id || index}
                                        className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-semibold">
                                                        {datasetInfo.region}
                                                    </span>
                                                    <span className="text-slate-500 text-sm">
                                                        Anno {datasetInfo.year}
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-bold text-slate-800 mb-2">
                                                    {dataset.title}
                                                </h3>

                                                {dataset.notes && (
                                                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                                        {dataset.notes}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                                    {dataset.organization && (
                                                        <span className="flex items-center gap-1">
                                                            <Globe className="w-4 h-4" />
                                                            {dataset.organization.title}
                                                        </span>
                                                    )}
                                                    {csvResource && (
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            CSV disponibile
                                                        </span>
                                                    )}
                                                    {dataset.resources && (
                                                        <span>
                                                            {dataset.resources.length} risorse
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {csvResource ? (
                                                    <button
                                                        onClick={() => handleImport(datasetInfo)}
                                                        disabled={importing || success}
                                                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                                    >
                                                        {isImporting ? (
                                                            <>
                                                                <Loader className="w-5 h-5 animate-spin" />
                                                                Importazione...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Download className="w-5 h-5" />
                                                                Importa
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl text-sm text-center">
                                                        CSV non disponibile
                                                    </div>
                                                )}

                                                {dataset.url && (
                                                    <a
                                                        href={dataset.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm flex items-center gap-2 justify-center"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Dettagli
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="border-t border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Globe className="w-4 h-4" />
                        <span>
                            Dati forniti da <strong>dati.gov.it</strong> - Portale nazionale Open Data
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default APIImport;
