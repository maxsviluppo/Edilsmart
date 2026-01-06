
export interface ComputoRow {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  total: number;
  category: string;
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
  location: string;
  budget: number;
  status: 'In Corso' | 'Completato' | 'Preventivo';
  computo: ComputoRow[];
  expenses: Expense[];
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
