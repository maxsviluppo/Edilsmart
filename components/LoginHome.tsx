
import React, { useState } from 'react';
import { HardHat, LogIn, ShieldCheck, Construction } from 'lucide-react';

interface LoginHomeProps {
    onLogin: (password: string) => void;
}

const LoginHome: React.FC<LoginHomeProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(password);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-3xl shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 mb-4 ring-4 ring-blue-500/10">
                            <HardHat size={40} className="text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight italic">
                            EDIL<span className="text-blue-500">SMART</span>
                        </h1>
                        <p className="text-slate-400 text-sm mt-2 font-medium">Gestione Professionale Cantieri</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck size={14} />
                                Accesso Riservato
                            </label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Inserisci Password di Accesso"
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 font-medium group-hover:border-slate-600"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <LogIn size={20} />
                            Entra nel Pannello
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-700/50">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900/30 border border-slate-700/30">
                                <Construction size={20} className="text-emerald-500 mb-1" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Database</span>
                                <span className="text-xs font-bold text-slate-300">Connesso</span>
                            </div>
                            <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900/30 border border-slate-700/30">
                                <ShieldCheck size={20} className="text-blue-500 mb-1" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Sicurezza</span>
                                <span className="text-xs font-bold text-slate-300">Attiva</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-6 text-slate-500 text-[10px] font-medium uppercase tracking-widest">
                    &copy; 2026 Edilsmart Professional - Sincronizzazione Real-Time
                </p>
            </div>
        </div>
    );
};

export default LoginHome;
