import { Document, DocumentType, Project, Client, CILAData, PSCData, DiCoData, SALData } from '../types';
import { documentTemplates } from './documentTemplates';
import { generateDocumentTemplate } from './documentPrintTemplates';

const STORAGE_KEY = 'edilsmart_documents';

// Carica documenti da localStorage
export const loadDocuments = (): Document[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading documents:', error);
        return [];
    }
};

// Salva documenti in localStorage
export const saveDocuments = (documents: Document[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (error) {
        console.error('Error saving documents:', error);
    }
};

// Genera numero documento progressivo
export const generateDocumentNumber = (type: DocumentType, year?: number): string => {
    const documents = loadDocuments();
    const currentYear = year || new Date().getFullYear();
    const typeDocuments = documents.filter(d =>
        d.type === type &&
        d.createdDate.startsWith(currentYear.toString())
    );

    const nextNumber = typeDocuments.length + 1;
    const prefix = getDocumentPrefix(type);

    return `${prefix}-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
};

// Ottieni prefisso per tipo documento
const getDocumentPrefix = (type: DocumentType): string => {
    const prefixes: Record<string, string> = {
        'CILA': 'CILA',
        'SCIA': 'SCIA',
        'Permesso di Costruire': 'PDC',
        'CILAS': 'CILAS',
        'PSC': 'PSC',
        'POS': 'POS',
        'DiCo Impianti': 'DICO',
        'APE': 'APE',
        'SAL': 'SAL',
        'Giornale Lavori': 'GL',
    };
    return prefixes[type] || 'DOC';
};

// Auto-compila dati CILA da progetto e cliente
export const autoFillCILA = (project: Project, client?: Client): Partial<CILAData> => {
    return {
        interventionType: 'Manutenzione Straordinaria',
        startDate: project.startDate || new Date().toISOString().split('T')[0],
        estimatedDuration: project.duration || 90,
        estimatedCost: project.budget || 0,
        client: client ? {
            name: client.name,
            fiscalCode: client.fiscalCode || client.vatNumber || '',
            address: client.address ? `${client.address}, ${client.city} ${client.postalCode}` : ''
        } : {
            name: '',
            fiscalCode: '',
            address: ''
        },
        property: {
            address: project.location || '',
            cadastralData: '',
            urbanPlanningZone: ''
        },
        works: {
            description: project.description || '',
            affectStructure: false,
            affectEnergy: false
        },
        technician: {
            name: '',
            qualification: '',
            registrationNumber: '',
            pec: ''
        }
    };
};

// Auto-compila dati PSC da progetto
export const autoFillPSC = (project: Project): Partial<PSCData> => {
    return {
        worksite: {
            address: project.location || '',
            startDate: project.startDate || new Date().toISOString().split('T')[0],
            estimatedDuration: project.duration || 90,
            estimatedWorkers: 5,
            estimatedManDays: (project.duration || 90) * 5
        },
        coordinator: {
            name: '',
            qualification: 'Coordinatore Sicurezza',
            registrationNumber: ''
        },
        risks: [],
        companies: []
    };
};

// Auto-compila dati DiCo
export const autoFillDiCo = (systemType: DiCoData['systemType']): Partial<DiCoData> => {
    const standards: Record<DiCoData['systemType'], string[]> = {
        'Elettrico': ['CEI 64-8', 'CEI 64-14'],
        'Idraulico': ['UNI 9182', 'UNI-EN 806'],
        'Gas': ['UNI 7129', 'UNI 11137'],
        'Climatizzazione': ['UNI 10339', 'F-Gas'],
        'Altro': []
    };

    return {
        systemType,
        installationDate: new Date().toISOString().split('T')[0],
        standards: standards[systemType],
        installer: {
            name: '',
            vatNumber: '',
            registrationNumber: ''
        },
        materials: [],
        tests: [],
        declarations: {
            conformityToProject: true,
            safetyRules: true,
            goodWorkmanship: true
        }
    };
};

// Auto-compila SAL da computo metrico
export const autoFillSAL = (
    project: Project,
    salNumber: number,
    selectedRows?: Array<{ description: string; quantity: number; unit: string; unitPrice: number }>
): Partial<SALData> => {
    const worksCompleted = selectedRows || [];
    const totalAmount = worksCompleted.reduce((sum, row) => sum + (row.quantity * row.unitPrice), 0);

    // Calcola importi precedenti (somma di tutti i SAL precedenti)
    const documents = loadDocuments();
    const previousSALs = documents.filter(d =>
        d.projectId === project.id &&
        d.type === 'SAL' &&
        (d.data as SALData).number < salNumber
    );
    const previousAmount = previousSALs.reduce((sum, sal) => sum + ((sal.data as SALData).currentAmount || 0), 0);

    const retentionPercentage = 5; // 5% di ritenuta standard
    const retentionAmount = totalAmount * (retentionPercentage / 100);
    const netAmount = totalAmount - retentionAmount;

    return {
        number: salNumber,
        period: {
            from: project.startDate || '',
            to: new Date().toISOString().split('T')[0]
        },
        progressPercentage: ((previousAmount + totalAmount) / (project.budget || 1)) * 100,
        worksCompleted: worksCompleted.map(row => ({
            ...row,
            amount: row.quantity * row.unitPrice
        })),
        totalAmount: previousAmount + totalAmount,
        previousAmount,
        currentAmount: totalAmount,
        retentionPercentage,
        retentionAmount,
        netAmount
    };
};

// Crea nuovo documento
export const createDocument = (
    projectId: string,
    type: DocumentType,
    autoFilledData?: any
): Document => {
    const template = documentTemplates.find(t => t.type === type);
    if (!template) {
        throw new Error(`Template not found for type: ${type}`);
    }

    const now = new Date().toISOString();

    return {
        id: `doc-${Date.now()}`,
        projectId,
        type,
        category: template.category,
        templateId: template.id,
        number: generateDocumentNumber(type),
        status: 'Bozza',
        createdDate: now,
        lastModified: now,
        data: autoFilledData || {},
        attachments: []
    };
};

// Aggiungi documento
export const addDocument = (document: Document): Document[] => {
    const documents = loadDocuments();
    const newDocuments = [document, ...documents];
    saveDocuments(newDocuments);
    return newDocuments;
};

// Aggiorna documento
export const updateDocument = (id: string, updates: Partial<Document>): Document[] => {
    const documents = loadDocuments();
    const newDocuments = documents.map(doc =>
        doc.id === id
            ? { ...doc, ...updates, lastModified: new Date().toISOString() }
            : doc
    );
    saveDocuments(newDocuments);
    return newDocuments;
};

// Elimina documento
export const deleteDocument = (id: string): Document[] => {
    const documents = loadDocuments();
    const newDocuments = documents.filter(doc => doc.id !== id);
    saveDocuments(newDocuments);
    return newDocuments;
};

// Ottieni documenti per progetto
export const getDocumentsByProject = (projectId: string): Document[] => {
    const documents = loadDocuments();
    return documents.filter(doc => doc.projectId === projectId);
};

// Ottieni documenti per categoria
export const getDocumentsByCategory = (projectId: string, category: string): Document[] => {
    const documents = getDocumentsByProject(projectId);
    return documents.filter(doc => doc.category === category);
};

// Verifica documenti mancanti obbligatori
export const getMissingRequiredDocuments = (projectId: string): string[] => {
    const projectDocuments = getDocumentsByProject(projectId);
    const requiredTemplates = documentTemplates.filter(t => t.isRequired);

    const missingDocuments: string[] = [];

    requiredTemplates.forEach(template => {
        const hasDocument = projectDocuments.some(doc => doc.type === template.type);
        if (!hasDocument) {
            missingDocuments.push(template.name);
        }
    });

    return missingDocuments;
};

// Ottieni statistiche documenti
export const getDocumentStats = (projectId: string) => {
    const documents = getDocumentsByProject(projectId);
    const requiredCount = documentTemplates.filter(t => t.isRequired).length;
    const completedCount = documents.filter(d => d.status === 'Completato' || d.status === 'Approvato').length;

    return {
        total: documents.length,
        required: requiredCount,
        completed: completedCount,
        inProgress: documents.filter(d => d.status === 'In Compilazione').length,
        draft: documents.filter(d => d.status === 'Bozza').length,
        approved: documents.filter(d => d.status === 'Approvato').length,
        completionPercentage: (completedCount / requiredCount) * 100
    };
};

// Esporta documento in formato stampabile
export const exportDocumentToPrint = (document: Document): string => {
    return generateDocumentTemplate(document);
};
