import { Invoice, Quote, Client } from '../types';

const STORAGE_KEYS = {
    INVOICES: 'edilsmart_invoices',
    QUOTES: 'edilsmart_quotes',
    CLIENTS: 'edilsmart_clients',
    INVOICE_COUNTER: 'edilsmart_invoice_counter',
    QUOTE_COUNTER: 'edilsmart_quote_counter',
};

// Funzioni per localStorage
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        return defaultValue;
    }
};

export const saveToStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
    }
};

// Generazione numeri progressivi
export const generateInvoiceNumber = (type: 'emessa' | 'ricevuta'): string => {
    const year = new Date().getFullYear();
    const counter = loadFromStorage(STORAGE_KEYS.INVOICE_COUNTER, 0) + 1;
    saveToStorage(STORAGE_KEYS.INVOICE_COUNTER, counter);
    const prefix = type === 'emessa' ? 'FT' : 'FR';
    return `${prefix}-${year}-${String(counter).padStart(3, '0')}`;
};

export const generateQuoteNumber = (): string => {
    const year = new Date().getFullYear();
    const counter = loadFromStorage(STORAGE_KEYS.QUOTE_COUNTER, 0) + 1;
    saveToStorage(STORAGE_KEYS.QUOTE_COUNTER, counter);
    return `PRV-${year}-${String(counter).padStart(3, '0')}`;
};

// CRUD Fatture
export const loadInvoices = (): Invoice[] => {
    return loadFromStorage<Invoice[]>(STORAGE_KEYS.INVOICES, []);
};

export const saveInvoices = (invoices: Invoice[]): void => {
    saveToStorage(STORAGE_KEYS.INVOICES, invoices);
};

export const addInvoice = (invoice: Invoice): Invoice[] => {
    const invoices = loadInvoices();
    const newInvoices = [invoice, ...invoices];
    saveInvoices(newInvoices);
    return newInvoices;
};

export const updateInvoice = (id: string, updatedInvoice: Invoice): Invoice[] => {
    const invoices = loadInvoices();
    const newInvoices = invoices.map(inv => inv.id === id ? updatedInvoice : inv);
    saveInvoices(newInvoices);
    return newInvoices;
};

export const deleteInvoice = (id: string): Invoice[] => {
    const invoices = loadInvoices();
    const newInvoices = invoices.filter(inv => inv.id !== id);
    saveInvoices(newInvoices);
    return newInvoices;
};

// CRUD Preventivi
export const loadQuotes = (): Quote[] => {
    return loadFromStorage<Quote[]>(STORAGE_KEYS.QUOTES, []);
};

export const saveQuotes = (quotes: Quote[]): void => {
    saveToStorage(STORAGE_KEYS.QUOTES, quotes);
};

export const addQuote = (quote: Quote): Quote[] => {
    const quotes = loadQuotes();
    const newQuotes = [quote, ...quotes];
    saveQuotes(newQuotes);
    return newQuotes;
};

export const updateQuote = (id: string, updatedQuote: Quote): Quote[] => {
    const quotes = loadQuotes();
    const newQuotes = quotes.map(q => q.id === id ? updatedQuote : q);
    saveQuotes(newQuotes);
    return newQuotes;
};

export const deleteQuote = (id: string): Quote[] => {
    const quotes = loadQuotes();
    const newQuotes = quotes.filter(q => q.id !== id);
    saveQuotes(newQuotes);
    return newQuotes;
};

// CRUD Clienti
export const loadClients = (): Client[] => {
    return loadFromStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
};

export const saveClients = (clients: Client[]): void => {
    saveToStorage(STORAGE_KEYS.CLIENTS, clients);
};

export const addClient = (client: Client): Client[] => {
    const clients = loadClients();
    const newClients = [client, ...clients];
    saveClients(newClients);
    return newClients;
};

export const updateClient = (id: string, updatedClient: Client): Client[] => {
    const clients = loadClients();
    const newClients = clients.map(c => c.id === id ? updatedClient : c);
    saveClients(newClients);
    return newClients;
};

export const deleteClient = (id: string): Client[] => {
    const clients = loadClients();
    const newClients = clients.filter(c => c.id !== id);
    saveClients(newClients);
    return newClients;
};

// Calcoli automatici
export const calculateTotals = (items: { quantity: number; unitPrice: number; discount?: number }[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const discount = item.discount || 0;
        return sum + (itemTotal - (itemTotal * discount / 100));
    }, 0);

    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
    };
};

// Inizializzazione dati demo (solo se localStorage è vuoto)
export const initializeDemoData = (): void => {
    const invoices = loadInvoices();
    const quotes = loadQuotes();
    const clients = loadClients();

    if (clients.length === 0) {
        const demoClients: Client[] = [
            {
                id: 'c1',
                name: 'Giuseppe Rossi',
                type: 'Privato',
                fiscalCode: 'RSSGPP70A01H501Z',
                email: 'giuseppe.rossi@email.com',
                phone: '+39 333 9876543',
                address: 'Via Roma 10',
                city: 'Milano',
                postalCode: '20100',
                createdDate: new Date().toISOString(),
            },
            {
                id: 'c2',
                name: 'Condominio Parco',
                type: 'Ente Pubblico',
                vatNumber: 'IT98765432109',
                email: 'amministrazione@condominioparco.it',
                phone: '+39 02 12345678',
                address: 'Piazza Garibaldi 5',
                city: 'Milano',
                postalCode: '20121',
                createdDate: new Date().toISOString(),
            },
        ];
        saveClients(demoClients);
    }

    if (invoices.length === 0) {
        const demoInvoices: Invoice[] = [
            {
                id: '1',
                number: 'FT-2024-001',
                type: 'emessa',
                date: '2024-01-15',
                dueDate: '2024-02-15',
                clientName: 'Giuseppe Rossi',
                clientId: 'c1',
                clientVat: 'IT12345678901',
                items: [
                    { id: 'i1', description: 'Demolizione muratura interna', quantity: 15, unit: 'm²', unitPrice: 45, amount: 675 },
                    { id: 'i2', description: 'Rifacimento intonaco', quantity: 50, unit: 'm²', unitPrice: 28, amount: 1400 },
                ],
                subtotal: 2075,
                taxRate: 10,
                taxAmount: 207.5,
                totalAmount: 2282.5,
                status: 'Emessa',
                linkedToComputo: true,
                projectId: '1',
            },
        ];
        saveInvoices(demoInvoices);
    }

    if (quotes.length === 0) {
        const demoQuotes: Quote[] = [
            {
                id: 'q1',
                number: 'PRV-2024-001',
                date: '2024-01-10',
                validUntil: '2024-02-10',
                clientName: 'Luigi Verdi',
                clientEmail: 'luigi.verdi@email.com',
                clientPhone: '+39 333 1234567',
                title: 'Preventivo Costruzione Box Auto',
                description: 'Preventivo per la costruzione di box auto singolo',
                items: [
                    { id: 'qi1', description: 'Scavi e fondazioni', quantity: 1, unit: 'corpo', unitPrice: 5000, amount: 5000, category: 'Opere Strutturali' },
                    { id: 'qi2', description: 'Murature perimetrali', quantity: 40, unit: 'm²', unitPrice: 85, amount: 3400, category: 'Murature' },
                    { id: 'qi3', description: 'Copertura', quantity: 25, unit: 'm²', unitPrice: 120, amount: 3000, category: 'Coperture' },
                ],
                subtotal: 11400,
                taxRate: 10,
                taxAmount: 1140,
                totalAmount: 12540,
                status: 'Inviato',
                linkedToComputo: true,
                projectId: '3',
            },
        ];
        saveQuotes(demoQuotes);
    }
};
