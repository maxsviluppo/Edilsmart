
import React, { useState, useEffect } from 'react';
import {
    Users,
    ShieldAlert,
    Ban,
    CheckCircle,
    Search,
    Activity,
    Trash2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    status: string;
    subscription_status: string;
    created_at: string;
}

const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Errore nel caricamento utenti:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStatus = async (user: UserProfile) => {
        const newStatus = user.status === 'active' ? 'blocked' : 'active';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', user.id);

            if (error) throw error;
            setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        } catch (error) {
            alert("Errore nell'aggiornamento stato user");
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        blocked: users.filter(u => u.status === 'blocked').length
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Admin Header */}
            <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldAlert size={120} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black italic tracking-tight uppercase">EDILSMART<span className="text-blue-500">AI</span> Monitor</h2>
                    <p className="text-slate-400 mt-2 font-medium">Pannello Controllo Utenti Iscritti</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Totale Iscritti</p>
                        <p className="text-2xl font-black mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Utenti Attivi</p>
                        <p className="text-2xl font-black mt-1 text-emerald-400">{stats.active}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Bloccati</p>
                        <p className="text-2xl font-black mt-1 text-rose-400">{stats.blocked}</p>
                    </div>
                </div>
            </div>

            {/* User Management Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg text-white">
                            <Users size={20} />
                        </div>
                        <h3 className="text-xl font-bold">Gestione Utenti</h3>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cerca per email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">Socio / Email</th>
                                <th className="px-6 py-4">Stato Accesso</th>
                                <th className="px-6 py-4">Ruolo</th>
                                <th className="px-6 py-4">Data Iscrizione</th>
                                <th className="px-10 py-4 text-center">Azioni Correttive</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                                        <Activity size={24} className="animate-spin mx-auto mb-2" />
                                        Caricamento database utenti...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                                        Nessun utente trovato nel database.
                                    </td>
                                </tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{user.email}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">{user.role}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${user.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                            : 'bg-rose-50 text-rose-600 border-rose-200'
                                            }`}>
                                            {user.status === 'active' ? 'Attivo' : 'Bloccato'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-2 py-1 rounded">
                                                {user.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`p-2 rounded-lg transition-all ${user.status === 'active'
                                                    ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                title={user.status === 'active' ? 'Blocca Accesso' : 'Riattiva Accesso'}
                                            >
                                                {user.status === 'active' ? <Ban size={18} /> : <CheckCircle size={18} />}
                                            </button>

                                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Elimina Permanentemente">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AdminPanel;
