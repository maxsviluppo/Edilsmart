import { CustomTemplate } from '../components/TemplateManager';
import { DocumentType } from '../types';

const STORAGE_KEY = 'custom_document_templates';

// Carica template personalizzati
export const loadCustomTemplates = (): CustomTemplate[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading custom templates:', error);
        return [];
    }
};

// Ottieni template personalizzato per tipo documento
export const getCustomTemplateByType = (documentType: DocumentType): CustomTemplate | null => {
    const templates = loadCustomTemplates();
    return templates.find(t => t.documentType === documentType) || null;
};

// Compila template PDF/HTML con dati
export const fillTemplateWithData = (template: CustomTemplate, data: any): string => {
    let content = template.fileContent;

    // Se è HTML, sostituisci i placeholder
    if (template.fileType === 'html') {
        try {
            // Decodifica base64 se necessario
            const htmlContent = content.includes('base64,')
                ? atob(content.split(',')[1])
                : content;

            // Sostituisci placeholder comuni
            let filledContent = htmlContent
                // Dati committente
                .replace(/\{\{cliente\.nome\}\}/gi, data.client?.name || '_____________________')
                .replace(/\{\{cliente\.cf\}\}/gi, data.client?.fiscalCode || '_____________________')
                .replace(/\{\{cliente\.indirizzo\}\}/gi, data.client?.address || '_____________________')

                // Dati immobile
                .replace(/\{\{immobile\.indirizzo\}\}/gi, data.property?.address || '_____________________')
                .replace(/\{\{immobile\.catasto\}\}/gi, data.property?.cadastralData || '_____________________')
                .replace(/\{\{immobile\.zona\}\}/gi, data.property?.urbanPlanningZone || '_____________________')

                // Dati intervento
                .replace(/\{\{intervento\.tipo\}\}/gi, data.interventionType || '_____________________')
                .replace(/\{\{intervento\.dataInizio\}\}/gi, data.startDate ? new Date(data.startDate).toLocaleDateString('it-IT') : '_____________________')
                .replace(/\{\{intervento\.durata\}\}/gi, data.estimatedDuration?.toString() || '_____________________')
                .replace(/\{\{intervento\.costo\}\}/gi, data.estimatedCost ? `€ ${data.estimatedCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '_____________________')
                .replace(/\{\{intervento\.descrizione\}\}/gi, data.works?.description || '_____________________')

                // Checkbox (usa 'checked' se true, altrimenti stringa vuota)
                .replace(/\{\{intervento\.struttura\}\}/gi, data.works?.affectStructure ? 'checked' : '')
                .replace(/\{\{intervento\.energia\}\}/gi, data.works?.affectEnergy ? 'checked' : '')

                // Tecnico
                .replace(/\{\{tecnico\.nome\}\}/gi, data.technician?.name || '_____________________')
                .replace(/\{\{tecnico\.qualifica\}\}/gi, data.technician?.qualification || '_____________________')
                .replace(/\{\{tecnico\.albo\}\}/gi, data.technician?.registrationNumber || '_____________________')
                .replace(/\{\{tecnico\.pec\}\}/gi, data.technician?.pec || '_____________________')

                // Numero documento
                .replace(/\{\{numero\}\}/gi, data.number || 'N/A')

                // Date
                .replace(/\{\{data\.oggi\}\}/gi, new Date().toLocaleDateString('it-IT'))
                .replace(/\{\{data\.ora\}\}/gi, new Date().toLocaleTimeString('it-IT'))
                .replace(/\{\{data\.anno\}\}/gi, new Date().getFullYear().toString());

            // Riconverti in base64 se era base64
            if (content.includes('base64,')) {
                const base64Content = btoa(unescape(encodeURIComponent(filledContent)));
                return `data:text/html;base64,${base64Content}`;
            }

            return filledContent;
        } catch (error) {
            console.error('Error filling HTML template:', error);
            return content;
        }
    }

    // Per PDF, ritorna il contenuto originale (non possiamo modificare PDF direttamente nel browser)
    return content;
};

// Genera HTML compilato da template personalizzato
export const generateFilledTemplate = (documentType: DocumentType, data: any): string | null => {
    const customTemplate = getCustomTemplateByType(documentType);

    if (!customTemplate) {
        return null; // Nessun template personalizzato trovato
    }

    return fillTemplateWithData(customTemplate, data);
};

// Esporta tipo per uso in altri file
export type { CustomTemplate };
