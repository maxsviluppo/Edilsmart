import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, CILAData } from '../types';

// URL del PDF ufficiale CILA Regione Campania
const CILA_PDF_URL = 'https://surap.regione.campania.it/Allegati/Allegato_231294.pdf';

/**
 * Scarica il PDF ufficiale, lo compila con i dati e lo scarica
 */
export const downloadCompiledCILA = async (doc: Document) => {
    try {
        const data = doc.data as Partial<CILAData>;

        // 1. Scarica il PDF ufficiale
        const response = await fetch(CILA_PDF_URL);
        const pdfBytes = await response.arrayBuffer();

        // 2. Carica il PDF con pdf-lib
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // 3. Ottieni il form del PDF (se ha campi compilabili)
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        console.log('Campi trovati nel PDF:', fields.map(f => f.getName()));

        // 4. Compila i campi del form
        // NOTA: I nomi dei campi dipendono dal PDF ufficiale
        // Questi sono esempi, dovrai adattarli ai nomi reali
        try {
            // Dati committente
            if (data.client?.name) {
                const nameField = form.getTextField('committente_nome');
                nameField?.setText(data.client.name);
            }

            if (data.client?.fiscalCode) {
                const cfField = form.getTextField('committente_cf');
                cfField?.setText(data.client.fiscalCode);
            }

            if (data.client?.address) {
                const addressField = form.getTextField('committente_indirizzo');
                addressField?.setText(data.client.address);
            }

            // Dati immobile
            if (data.property?.address) {
                const propertyAddressField = form.getTextField('immobile_indirizzo');
                propertyAddressField?.setText(data.property.address);
            }

            if (data.property?.cadastralData) {
                const cadastralField = form.getTextField('immobile_catasto');
                cadastralField?.setText(data.property.cadastralData);
            }

            // Dati intervento
            if (data.interventionType) {
                const typeField = form.getTextField('intervento_tipo');
                typeField?.setText(data.interventionType);
            }

            if (data.startDate) {
                const dateField = form.getTextField('intervento_data_inizio');
                dateField?.setText(new Date(data.startDate).toLocaleDateString('it-IT'));
            }

            if (data.estimatedDuration) {
                const durationField = form.getTextField('intervento_durata');
                durationField?.setText(data.estimatedDuration.toString());
            }

            if (data.estimatedCost) {
                const costField = form.getTextField('intervento_costo');
                costField?.setText(`€ ${data.estimatedCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
            }

            if (data.works?.description) {
                const descField = form.getTextField('intervento_descrizione');
                descField?.setText(data.works.description);
            }

            // Checkbox
            if (data.works?.affectStructure) {
                const structureCheckbox = form.getCheckBox('intervento_struttura');
                structureCheckbox?.check();
            }

            if (data.works?.affectEnergy) {
                const energyCheckbox = form.getCheckBox('intervento_energia');
                energyCheckbox?.check();
            }

            // Tecnico
            if (data.technician?.name) {
                const techNameField = form.getTextField('tecnico_nome');
                techNameField?.setText(data.technician.name);
            }

            if (data.technician?.qualification) {
                const techQualField = form.getTextField('tecnico_qualifica');
                techQualField?.setText(data.technician.qualification);
            }

            if (data.technician?.registrationNumber) {
                const techRegField = form.getTextField('tecnico_albo');
                techRegField?.setText(data.technician.registrationNumber);
            }

            if (data.technician?.pec) {
                const techPecField = form.getTextField('tecnico_pec');
                techPecField?.setText(data.technician.pec);
            }

        } catch (fieldError) {
            console.warn('Alcuni campi non sono stati trovati nel PDF:', fieldError);
            // Continua comunque, alcuni campi potrebbero non esistere
        }

        // 5. Salva il PDF compilato
        const compiledPdfBytes = await pdfDoc.save();

        // 6. Scarica il PDF
        const blob = new Blob([compiledPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `CILA_${doc.number}_COMPILATO.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Errore nella compilazione del PDF:', error);
        throw error;
    }
};

/**
 * Scarica il PDF ufficiale vuoto (senza compilazione)
 */
export const downloadOfficialPDF = async () => {
    try {
        const response = await fetch(CILA_PDF_URL);
        const pdfBytes = await response.arrayBuffer();

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'CILA_UFFICIALE.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Errore nel download del PDF:', error);
        throw error;
    }
};

/**
 * Analizza il PDF e ritorna i nomi dei campi disponibili
 */
export const analyzePDFFields = async (): Promise<string[]> => {
    try {
        const response = await fetch(CILA_PDF_URL);
        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        return fields.map(field => ({
            name: field.getName(),
            type: field.constructor.name
        }));
    } catch (error) {
        console.error('Errore nell\'analisi del PDF:', error);
        return [];
    }
};
