
export interface ComputoRow {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  category: string;
  // Dimensions for detailed measurement
  dimensions?: {
    par_ug?: number;
    lung?: number;
    larg?: number;
    h_peso?: number;
  };
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string; // Changed to string to support dynamic categories
  status: 'Pagato' | 'In Attesa';
  invoiceNumber?: string;
  paymentType?: 'Acconto' | 'Saldo' | 'Unica Soluzione';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location?: string;
  budget: number;
  status: 'In Corso' | 'Completato' | 'Preventivo' | 'In attesa' | 'Pianificato';
  startDate?: string;
  endDate?: string;
  duration?: number; // Durata in giorni
  description?: string; // Descrizione del progetto
  clientId?: string; // ID del cliente (per collegamento con anagrafica)
  iva?: number;
  progress?: number;
  computo?: ComputoRow[];
  expenses?: Expense[];
  totalExpenses?: number;
  revenue?: number;
}

export interface Invoice {
  id: string;
  number: string; // Numero fattura
  projectId?: string;
  date: string;
  dueDate?: string;
  type: 'emessa' | 'ricevuta'; // Fattura emessa o ricevuta
  clientId?: string;
  clientName: string;
  clientVat?: string;
  clientAddress?: string;
  supplierId?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Bozza' | 'Emessa' | 'Pagata' | 'Scaduta' | 'Annullata';
  paymentMethod?: string;
  notes?: string;
  linkedToComputo?: boolean; // Se collegata al computo metrico
  computoIds?: string[]; // IDs delle righe del computo collegate
  attachment?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  amount: number;
  computoRowId?: string; // Collegamento alla riga del computo
}

export interface Quote {
  id: string;
  number: string;
  date: string;
  validUntil: string;
  projectId?: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  title: string;
  description?: string;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Bozza' | 'Inviato' | 'Accettato' | 'Rifiutato' | 'Scaduto';
  notes?: string;
  linkedToComputo?: boolean;
  computoIds?: string[];
  template?: string; // Template utilizzato
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  amount: number;
  category?: string;
  computoRowId?: string;
}

export interface Client {
  id: string;
  name: string;
  type: 'Privato' | 'Azienda' | 'Ente Pubblico';
  vatNumber?: string;
  fiscalCode?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
  createdDate: string;
}

// Gestione Documentale e Certificazioni
export type DocumentCategory =
  | 'Titoli Abilitativi'
  | 'Documentazione Tecnica'
  | 'Sicurezza sul Lavoro'
  | 'Certificazioni Fine Lavori'
  | 'Gestione Amministrativa';

export type DocumentType =
  // Titoli Abilitativi
  | 'CILA' | 'SCIA' | 'Permesso di Costruire' | 'CILAS'
  // Documentazione Tecnica
  | 'Relazione Tecnica' | 'Relazione Geologica' | 'Progetto Strutturale'
  | 'Relazione Legge 10' | 'Fascicolo Opera'
  // Sicurezza
  | 'PSC' | 'POS' | 'Notifica Preliminare' | 'DURC' | 'Organico Medio Annuo'
  // Certificazioni Fine Lavori
  | 'DiCo Impianti' | 'APE' | 'Collaudo Statico' | 'Agibilità' | 'DOCFA'
  // Gestione Amministrativa
  | 'Giornale Lavori' | 'SAL' | 'Libretto Misure' | 'Registro Contabilità';

export type DocumentStatus = 'Bozza' | 'In Compilazione' | 'Completato' | 'Inviato' | 'Approvato' | 'Scaduto';

export interface DocumentTemplate {
  id: string;
  type: DocumentType;
  category: DocumentCategory;
  name: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  responsibleRole: string; // Chi deve compilarlo
  isRequired: boolean; // Se obbligatorio per legge
  normativeReference?: string; // Riferimento normativo (es. D.P.R. 380/01)
}

export interface Document {
  id: string;
  projectId: string;
  projectName?: string;
  type: DocumentType;
  category: DocumentCategory;
  templateId: string;

  // Metadati
  number?: string; // Numero protocollo/pratica
  status: DocumentStatus;
  createdDate: string;
  lastModified: string;
  expiryDate?: string;
  approvalDate?: string;

  // Responsabili
  createdBy?: string;
  responsiblePerson?: string; // Tecnico/Professionista responsabile
  responsibleCompany?: string;

  // Dati del documento (compilati automaticamente dai dati del progetto)
  data: Record<string, any>;

  // File allegati
  attachments?: DocumentAttachment[];

  // Note e osservazioni
  notes?: string;

  // Riferimenti
  relatedDocuments?: string[]; // ID di altri documenti collegati
}

export interface DocumentAttachment {
  id: string;
  name: string;
  type: string; // pdf, jpg, dwg, etc.
  size: number;
  uploadDate: string;
  url?: string;
}

// Dati specifici per tipi di documento
export interface CILAData {
  interventionType: string;
  startDate: string;
  estimatedDuration: number; // giorni
  estimatedCost: number;
  technician: {
    name: string;
    qualification: string;
    registrationNumber: string;
    pec: string;
  };
  client: {
    name: string;
    fiscalCode: string;
    address: string;
  };
  property: {
    address: string;
    cadastralData: string;
    urbanPlanningZone: string;
  };
  works: {
    description: string;
    affectStructure: boolean;
    affectEnergy: boolean;
  };
}

export interface PSCData {
  coordinator: {
    name: string;
    qualification: string;
    registrationNumber: string;
  };
  worksite: {
    address: string;
    startDate: string;
    estimatedDuration: number;
    estimatedWorkers: number;
    estimatedManDays: number;
  };
  risks: Array<{
    type: string;
    description: string;
    preventionMeasures: string;
    protectionEquipment: string[];
  }>;
  companies: Array<{
    name: string;
    vatNumber: string;
    role: string;
  }>;
}

export interface DiCoData {
  installer: {
    name: string;
    vatNumber: string;
    registrationNumber: string;
  };
  systemType: 'Elettrico' | 'Idraulico' | 'Gas' | 'Climatizzazione' | 'Altro';
  installationDate: string;
  standards: string[]; // Norme rispettate (es. CEI 64-8)
  materials: Array<{
    description: string;
    brand: string;
    certificationMark: string;
  }>;
  tests: Array<{
    type: string;
    result: string;
    date: string;
  }>;
  declarations: {
    conformityToProject: boolean;
    safetyRules: boolean;
    goodWorkmanship: boolean;
  };
}

export interface SALData {
  number: number;
  period: {
    from: string;
    to: string;
  };
  progressPercentage: number;
  worksCompleted: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    amount: number;
  }>;
  totalAmount: number;
  previousAmount: number;
  currentAmount: number;
  retentionPercentage: number;
  retentionAmount: number;
  netAmount: number;
}


export interface Supplier {
  id: string;
  name: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  category?: string;
}

export interface SupplierInvoice {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  description: string;
  status: 'Pagata' | 'In Scadenza' | 'Scaduta' | 'Bozza';
  attachment?: string;
}

export interface PriceListItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  price: number;
  category: string;
  subcategory?: string;
  region: string;
  municipality?: string;
  year: number;
  notes?: string;
  tags?: string[];
}

export interface PriceList {
  id: string;
  name: string;
  region: string;
  municipality?: string;
  year: number;
  source: string;
  importDate: string;
  itemCount: number;
  items: PriceListItem[];
}

export type RegionCode =
  | 'lombardia' | 'emilia-romagna' | 'veneto' | 'lazio' | 'piemonte'
  | 'toscana' | 'campania' | 'sicilia' | 'puglia' | 'calabria'
  | 'sardegna' | 'liguria' | 'marche' | 'abruzzo' | 'friuli-venezia-giulia'
  | 'trentino-alto-adige' | 'umbria' | 'basilicata' | 'molise' | 'valle-daosta';

export interface Region {
  code: RegionCode;
  name: string;
  hasOfficialPriceList: boolean;
  priceListUrl?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
}

export interface PayrollEntry {
  id: string;
  date: string;
  employeeId: string;
  amount?: number;
  hours?: number;
  projectId?: string; // Optional: associated project
  notes?: string;
}
