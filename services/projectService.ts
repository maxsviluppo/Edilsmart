
import { supabase } from './supabaseClient';
import { Project, Expense, Employee, PayrollEntry, Supplier } from '../types';

export const projectService = {
    // --- UTILS ---
    async getCurrentUserId(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id || null;
    },

    // --- PROGETTI ---
    async getProjects(): Promise<Project[]> {
        const userId = await this.getCurrentUserId();

        let query = supabase.from('projects').select('*');

        if (userId) {
            // Filtro essenziale per multi-tenancy a livello di query
            query = query.eq('user_id', userId);
        } else {
            // Se non siamo autenticati via Supabase (bypass), 
            // torniamo una lista vuota per evitare di mostrare i dati di altri utenti
            // Questo forza l'isolamento anche se le policy RLS sono permissive
            return [];
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Mappatura inversa database -> frontend
        return (data || []).map(p => ({
            ...p,
            startDate: p.start_date,
            endDate: p.end_date
        }));
    },

    async createProject(project: Omit<Project, 'id'>, explicitUserId?: string): Promise<Project> {
        const userId = explicitUserId || await this.getCurrentUserId();

        // Mappatura campi frontend -> database (snake_case)
        const dataToInsert = {
            name: project.name,
            client: project.client,
            location: project.location,
            budget: project.budget || 0,
            status: project.status || 'Pianificato',
            start_date: (project.startDate && project.startDate !== '') ? project.startDate : null,
            end_date: (project.endDate && project.endDate !== '') ? project.endDate : null,
            iva: project.iva || 10,
            progress: project.progress || 0,
            ...(userId ? { user_id: userId } : {})
        };

        const { data, error } = await supabase
            .from('projects')
            .insert([dataToInsert])
            .select();

        if (error) {
            console.error("Supabase insert error:", error);
            const msg = error.message || "Errore sconosciuto";
            throw new Error(`Errore database: ${msg}`);
        }

        const saved = data![0];
        return {
            ...saved,
            startDate: saved.start_date,
            endDate: saved.end_date
        };
    },

    async updateProject(project: Project): Promise<Project> {
        const dataToUpdate = {
            name: project.name,
            client: project.client,
            location: project.location,
            budget: project.budget || 0,
            status: project.status,
            start_date: (project.startDate && project.startDate !== '') ? project.startDate : null,
            end_date: (project.endDate && project.endDate !== '') ? project.endDate : null,
            iva: project.iva,
            progress: project.progress
        };

        const { data, error } = await supabase
            .from('projects')
            .update(dataToUpdate)
            .match({ id: project.id })
            .select()
            .single();

        if (error) {
            console.error("Supabase update error:", error);
            const msg = error.message || "Errore sconosciuto";
            throw new Error(`Errore database: ${msg}`);
        }

        return {
            ...data,
            startDate: data.start_date,
            endDate: data.end_date
        };
    },

    async deleteProject(id: string): Promise<void> {
        const { error } = await supabase
            .from('projects')
            .delete()
            .match({ id });

        if (error) throw error;
    },

    // --- MOVIMENTI / SPESE ---
    async getExpenses(projectId?: string): Promise<Expense[]> {
        const userId = await this.getCurrentUserId();
        if (!userId) return [];

        let query = supabase.from('expenses').select('*').eq('user_id', userId);
        if (projectId) query = query.eq('project_id', projectId);

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;

        return (data || []).map(e => ({
            ...e,
            projectId: e.project_id,
            invoiceNumber: e.invoice_number,
            paymentType: e.payment_type
        }));
    },

    async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const userId = await this.getCurrentUserId();

        const dataToInsert = {
            date: expense.date,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            status: expense.status,
            project_id: (expense.projectId && expense.projectId !== '') ? expense.projectId : null,
            invoice_number: expense.invoiceNumber,
            payment_type: expense.paymentType,
            ...(userId ? { user_id: userId } : {})
        };

        const { data, error } = await supabase
            .from('expenses')
            .insert([dataToInsert])
            .select()
            .single();

        if (error) {
            console.error("Error creating expense:", error);
            throw error;
        }

        return {
            ...data,
            projectId: data.project_id,
            invoiceNumber: data.invoice_number,
            paymentType: data.payment_type
        };
    },

    async updateExpense(expense: Expense): Promise<Expense> {
        const userId = await this.getCurrentUserId();

        const dataToUpdate = {
            date: expense.date,
            description: expense.description,
            amount: expense.amount,
            category: expense.category,
            status: expense.status,
            project_id: (expense.projectId && expense.projectId !== '') ? expense.projectId : null,
            invoice_number: expense.invoiceNumber,
            payment_type: expense.paymentType,
        };

        const { data, error } = await supabase
            .from('expenses')
            .update(dataToUpdate)
            .match({ id: expense.id, user_id: userId })
            .select()
            .single();

        if (error) {
            console.error("Error updating expense:", error);
            throw error;
        }

        return {
            ...data,
            projectId: data.project_id,
            invoiceNumber: data.invoice_number,
            paymentType: data.payment_type
        };
    },

    async deleteExpense(id: string): Promise<void> {
        const userId = await this.getCurrentUserId();
        const { error } = await supabase
            .from('expenses')
            .delete()
            .match({ id, user_id: userId });

        if (error) {
            console.error("Error deleting expense:", error);
            throw error;
        }
    },

    // --- PERSONALE ---
    async getEmployees(): Promise<Employee[]> {
        const userId = await this.getCurrentUserId();
        if (!userId) return [];

        const { data, error } = await supabase.from('employees')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return data || [];
    },

    async getPayroll(projectId?: string): Promise<PayrollEntry[]> {
        const userId = await this.getCurrentUserId();
        if (!userId) return [];

        let query = supabase.from('payroll')
            .select('*')
            .eq('user_id', userId);

        if (projectId) query = query.eq('project_id', projectId);

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;

        return (data || []).map(pe => ({
            ...pe,
            projectId: pe.project_id,
            employeeId: pe.employee_id
        }));
    }
};
