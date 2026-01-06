
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
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location?: string;
  budget: number;
  status: 'In Corso' | 'Completato' | 'Preventivo' | 'In attesa' | 'Pianificato';
  startDate?: string;
  progress?: number;
  computo?: ComputoRow[];
  expenses?: Expense[];
}

export interface Invoice {
  id: string;
  projectId: string;
  date: string;
  clientName: string;
  items: { description: string; amount: number }[];
  totalAmount: number;
  tax: number;
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
