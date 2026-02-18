import { supabase } from './supabaseClient';

export interface ProjectFile {
    id: string;
    project_id: string;
    user_id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    storage_path: string;
    created_at: string;
}

export const projectFileService = {
    async getFiles(projectId: string): Promise<ProjectFile[]> {
        const { data, error } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Errore nel recupero dei file:", error);
            // Fallback per evitare crash se la tabella non esiste ancora
            if (error.code === '42P01') return [];
            throw error;
        }
        return data || [];
    },

    async uploadFile(projectId: string, file: File): Promise<ProjectFile> {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        if (!userId) throw new Error("Utente non autenticato");

        // 1. Carica il file su Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
            .from('project-files')
            .upload(filePath, file);

        if (uploadError) {
            console.error("Errore upload storage:", uploadError);
            throw uploadError;
        }

        // 2. Ottieni l'URL pubblico
        const { data: urlData } = supabase.storage
            .from('project-files')
            .getPublicUrl(filePath);

        // 3. Salva i metadati nel database
        const metadata = {
            project_id: projectId,
            user_id: userId,
            name: file.name,
            type: file.type || fileExt || 'unknown',
            size: file.size,
            url: urlData.publicUrl,
            storage_path: filePath
        };

        const { data, error: dbError } = await supabase
            .from('project_files')
            .insert([metadata])
            .select()
            .single();

        if (dbError) {
            // Se fallisce il DB, proviamo a pulire lo storage
            await supabase.storage.from('project-files').remove([filePath]);
            console.error("Errore salvataggio metadati:", dbError);
            throw dbError;
        }

        return data;
    },

    async deleteFile(fileId: string, storagePath: string): Promise<void> {
        // 1. Elimina dallo storage
        const { error: storageError } = await supabase.storage
            .from('project-files')
            .remove([storagePath]);

        if (storageError) {
            console.error("Errore eliminazione storage:", storageError);
            // Continuiamo comunque a provare ad eliminare dal DB 
            // per evitare file orfani nel database se lo storage fallisce o il file è già sparito
        }

        // 2. Elimina dal database
        const { error: dbError } = await supabase
            .from('project_files')
            .delete()
            .eq('id', fileId);

        if (dbError) {
            console.error("Errore eliminazione database:", dbError);
            throw dbError;
        }
    }
};
