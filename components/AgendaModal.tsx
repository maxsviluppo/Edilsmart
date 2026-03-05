import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';

export interface AgendaEvent {
    id: string;
    date: string;
    title: string;
    description: string;
}

interface AgendaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AgendaModal: React.FC<AgendaModalProps> = ({ isOpen, onClose }) => {
    const [events, setEvents] = useState<AgendaEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDesc, setNewEventDesc] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('edilsmart_agenda');
        if (saved) {
            try {
                setEvents(JSON.parse(saved));
            } catch (e) { }
        }
    }, [isOpen]);

    const saveEvents = (newEvents: AgendaEvent[]) => {
        setEvents(newEvents);
        localStorage.setItem('edilsmart_agenda', JSON.stringify(newEvents));
        window.dispatchEvent(new Event('agenda-updated'));
    };

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventTitle.trim()) return;

        const newEvent: AgendaEvent = {
            id: Math.random().toString(36).substr(2, 9),
            date: selectedDate,
            title: newEventTitle,
            description: newEventDesc
        };

        saveEvents([...events, newEvent]);
        setNewEventTitle('');
        setNewEventDesc('');
    };

    const handleDeleteEvent = (id: string) => {
        saveEvents(events.filter(e => e.id !== id));
    };

    const eventsForSelectedDate = events.filter(e => e.date === selectedDate);
    const today = new Date();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
                {/* Left: Calendar Picker */}
                <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                            <CalendarIcon size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Agenda</h2>
                    </div>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 outline-none"
                    />

                    <div className="mt-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Prossimi Eventi</h3>
                        <div className="space-y-3">
                            {events.filter(e => e.date >= today.toISOString().split('T')[0])
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .slice(0, 5)
                                .map(e => (
                                    <div key={e.id} onClick={() => setSelectedDate(e.date)} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-all">
                                        <div className="text-xs font-bold text-indigo-600 mb-1">{new Date(e.date).toLocaleDateString('it-IT')}</div>
                                        <div className="text-sm font-bold text-slate-700 truncate">{e.title}</div>
                                    </div>
                                ))}
                            {events.filter(e => e.date >= today.toISOString().split('T')[0]).length === 0 && (
                                <p className="text-slate-400 text-sm italic">Nessun evento futuro.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Day Events */}
                <div className="w-full md:w-2/3 flex flex-col bg-white">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-2xl font-black text-slate-800 capitalize">
                            {new Date(selectedDate).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-800">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        <div className="space-y-4">
                            {eventsForSelectedDate.length > 0 ? (
                                eventsForSelectedDate.map(e => (
                                    <div key={e.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between group">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{e.title}</h4>
                                            {e.description && <p className="text-slate-500 text-sm mt-1">{e.description}</p>}
                                        </div>
                                        <button onClick={() => handleDeleteEvent(e.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 font-medium text-lg">Nessun evento per questa data</p>
                                    <p className="text-slate-400 text-sm mt-2">Aggiungi un promemoria qui sotto</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white">
                        <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
                            <input
                                type="text"
                                placeholder="Oggetto dell'evento / Promemoria"
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 placeholder:text-slate-400"
                            />
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Note opzionali (es. orario o dettagli)..."
                                    value={newEventDesc}
                                    onChange={(e) => setNewEventDesc(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-600"
                                />
                                <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md shadow-indigo-200 transition-all active:scale-95">
                                    <Plus size={18} />
                                    Salva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgendaModal;
