
import React, { useState } from 'react';
import { HardHat, LogIn, ShieldCheck, Construction, UserPlus, Mail, Lock, Loader2, Eye, EyeOff, Shield } from 'lucide-react';

interface AuthData {
    email: string;
    password?: string;
}

interface LoginHomeProps {
    onAuth: (data: AuthData, type: 'login' | 'register') => Promise<void>;
}

const LoginHome: React.FC<LoginHomeProps> = ({ onAuth }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email || !password) {
            setError('Inserisci email e password.');
            return;
        }

        if (isRegister && password !== confirmPassword) {
            setError('Le password non coincidono.');
            return;
        }

        setIsLoading(true);
        try {
            await onAuth({ email, password }, isRegister ? 'register' : 'login');
        } catch (err: any) {
            setError(err.message || 'Si è verificato un errore.');
        } finally {
            setIsLoading(false);
        }
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
                        <p className="text-slate-400 text-sm mt-2 font-medium">
                            {isRegister ? 'Crea il tuo Account' : 'Gestione Professionale Cantieri'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl text-xs font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Mail size={12} />
                                Email Aziendale
                            </label>
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="esempio@azienda.it"
                                className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Lock size={12} />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 font-medium pr-14"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {isRegister && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <ShieldCheck size={12} />
                                    Conferma Password
                                </label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-900/50 border border-slate-700 text-white px-5 py-3.5 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 font-medium"
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
                        >
                            {isLoading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : isRegister ? (
                                <>
                                    <UserPlus size={20} />
                                    Registrati Ora
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Accedi al Pannello
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsRegister(!isRegister);
                                setError(null);
                            }}
                            className="text-slate-400 hover:text-white text-xs font-bold transition-colors"
                        >
                            {isRegister
                                ? 'Hai già un account? Accedi'
                                : 'Non hai un account? Registrati qui'}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col items-center">
                        <button
                            onClick={() => {
                                setEmail('admin');
                                setPassword('accessometti');
                            }}
                            className="p-4 bg-slate-900/30 border border-slate-700/30 text-slate-500 hover:text-blue-500 hover:border-blue-500/50 rounded-2xl transition-all shadow-xl group border-dashed mb-4"
                            title="Accesso Amministrazione"
                        >
                            <Shield size={24} className="group-hover:scale-110 transition-transform" />
                        </button>

                        <div className="flex flex-col items-center gap-1">
                            <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] opacity-40">
                                &copy; 2026 Edilsmart Professional
                            </p>
                            <p className="text-slate-700 text-[8px] font-bold uppercase tracking-widest opacity-30">
                                Sincronizzazione Real-Time Edition
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginHome;
