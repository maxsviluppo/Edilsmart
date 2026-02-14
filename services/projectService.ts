
import { supabase } from './supabaseClient';
import { Project, Expense, Employee, PayrollEntry, Supplier } from '../types';

export const projectService = {
    // --- PROGETTI ---
    async getProjects(): Promise<Project[]> {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Mappatura inversa database -> frontend
        return (data || []).map(p => ({
            ...p,
            startDate: p.start_date,
            endDate: p.end_date
        }));
    },

    async createProject(project: Omit<Project, 'id'>): Promise<Project> {
        // Mappatura campi frontend -> database (snake_case)
        // Rimuoviamo anche i campi che non esistono nella tabella (es. description, computo, ecc.)
        const dataToInsert = {
            name: project.name,
            client: project.client,
            location: project.location,
            budget: project.budget || 0,
            status: project.status || 'Pianificato',
            start_date: (project.startDate && project.startDate !== '') ? project.startDate : null,
            end_date: (project.endDate && project.endDate !== '') ? project.endDate : null,
            iva: project.iva || 10,
            progress: project.progress || 0
        };

        const { data, error } = await supabase
            .from('projects')
            .insert([dataToInsert])
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            throw error;
        }
        return data;
    },

    async updateProject(project: Project): Promise<Project> {
        // Mappatura campi frontend -> database (snake_case)
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
            throw error;
        }
        return data;
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
        let query = supabase.from('expenses').select('*');
        if (projectId) query = query.eq('projectId', projectId);

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
        const { data, error } = await supabase
            .from('expenses')
            .insert([expense])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // --- PERSONALE ---
    async getEmployees(): Promise<Employee[]> {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) throw error;
        return data || [];
    },

    async getPayroll(projectId?: string): Promise<PayrollEntry[]> {
        let query = supabase.from('payroll').select('*');
        if (projectId) query = query.eq('projectId', projectId);

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;
        return data || [];
    }
};
