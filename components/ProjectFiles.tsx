import React, { useState, useEffect, useRef } from 'react';
import {
    File,
    Download,
    Eye,
    Trash2,
    Share2,
    Upload,
    X,
    FileText,
    Image as ImageIcon,
    FileSpreadsheet,
    ExternalLink,
    Search,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Smartphone
} from 'lucide-react';
import { ProjectFile, projectFileService } from '../services/projectFileService';
import { formatBytes } from '../services/formatUtils'; // Assumendo che esista o lo implemento sotto

interface ProjectFilesProps {
    projectId: string;
}

const ProjectFiles: React.FC<ProjectFilesProps> = ({ projectId }) => {
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadFiles();
    }, [projectId]);

    const loadFiles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await projectFileService.getFiles(projectId);
            setFiles(data);
        } catch (err: any) {
            console.error(err);
            setError("Impossibile caricare i file. Assicurati che la tabella 'project_files' esista su Supabase.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setIsUploading(true);
        setError(null);

        try {
            const file = selectedFiles[0];
            // Controllo dimensione max 10MB per sicurezza
            if (file.size > 10 * 1024 * 1024) {
                throw new Error("Il file è troppo grande. Massimo 10MB.");
            }

            const newFile = await projectFileService.uploadFile(projectId, file);
            setFiles(prev => [newFile, ...prev]);

            // Messaggio di successo (opzionale, potremmo usare un toast globale)
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Errore durante il caricamento del file. Verifica che il bucket 'project-files' esista su Supabase.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteFile = async (file: ProjectFile) => {
        if (!confirm(`Sei sicuro di voler eliminare il file "${file.name}"?`)) return;

        try {
            await projectFileService.deleteFile(file.id, file.storage_path);
            setFiles(prev => prev.filter(f => f.id !== file.id));
        } catch (err) {
            console.error(err);
            alert("Errore durante l'eliminazione del file.");
        }
    };

    const handleShareFile = async (file: ProjectFile) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: file.name,
                    text: `Documento cantiere: ${file.name}`,
                    url: file.url,
                });
            } catch (err) {
                console.error("Errore condivisione:", err);
            }
        } else {
            // Fallback: copia link negli appunti
            navigator.clipboard.writeText(file.url);
            alert("Link copiato negli appunti!");
        }
    };

    const getFileIcon = (type: string) => {
        if (type.includes('image')) return <ImageIcon className="text-blue-500" size={24} />;
        if (type.includes('pdf')) return <FileText className="text-red-500" size={24} />;
        if (type.includes('word') || type.includes('text')) return <FileText className="text-blue-600" size={24} />;
        if (type.includes('excel') || type.includes('spreadsheet') || type.includes('csv')) return <FileSpreadsheet className="text-emerald-600" size={24} />;
        return <File className="text-slate-400" size={24} />;
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isImage = (type: string) => type.includes('image');
    const isPdf = (type: string) => type.includes('pdf');
    const isText = (type: string) => type.includes('text/plain') || type.includes('text');
    const isWord = (type: string, fileName: string) =>
        type.includes('wordprocessingml') ||
        type.includes('msword') ||
        fileName.toLowerCase().endsWith('.docx') ||
        fileName.toLowerCase().endsWith('.doc');

    if (isLoading && files.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Loader2 className="animate-spin mx-auto text-emerald-600 mb-4" size={40} />
                <p className="text-slate-500 font-medium">Caricamento archivio file...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={22} className="text-emerald-600" />
                        Archivio Documenti Cantiere
                    </h3>
                    <p className="text-sm text-slate-500">Gestisci foto, PDF e documenti tecnici del cantiere</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cerca file..."
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        {isUploading ? 'Caricamento...' : 'Carica File'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                    <div>
                        <p className="text-sm font-bold text-amber-800">Nota per l'amministratore</p>
                        <p className="text-xs text-amber-700 mt-0.5">{error}</p>
                        <p className="text-[10px] text-amber-600 mt-2 font-mono uppercase tracking-tighter">
                            Assicurati di aver eseguito lo script SQL fornito e creato il bucket 'project-files'.
                        </p>
                    </div>
                </div>
            )}

            {/* File List */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 whitespace-nowrap">File</th>
                            <th className="px-6 py-3">Data</th>
                            <th className="px-6 py-3">Dimensione</th>
                            <th className="px-6 py-3 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredFiles.length > 0 ? (
                            filteredFiles.map((file) => (
                                <tr key={file.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800 line-clamp-1">{file.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{file.type.split('/')[1] || file.type}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                        {new Date(file.created_at).toLocaleDateString('it-IT')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                        {formatBytes(file.size)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(isImage(file.type) || isPdf(file.type) || isText(file.type) || isWord(file.type, file.name)) && (
                                                <button
                                                    onClick={() => setPreviewFile(file)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Anteprima"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                            <a
                                                href={file.url}
                                                download={file.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Scarica"
                                            >
                                                <Download size={18} />
                                            </a>
                                            <button
                                                onClick={() => handleShareFile(file)}
                                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                                title="Condividi"
                                            >
                                                <Share2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFile(file)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Elimina"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        {/* Mobile visible action (fallback) */}
                                        <div className="md:hidden flex items-center justify-end gap-2 group-hover:hidden">
                                            <ExternalLink size={14} className="text-slate-300" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Upload size={48} className="mb-4 text-slate-200" />
                                        <p className="font-medium">Nessun file caricato</p>
                                        <p className="text-sm mt-1">Trascina qui i file o usa il pulsante "Carica File"</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-3">
                                {getFileIcon(previewFile.type)}
                                <div>
                                    <h3 className="font-bold text-slate-800 line-clamp-1">{previewFile.name}</h3>
                                    <p className="text-xs text-slate-500">{formatBytes(previewFile.size)} • {new Date(previewFile.created_at).toLocaleDateString('it-IT')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleShareFile(previewFile)}
                                    className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                    title="Condividi"
                                >
                                    <Share2 size={20} />
                                </button>
                                <a
                                    href={previewFile.url}
                                    download={previewFile.name}
                                    className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                                    title="Download"
                                >
                                    <Download size={20} />
                                </a>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="p-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-800 transition-colors ml-2"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-800 flex items-center justify-center overflow-hidden relative">
                            {isImage(previewFile.type) ? (
                                <img
                                    src={previewFile.url}
                                    alt={previewFile.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : isPdf(previewFile.type) ? (
                                <div className="w-full h-full bg-white flex flex-col">
                                    <iframe
                                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFile.url)}&embedded=true`}
                                        className="w-full h-full border-none"
                                        title="PDF Preview"
                                    />
                                    {/* Fallback link sottile nel caso Google Viewer impieghi troppo a caricare */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/50 text-white px-3 py-1 rounded-full text-[10px] backdrop-blur-sm">
                                        Problemi di visualizzazione? <a href={previewFile.url} target="_blank" rel="noreferrer" className="underline font-bold">Clicca qui</a>
                                    </div>
                                </div>
                            ) : isText(previewFile.type) ? (
                                <div className="w-full h-full bg-white p-6 overflow-auto">
                                    <pre className="text-slate-700 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                                        {/* Usiamo un iframe per il testo caricato da URL per evitare problemi di fetch/cors */}
                                        <iframe
                                            src={previewFile.url}
                                            className="w-full h-full border-none"
                                            title="Text Preview"
                                        />
                                    </pre>
                                </div>
                            ) : isWord(previewFile.type, previewFile.name) ? (
                                <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="bg-white p-12 rounded-2xl shadow-xl max-w-md w-full">
                                        <FileText size={64} className="text-blue-600 mx-auto mb-6" />
                                        <h4 className="text-xl font-bold text-slate-800 mb-2">Documento Word</h4>
                                        <p className="text-slate-500 mb-8 text-sm">Per visualizzare i file Word con la massima fedeltà, ti consigliamo di scaricarli o aprirli con Microsoft Office Online.</p>
                                        <div className="flex flex-col gap-3">
                                            <a
                                                href={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(previewFile.url)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                                            >
                                                <ExternalLink size={18} />
                                                Visualizza con Office Online
                                            </a>
                                            <a
                                                href={previewFile.url}
                                                download={previewFile.name}
                                                className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Download size={18} />
                                                Scarica File
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-white p-12">
                                    <AlertCircle size={48} className="mx-auto mb-4 text-slate-500" />
                                    <p className="text-xl font-bold">Anteprima non disponibile</p>
                                    <p className="text-slate-400 mt-2">Questo tipo di file ({previewFile.type}) non può essere visualizzato direttamente.</p>
                                    <button
                                        onClick={() => window.open(previewFile.url, '_blank')}
                                        className="mt-6 bg-white text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-slate-100 transition-all"
                                    >
                                        Apri in una nuova scheda
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectFiles;
