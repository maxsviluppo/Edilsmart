
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
        return data || [];
    },

    async createProject(project: Omit<Project, 'id'>): Promise<Project> {
        const { data, error } = await supabase
            .from('projects')
            .insert([project])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProject(project: Project): Promise<Project> {
        const { data, error } = await supabase
            .from('projects')
            .update(project)
            .match({ id: project.id })
            .select()
            .single();

        if (error) throw error;
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
