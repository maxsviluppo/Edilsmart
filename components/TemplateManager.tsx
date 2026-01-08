import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Eye, Download, Plus, X, CheckCircle } from 'lucide-react';
import { DocumentType } from '../types';
import Toast, { ToastType } from './Toast';
import ConfirmModal from './ConfirmModal';

export interface CustomTemplate {
    id: string;
    documentType: DocumentType;
    name: string;
    fileName: string;
    fileContent: string; // Base64 o HTML
    fileType: 'pdf' | 'docx' | 'html';
    uploadDate: string;
    description?: string;
}

const TemplateManager: React.FC = () => {
    const [templates, setTemplates] = useState<CustomTemplate[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<CustomTemplate | null>(null);
    const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; templateId: string | null }>({
        isOpen: false,
        templateId: null
    });

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = () => {
        const stored = localStorage.getItem('custom_document_templates');
        if (stored) {
            setTemplates(JSON.parse(stored));
        }
    };

    const saveTemplates = (newTemplates: CustomTemplate[]) => {
        localStorage.setItem('custom_document_templates', JSON.stringify(newTemplates));
        setTemplates(newTemplates);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Verifica tipo file
            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html'];
            if (!allowedTypes.includes(file.type)) {
                setToast({ message: 'Tipo file non supportato. Usa PDF, DOCX o HTML', type: 'error' });
                return;
            }

            // Verifica dimensione (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setToast({ message: 'File troppo grande. Massimo 5MB', type: 'error' });
                return;
            }

            setUploadedFile(file);
        }
    };

    const handleSaveTemplate = async () => {
        if (!selectedType || !templateName || !uploadedFile) {
            setToast({ message: 'Compila tutti i campi obbligatori', type: 'warning' });
            return;
        }

        try {
            // Converti file in base64
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target?.result as string;

                const fileType = uploadedFile.type.includes('pdf') ? 'pdf'
                    : uploadedFile.type.includes('word') ? 'docx'
                        : 'html';

                const newTemplate: CustomTemplate = {
                    id: `tpl-${Date.now()}`,
                    documentType: selectedType as DocumentType,
                    name: templateName,
                    fileName: uploadedFile.name,
                    fileContent,
                    fileType,
                    uploadDate: new Date().toISOString(),
                    description: templateDescription
                };

                const updated = [...templates, newTemplate];
                saveTemplates(updated);

                setToast({ message: 'Template caricato con successo!', type: 'success' });
                resetForm();
            };

            reader.readAsDataURL(uploadedFile);
        } catch (error) {
            setToast({ message: 'Errore durante il caricamento', type: 'error' });
        }
    };

    const handleDeleteTemplate = (id: string) => {
        setConfirmDelete({ isOpen: true, templateId: id });
    };

    const confirmDeleteTemplate = () => {
        if (confirmDelete.templateId) {
            const updated = templates.filter(t => t.id !== confirmDelete.templateId);
            saveTemplates(updated);
            setToast({ message: 'Template eliminato', type: 'success' });
        }
        setConfirmDelete({ isOpen: false, templateId: null });
    };

    const resetForm = () => {
        setShowUploadModal(false);
        setSelectedType('');
        setTemplateName('');
        setTemplateDescription('');
        setUploadedFile(null);
    };

    const documentTypes: DocumentType[] = [
        'CILA', 'SCIA', 'Permesso di Costruire', 'CILAS',
        'PSC', 'POS', 'Notifica Preliminare', 'DURC',
        'DiCo Impianti', 'APE', 'Collaudo Statico', 'Agibilità',
        'SAL', 'Giornale Lavori'
    ];

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return '📄';
            case 'docx': return '📝';
            case 'html': return '🌐';
            default: return '📁';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Gestione Template Documenti</h2>
                    <p className="text-slate-600 mt-1">
                        Carica i modelli ufficiali dei documenti (CILA, PSC, ecc.) dal tuo comune o ente
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        Carica Template
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Come funziona</h3>
                        <p className="text-sm text-blue-700">
                            Carica i modelli ufficiali dei documenti in formato PDF, DOCX o HTML.
                            Il sistema li userà come base per generare i documenti compilati con i dati del progetto.
                            Puoi scaricare i modelli ufficiali dal sito del tuo comune o ente competente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Lista Template */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">Template Caricati ({templates.length})</h3>
                </div>

                {templates.length === 0 ? (
                    <div className="text-center py-12">
                        <Upload className="mx-auto text-slate-300 mb-3" size={48} />
                        <p className="text-slate-500 font-medium">Nessun template caricato</p>
                        <p className="text-slate-400 text-sm mt-1">Carica il primo template per iniziare</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {templates.map((template) => (
                            <div key={template.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="text-4xl">{getFileIcon(template.fileType)}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-slate-900">{template.name}</h4>
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                                                    {template.documentType}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-2">
                                                {template.description || 'Nessuna descrizione'}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <span>📁 {template.fileName}</span>
                                                <span>📅 {new Date(template.uploadDate).toLocaleDateString('it-IT')}</span>
                                                <span className="uppercase font-semibold">{template.fileType}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setPreviewTemplate(template);
                                                setShowPreviewModal(true);
                                            }}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-600 transition-colors"
                                            title="Anteprima"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Download template
                                                const link = document.createElement('a');
                                                link.href = template.fileContent;
                                                link.download = template.fileName;
                                                link.click();
                                            }}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-blue-600 transition-colors"
                                            title="Scarica"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTemplate(template.id)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-red-600 transition-colors"
                                            title="Elimina"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Upload */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <Upload size={24} />
                                <h2 className="text-2xl font-bold">Carica Nuovo Template</h2>
                            </div>
                            <button
                                onClick={resetForm}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Tipo Documento *
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value as DocumentType)}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Seleziona tipo documento...</option>
                                    {documentTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nome Template *
                                </label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Es. CILA Comune di Milano 2024"
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Descrizione (opzionale)
                                </label>
                                <textarea
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Aggiungi note sul template, versione, ente emittente..."
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    File Template * (PDF, DOCX, HTML - Max 5MB)
                                </label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.html"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="template-upload"
                                    />
                                    <label
                                        htmlFor="template-upload"
                                        className="cursor-pointer flex flex-col items-center gap-2"
                                    >
                                        {uploadedFile ? (
                                            <>
                                                <CheckCircle className="text-emerald-600" size={32} />
                                                <p className="font-semibold text-slate-900">{uploadedFile.name}</p>
                                                <p className="text-sm text-slate-600">
                                                    {(uploadedFile.size / 1024).toFixed(2)} KB
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="text-slate-400" size={32} />
                                                <p className="font-semibold text-slate-700">Clicca per caricare</p>
                                                <p className="text-sm text-slate-500">o trascina il file qui</p>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={resetForm}
                                className="px-6 py-2.5 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                disabled={!selectedType || !templateName || !uploadedFile}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Upload size={18} />
                                Carica Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Preview */}
            {showPreviewModal && previewTemplate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Eye size={24} />
                                <div>
                                    <h2 className="text-2xl font-bold">Anteprima Template</h2>
                                    <p className="text-emerald-100 text-sm mt-1">
                                        {previewTemplate.name} - {previewTemplate.documentType}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPreviewModal(false);
                                    setPreviewTemplate(null);
                                }}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            {previewTemplate.fileType === 'pdf' ? (
                                <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
                                    <iframe
                                        src={previewTemplate.fileContent}
                                        className="w-full h-[600px] border-0 rounded"
                                        title="PDF Preview"
                                    />
                                </div>
                            ) : previewTemplate.fileType === 'html' ? (
                                <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto">
                                    <iframe
                                        srcDoc={atob(previewTemplate.fileContent.split(',')[1] || '')}
                                        className="w-full h-[600px] border-0 rounded"
                                        title="HTML Preview"
                                    />
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl mx-auto text-center">
                                    <div className="text-6xl mb-4">📝</div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                                        File DOCX
                                    </h3>
                                    <p className="text-slate-600 mb-4">
                                        L'anteprima diretta dei file Word non è disponibile nel browser.
                                    </p>
                                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-slate-700">
                                            <strong>Nome file:</strong> {previewTemplate.fileName}
                                        </p>
                                        <p className="text-sm text-slate-700 mt-2">
                                            <strong>Tipo documento:</strong> {previewTemplate.documentType}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = previewTemplate.fileContent;
                                            link.download = previewTemplate.fileName;
                                            link.click();
                                        }}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg flex items-center gap-2 mx-auto"
                                    >
                                        <Download size={18} />
                                        Scarica per Visualizzare
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirm Delete */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Elimina Template"
                message="Sei sicuro di voler eliminare questo template? I documenti già creati non saranno modificati."
                confirmText="Elimina"
                cancelText="Annulla"
                type="danger"
                onConfirm={confirmDeleteTemplate}
                onCancel={() => setConfirmDelete({ isOpen: false, templateId: null })}
            />
        </div>
    );
};

export default TemplateManager;
