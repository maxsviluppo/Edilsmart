import React, { useState, useEffect } from 'react';
import { Save, Upload, Building, AlertCircle } from 'lucide-react';
import Toast, { ToastType } from './Toast';
import ConfirmModal from './ConfirmModal';

export interface CompanySettings {
    name: string;
    address: string;
    vat: string;
    email: string;
    phone: string;
    logoUrl: string;
}

const Settings: React.FC = () => {
    const [settings, setSettings] = useState<CompanySettings>({
        name: '',
        address: '',
        vat: '',
        email: '',
        phone: '',
        logoUrl: ''
    });

    const [unitMeasurements, setUnitMeasurements] = useState<string[]>([
        'M', 'M2', 'M3', 'ML', 'A CORPO', 'Cad.UNO'
    ]);
    const [newUnit, setNewUnit] = useState('');

    const [accountingCategories, setAccountingCategories] = useState<string[]>([
        'Materiali', 'Ricavi', 'Manodopera', 'Noleggi', 'Trasporti', 'Materiali Speciali', 'Altro'
    ]);
    const [newCategory, setNewCategory] = useState('');

    const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
    const [deletingUnit, setDeletingUnit] = useState<string | null>(null);

    // Toast & Modal State
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmModalState, setConfirmModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'danger' | 'warning' | 'info';
        confirmText?: string;
        onConfirm: () => void;
        onCancel: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { }
    });

    useEffect(() => {
        const saved = localStorage.getItem('company_settings');
        if (saved) {
            try { setSettings(JSON.parse(saved)); } catch (e) { }
        }

        const savedUnits = localStorage.getItem('unit_measurements');
        if (savedUnits) {
            try { setUnitMeasurements(JSON.parse(savedUnits)); } catch (e) { }
        }

        const savedCategories = localStorage.getItem('accounting_categories');
        if (savedCategories) {
            try { setAccountingCategories(JSON.parse(savedCategories)); } catch (e) { }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('company_settings', JSON.stringify(settings));
        localStorage.setItem('unit_measurements', JSON.stringify(unitMeasurements));
        localStorage.setItem('accounting_categories', JSON.stringify(accountingCategories));
        // Dispatch event so other components update immediately if listening
        window.dispatchEvent(new Event('company-settings-updated'));
        setToast({ message: "Impostazioni salvate correttamente!", type: 'success' });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB
                setToast({ message: "Il file è troppo grande! Max 1MB.", type: 'error' });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                setToast({ message: "Logo aggiornato correttamente!", type: 'success' });
            };
            reader.readAsDataURL(file);
        }
    };

    const addUnitMeasurement = () => {
        if (!newUnit.trim()) return;
        if (unitMeasurements.includes(newUnit.trim())) {
            setToast({ message: "Questa unità di misura esiste già!", type: 'error' });
            return;
        }
        setUnitMeasurements([...unitMeasurements, newUnit.trim()]);
        setNewUnit('');
    };

    const deleteUnitMeasurement = (unit: string) => {
        setUnitMeasurements(unitMeasurements.filter(u => u !== unit));
        setDeletingUnit(null);
    };

    const addAccountingCategory = () => {
        if (!newCategory.trim()) return;
        if (accountingCategories.includes(newCategory.trim())) {
            setToast({ message: "Questa categoria esiste già!", type: 'error' });
            return;
        }
        setAccountingCategories([...accountingCategories, newCategory.trim()]);
        setNewCategory('');
    };

    const deleteAccountingCategory = (category: string) => {
        setAccountingCategories(accountingCategories.filter(c => c !== category));
        setDeletingCategory(null);
    };

    const editAccountingCategory = (oldCategory: string, newName: string) => {
        if (!newName.trim() || newName === oldCategory) return;
        if (accountingCategories.includes(newName.trim())) {
            setToast({ message: "Questa categoria esiste già!", type: 'error' });
            return;
        }
        setAccountingCategories(accountingCategories.map(c => c === oldCategory ? newName.trim() : c));
    };

    const editUnitMeasurement = (oldUnit: string) => {
        const newValue = prompt(`Modifica unità di misura:`, oldUnit);
        if (newValue && newValue.trim() && newValue !== oldUnit) {
            setUnitMeasurements(unitMeasurements.map(u => u === oldUnit ? newValue.trim() : u));
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Impostazioni Azienda</h1>
                <p className="text-slate-500">Configura i dati che appariranno nelle stampe e nei documenti.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Logo */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-4">Logo Aziendale</label>

                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 bg-slate-50 hover:bg-slate-100 transition-colors relative">
                            {settings.logoUrl ? (
                                <div className="relative group w-full flex justify-center">
                                    <img src={settings.logoUrl} alt="Logo Anteprima" className="max-h-32 object-contain" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                                        <span className="text-white text-xs font-bold">Cambia Logo</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Upload size={48} className="mx-auto mb-2" />
                                    <span className="text-xs">Clicca per caricare</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleLogoUpload}
                            />
                        </div>

                        <div className="mt-4 text-xs text-slate-500 bg-blue-50 p-3 rounded border border-blue-100">
                            <div className="flex items-center font-bold text-blue-700 mb-1">
                                <AlertCircle size={14} className="mr-1" /> Requisiti Logo:
                            </div>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Formato: <strong>PNG</strong> (consigliato trasparente) o JPG</li>
                                <li>Dimensioni ideali: <strong>300x100 px</strong></li>
                                <li>Peso massimo: <strong>1 MB</strong></li>
                                <li>Rapporto: Rettangolare orizzontale</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center mb-2">
                            <Building className="text-emerald-600 mr-2" size={20} />
                            <h3 className="font-bold text-slate-800">Anagrafica Azienda</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Ragione Sociale / Nome</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={settings.name}
                                    onChange={e => setSettings({ ...settings, name: e.target.value })}
                                    placeholder="Es. EdilSmart Costruzioni Srl"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Indirizzo Sede</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={settings.address}
                                    onChange={e => setSettings({ ...settings, address: e.target.value })}
                                    placeholder="Via Roma 10, 00100 Roma (RM)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">P.IVA / Cod. Fiscale</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={settings.vat}
                                    onChange={e => setSettings({ ...settings, vat: e.target.value })}
                                    placeholder="IT01234567890"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Telefono</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={settings.phone}
                                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                    placeholder="+39 06 123456"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-600 mb-1">Email Contatto</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                                    value={settings.email}
                                    onChange={e => setSettings({ ...settings, email: e.target.value })}
                                    placeholder="info@edilsmart.it"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Unit Measurements Section */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center mb-2">
                            <Building className="text-emerald-600 mr-2" size={20} />
                            <h3 className="font-bold text-slate-800">Unità di Misura</h3>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">Gestisci le unità di misura disponibili nel Computo Metrico.</p>

                        {/* Add New Unit */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                                placeholder="Es. KG, L, PZ..."
                                value={newUnit}
                                onChange={e => setNewUnit(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && addUnitMeasurement()}
                            />
                            <button
                                onClick={addUnitMeasurement}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-bold transition-colors"
                            >
                                Aggiungi
                            </button>
                        </div>

                        {/* Units List */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                            {unitMeasurements.map((unit, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2 group hover:bg-slate-100 transition-colors">
                                    <span className="font-mono text-sm font-bold text-slate-700">{unit}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => editUnitMeasurement(unit)}
                                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                                            title="Modifica"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => setDeletingUnit(unit)}
                                            className="text-rose-600 hover:text-rose-800 text-xs px-2 py-1"
                                            title="Elimina"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accounting Categories Section */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Categorie Contabilità
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Gestisci le categorie per classificare le spese e i ricavi del cantiere.
                        </p>

                        {/* Add Category Input */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm capitalize"
                                placeholder="Es. Consulenze, Oneri Discarica..."
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && addAccountingCategory()}
                            />
                            <button
                                onClick={addAccountingCategory}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-bold transition-colors"
                            >
                                Aggiungi
                            </button>
                        </div>

                        {/* Categories List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                            {accountingCategories.map((category, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-3 py-2 group hover:bg-slate-100 transition-colors">
                                    <span className="text-sm font-semibold text-slate-700">{category}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                const newName = prompt(`Modifica categoria:`, category);
                                                if (newName) editAccountingCategory(category, newName);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                                            title="Modifica"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => setDeletingCategory(category)}
                                            className="text-rose-600 hover:text-rose-800 text-xs px-2 py-1"
                                            title="Elimina"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg flex items-center shadow-lg font-bold transition-transform active:scale-95">
                            <Save size={20} className="mr-2" /> Salva Impostazioni
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Unit Modal */}
            {deletingUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-rose-600 px-6 py-4 flex items-center gap-3 text-white">
                            <AlertCircle size={28} />
                            <h3 className="text-xl font-bold">Conferma Eliminazione</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700 mb-2">
                                Stai per eliminare l'unità di misura:
                            </p>
                            <p className="text-lg font-bold text-slate-900 mb-4">
                                "{deletingUnit}"
                            </p>
                            <p className="text-sm text-slate-600 mb-6">
                                Questa azione non può essere annullata.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => deleteUnitMeasurement(deletingUnit)}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Sì, Elimina
                                </button>
                                <button
                                    onClick={() => setDeletingUnit(null)}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Category Modal */}
            {deletingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-rose-600 px-6 py-4 flex items-center gap-3 text-white">
                            <AlertCircle size={28} />
                            <h3 className="text-xl font-bold">Conferma Eliminazione</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-700 mb-2">
                                Stai per eliminare la categoria:
                            </p>
                            <p className="text-lg font-bold text-slate-900 mb-4">
                                "{deletingCategory}"
                            </p>
                            <p className="text-sm text-slate-600 mb-6">
                                Questa azione non può essere annullata.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => deleteAccountingCategory(deletingCategory)}
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Sì, Elimina
                                </button>
                                <button
                                    onClick={() => setDeletingCategory(null)}
                                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-3 rounded-lg font-bold transition-colors"
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Factory Reset Section */}
            <div className="border-t border-slate-200 pt-8 mt-12 bg-rose-50 rounded-xl p-8 border-rose-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xl font-bold text-rose-700 flex items-center gap-2">
                            <AlertCircle size={24} />
                            Zona Pericolo: Reset Completo
                        </h3>
                        <p className="text-rose-600 mt-2 max-w-xl">
                            Questa operazione cancellerà <strong>TUTTI i dati</strong> salvati sul dispositivo: progetti, impostazioni, loghi, categorie, contabilità, paghe, ecc. <br />
                            L'app verrà ripristinata allo stato iniziale come appena installata.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setConfirmModalState({
                                isOpen: true,
                                title: "Reset di Fabbrica",
                                message: "SEI SICURO? Questa operazione cancellerà PER SEMPRE tutti i dati dell'applicazione. Non potrai annullare questa azione!",
                                type: 'danger',
                                onConfirm: () => {
                                    // Double confirmation for safety
                                    setConfirmModalState({
                                        isOpen: true,
                                        title: "NON SI TORNA INDIETRO",
                                        message: "CONFERMA FINALE: Sei davvero sicuro di voler azzerare TUTTO?",
                                        type: 'danger',
                                        confirmText: 'SÌ, CANCELLA TUTTO',
                                        onConfirm: () => {
                                            localStorage.clear();
                                            setToast({ message: "Reset completato! Riavvio in corso...", type: 'success' });
                                            setConfirmModalState(prev => ({ ...prev, isOpen: false }));
                                            setTimeout(() => window.location.reload(), 2000);
                                        },
                                        onCancel: () => setConfirmModalState(prev => ({ ...prev, isOpen: false }))
                                    });
                                },
                                onCancel: () => setConfirmModalState(prev => ({ ...prev, isOpen: false }))
                            });
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-4 rounded-lg font-bold shadow-lg shadow-rose-900/20 active:scale-95 transition-all w-full md:w-auto text-center"
                    >
                        AZZERA TUTTI I DATI
                    </button>
                    <button
                        onClick={() => {
                            setConfirmModalState({
                                isOpen: true,
                                title: "Caricamento Dati Demo",
                                message: "Vuoi caricare i dati demo di esempio? Questo sovrascriverà i dati attuali se presenti.",
                                type: 'info',
                                confirmText: "Carica Demo",
                                onConfirm: () => {
                                    const demoProjects = [
                                        { id: '1', name: 'Ristrutturazione Villa Rossi', client: 'Giuseppe Rossi', status: 'In Corso', budget: 150000, startDate: '2024-01-15', endDate: '2024-12-31', iva: 10, progress: 45, location: 'Via Roma 10', totalExpenses: 65000, revenue: 150000 },
                                        { id: '2', name: 'Rifacimento Facciata Condominio', client: 'Amm. Bianchi', status: 'In attesa', budget: 85000, startDate: '2024-03-01', endDate: '2024-09-30', iva: 20, progress: 0, location: 'Piazza Garibaldi 2', totalExpenses: 5000, revenue: 85000 },
                                        { id: '3', name: 'Nuova Costruzione Box Auto', client: 'Luigi Verdi', status: 'Pianificato', budget: 35000, startDate: '2024-04-10', endDate: '2024-08-15', iva: 10, progress: 0, totalExpenses: 0, revenue: 35000 },
                                        { id: '4', name: 'Manutenzione Straordinaria Tetto', client: 'Condominio Parco', status: 'Completato', budget: 28000, startDate: '2023-11-05', endDate: '2024-02-20', iva: 20, progress: 100, totalExpenses: 22000, revenue: 28000 },
                                    ];
                                    localStorage.setItem('projects', JSON.stringify(demoProjects));
                                    localStorage.setItem('company_settings', JSON.stringify({
                                        name: 'EdilSmart Demo SRL',
                                        address: 'Via Esempio 123, Milano',
                                        vat: '12345678901',
                                        email: 'demo@edilsmart.it',
                                        phone: '02 1234567',
                                        logoUrl: ''
                                    }));
                                    setToast({ message: "Dati demo caricati con successo!", type: 'success' });
                                    setConfirmModalState(prev => ({ ...prev, isOpen: false }));
                                    setTimeout(() => window.location.reload(), 1500);
                                },
                                onCancel: () => setConfirmModalState(prev => ({ ...prev, isOpen: false }))
                            });
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all w-full md:w-auto text-center mt-4 md:mt-0"
                    >
                        CARICA DATI DEMO
                    </button>
                </div>
            </div>

            {/* Global Components */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <ConfirmModal
                isOpen={confirmModalState.isOpen}
                title={confirmModalState.title}
                message={confirmModalState.message}
                type={confirmModalState.type as any}
                confirmText={confirmModalState.confirmText}
                onConfirm={confirmModalState.onConfirm}
                onCancel={confirmModalState.onCancel}
            />
        </div>
    );
};

export default Settings;
