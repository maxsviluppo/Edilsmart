
import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { PriceList } from '../types';
import { importFromCSV, addPriceList, ITALIAN_REGIONS } from '../services/priceListService';
import { downloadAndImportFromURL } from '../services/apiPriceListService'; // Importa la funzione

interface PriceListImportProps {
    onImportComplete: (priceList: PriceList) => void;
    onClose: () => void;
}

const PriceListImport: React.FC<PriceListImportProps> = ({ onImportComplete, onClose }) => {
    const [selectedRegion, setSelectedRegion] = useState('');
    const [municipality, setMunicipality] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [importMode, setImportMode] = useState<'file' | 'url'>('file');
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                setError('Per ora sono supportati solo file CSV');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleImport = async () => {
        if (!selectedRegion) {
            setError('Seleziona una regione');
            return;
        }

        if (importMode === 'file' && !file) {
            setError('Carica un file CSV');
            return;
        }

        if (importMode === 'url' && !url) {
            setError('Inserisci un URL valido');
            return;
        }

        setImporting(true);
        setError(null);

        try {
            let priceList;
            if (importMode === 'file' && file) {
                priceList = await importFromCSV(file, selectedRegion, municipality || undefined);
            } else {
                // Import da URL
                priceList = await downloadAndImportFromURL(url, selectedRegion);
                // Aggiorniamo eventuali metadati mancanti
                if (municipality) priceList.municipality = municipality;
            }

            addPriceList(priceList);
            setSuccess(true);
            setTimeout(() => {
                onImportComplete(priceList);
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Errore durante l\'importazione');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Upload className="w-6 h-6" />
                            Importa Prezzario
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Carica un file CSV o scarica da URL esterno
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setImportMode('file')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${importMode === 'file' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Carica File
                        </button>
                        <button
                            onClick={() => setImportMode('url')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${importMode === 'url' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Scarica da URL
                        </button>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="text-green-800">
                                <p className="font-semibold">Prezzario importato con successo!</p>
                                <p className="text-sm">Reindirizzamento in corso...</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Region Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Regione *
                        </label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={importing || success}
                        >
                            <option value="">Seleziona una regione</option>
                            {ITALIAN_REGIONS.map((region) => (
                                <option key={region.code} value={region.name}>
                                    {region.name}
                                    {region.hasOfficialPriceList ? ' ✓' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Municipality (Optional) */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Comune (opzionale)
                        </label>
                        <input
                            type="text"
                            value={municipality}
                            onChange={(e) => setMunicipality(e.target.value)}
                            placeholder="es. Milano, Roma, Torino..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            disabled={importing || success}
                        />
                    </div>

                    {/* File / URL Input */}
                    {importMode === 'file' ? (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                File Prezzario (CSV) *
                            </label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                    disabled={importing || success}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer flex flex-col items-center gap-3"
                                >
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <FileText className="w-8 h-8 text-blue-600" />
                                    </div>
                                    {file ? (
                                        <div>
                                            <p className="font-semibold text-slate-700">{file.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {(file.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="font-semibold text-slate-700">
                                                Clicca per caricare un file CSV
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                o trascina qui il file
                                            </p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                URL CSV Prezzario *
                            </label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://esempio.it/prezzario_2024.csv"
                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                disabled={importing || success}
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Inserisci il link diretto al file CSV hostato su un sito pubblico o governativo.
                            </p>
                        </div>
                    )}

                    {/* CSV Format Help (Only for File mode) */}
                    {importMode === 'file' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Formato CSV richiesto
                            </h3>
                            <p className="text-sm text-blue-800 mb-1">
                                Colonne richieste: Codice, Descrizione, Prezzo
                            </p>
                            <p className="text-xs text-blue-600">
                                Esempio: <code className="bg-white px-2 py-1 rounded">Codice,Descrizione,Unità,Prezzo,Categoria</code>
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                            disabled={importing || success}
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={(!file && importMode === 'file') || (!url && importMode === 'url') || !selectedRegion || importing || success}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {importing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Importazione...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Importa Prezzario
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceListImport;
