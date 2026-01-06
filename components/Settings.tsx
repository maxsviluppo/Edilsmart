import React, { useState, useEffect } from 'react';
import { Save, Upload, Building, AlertCircle } from 'lucide-react';

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

    useEffect(() => {
        const saved = localStorage.getItem('company_settings');
        if (saved) {
            try { return setSettings(JSON.parse(saved)); } catch (e) { }
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('company_settings', JSON.stringify(settings));
        // Dispatch event so other components update immediately if listening
        window.dispatchEvent(new Event('company-settings-updated'));
        alert("Impostazioni salvate correttamente!");
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB
                alert("Il file è troppo grande! Max 1MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
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

                    <div className="flex justify-end">
                        <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg flex items-center shadow-lg font-bold transition-transform active:scale-95">
                            <Save size={20} className="mr-2" /> Salva Impostazioni
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
