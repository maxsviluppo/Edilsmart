import { DocumentTemplate, DocumentType, DocumentCategory } from '../types';

// Template predefiniti per tutti i documenti edilizi
export const documentTemplates: DocumentTemplate[] = [
    // TITOLI ABILITATIVI
    {
        id: 'tpl_cila',
        type: 'CILA',
        category: 'Titoli Abilitativi',
        name: 'CILA - Comunicazione Inizio Lavori Asseverata',
        description: 'Per interventi di manutenzione straordinaria leggera',
        requiredFields: ['interventionType', 'startDate', 'estimatedDuration', 'estimatedCost', 'technician', 'client', 'property', 'works'],
        optionalFields: ['notes', 'attachments'],
        responsibleRole: 'Tecnico Abilitato',
        isRequired: true,
        normativeReference: 'Art. 6-bis D.P.R. 380/2001'
    },
    {
        id: 'tpl_scia',
        type: 'SCIA',
        category: 'Titoli Abilitativi',
        name: 'SCIA - Segnalazione Certificata Inizio Attività',
        description: 'Per interventi strutturali o varianti a permessi esistenti',
        requiredFields: ['interventionType', 'startDate', 'technician', 'client', 'property', 'structuralWorks'],
        optionalFields: ['previousPermit', 'notes'],
        responsibleRole: 'Tecnico Abilitato',
        isRequired: true,
        normativeReference: 'Art. 22 D.P.R. 380/2001'
    },
    {
        id: 'tpl_pdc',
        type: 'Permesso di Costruire',
        category: 'Titoli Abilitativi',
        name: 'Permesso di Costruire',
        description: 'Per nuove costruzioni o ristrutturazioni pesanti',
        requiredFields: ['projectDescription', 'technician', 'client', 'property', 'urbanPlanningCompliance'],
        optionalFields: ['landscapeAuthorization', 'environmentalImpact'],
        responsibleRole: 'Tecnico Abilitato',
        isRequired: true,
        normativeReference: 'Art. 10 D.P.R. 380/2001'
    },
    {
        id: 'tpl_cilas',
        type: 'CILAS',
        category: 'Titoli Abilitativi',
        name: 'CILAS - CILA Superbonus',
        description: 'Specifica per interventi legati al Superbonus',
        requiredFields: ['interventionType', 'energyClass', 'seismicClass', 'technician', 'client', 'property'],
        optionalFields: ['previousAPE', 'projectAPE'],
        responsibleRole: 'Tecnico Abilitato',
        isRequired: true,
        normativeReference: 'Art. 119 D.L. 34/2020'
    },

    // DOCUMENTAZIONE TECNICA
    {
        id: 'tpl_rel_tecnica',
        type: 'Relazione Tecnica',
        category: 'Documentazione Tecnica',
        name: 'Relazione Tecnica di Progetto',
        description: 'Descrizione dettagliata dell\'opera e delle scelte progettuali',
        requiredFields: ['projectDescription', 'technicalSolutions', 'materials', 'executionMethods'],
        optionalFields: ['alternatives', 'costAnalysis'],
        responsibleRole: 'Progettista',
        isRequired: true,
        normativeReference: 'D.P.R. 380/2001'
    },
    {
        id: 'tpl_rel_geologica',
        type: 'Relazione Geologica',
        category: 'Documentazione Tecnica',
        name: 'Relazione Geologica',
        description: 'Analisi geologica e geotecnica del terreno',
        requiredFields: ['soilAnalysis', 'seismicCategory', 'foundationRecommendations'],
        optionalFields: ['hydrogeology', 'landslideRisk'],
        responsibleRole: 'Geologo',
        isRequired: true,
        normativeReference: 'NTC 2018'
    },
    {
        id: 'tpl_prog_strutturale',
        type: 'Progetto Strutturale',
        category: 'Documentazione Tecnica',
        name: 'Progetto Strutturale e Deposito Genio Civile',
        description: 'Calcoli strutturali e deposito presso il Genio Civile',
        requiredFields: ['structuralCalculations', 'materials', 'executiveDrawings', 'depositNumber'],
        optionalFields: ['seismicAnalysis', 'foundationDesign'],
        responsibleRole: 'Ingegnere Strutturista',
        isRequired: true,
        normativeReference: 'NTC 2018 - D.M. 17/01/2018'
    },
    {
        id: 'tpl_legge10',
        type: 'Relazione Legge 10',
        category: 'Documentazione Tecnica',
        name: 'Relazione Legge 10 - Contenimento Consumi Energetici',
        description: 'Relazione sul contenimento dei consumi energetici',
        requiredFields: ['buildingCharacteristics', 'thermalTransmittance', 'heatingSystem', 'energyClass'],
        optionalFields: ['renewableEnergy', 'ventilation'],
        responsibleRole: 'Termotecnico',
        isRequired: true,
        normativeReference: 'Legge 10/1991 - D.Lgs. 192/2005'
    },
    {
        id: 'tpl_fascicolo',
        type: 'Fascicolo Opera',
        category: 'Documentazione Tecnica',
        name: 'Fascicolo dell\'Opera',
        description: 'Informazioni per la manutenzione futura in sicurezza',
        requiredFields: ['buildingDescription', 'maintenanceInstructions', 'safetyMeasures'],
        optionalFields: ['asBuiltDrawings', 'materialsCertificates'],
        responsibleRole: 'Coordinatore Sicurezza',
        isRequired: true,
        normativeReference: 'D.Lgs. 81/2008 - Art. 91'
    },

    // SICUREZZA SUL LAVORO
    {
        id: 'tpl_psc',
        type: 'PSC',
        category: 'Sicurezza sul Lavoro',
        name: 'PSC - Piano di Sicurezza e Coordinamento',
        description: 'Piano di sicurezza redatto dal coordinatore',
        requiredFields: ['coordinator', 'worksite', 'risks', 'companies', 'emergencyProcedures'],
        optionalFields: ['trainingPlan', 'inspectionSchedule'],
        responsibleRole: 'Coordinatore Sicurezza Progettazione',
        isRequired: true,
        normativeReference: 'D.Lgs. 81/2008 - Art. 100'
    },
    {
        id: 'tpl_pos',
        type: 'POS',
        category: 'Sicurezza sul Lavoro',
        name: 'POS - Piano Operativo di Sicurezza',
        description: 'Piano operativo di ogni impresa esecutrice',
        requiredFields: ['company', 'activities', 'risks', 'preventionMeasures', 'ppe'],
        optionalFields: ['machinery', 'chemicals'],
        responsibleRole: 'Impresa Esecutrice',
        isRequired: true,
        normativeReference: 'D.Lgs. 81/2008 - Art. 96'
    },
    {
        id: 'tpl_notifica',
        type: 'Notifica Preliminare',
        category: 'Sicurezza sul Lavoro',
        name: 'Notifica Preliminare',
        description: 'Da inviare ad ASL e Ispettorato del Lavoro',
        requiredFields: ['worksite', 'client', 'coordinator', 'companies', 'estimatedWorkers', 'estimatedDuration'],
        optionalFields: [],
        responsibleRole: 'Committente/Responsabile Lavori',
        isRequired: true,
        normativeReference: 'D.Lgs. 81/2008 - Art. 99'
    },
    {
        id: 'tpl_durc',
        type: 'DURC',
        category: 'Sicurezza sul Lavoro',
        name: 'DURC - Documento Unico Regolarità Contributiva',
        description: 'Verifica regolarità contributi lavoratori',
        requiredFields: ['company', 'vatNumber', 'requestDate', 'validityDate'],
        optionalFields: ['previousDURC'],
        responsibleRole: 'Impresa',
        isRequired: true,
        normativeReference: 'D.Lgs. 276/2003'
    },
    {
        id: 'tpl_organico',
        type: 'Organico Medio Annuo',
        category: 'Sicurezza sul Lavoro',
        name: 'Dichiarazione Organico Medio Annuo',
        description: 'Autocertificazione dell\'impresa',
        requiredFields: ['company', 'year', 'averageEmployees', 'employeeCategories'],
        optionalFields: ['variations'],
        responsibleRole: 'Impresa',
        isRequired: true,
        normativeReference: 'D.Lgs. 81/2008'
    },

    // CERTIFICAZIONI FINE LAVORI
    {
        id: 'tpl_dico',
        type: 'DiCo Impianti',
        category: 'Certificazioni Fine Lavori',
        name: 'DiCo - Dichiarazione di Conformità Impianti',
        description: 'Rilasciata dagli impiantisti (elettrico, idraulico, gas)',
        requiredFields: ['installer', 'systemType', 'installationDate', 'standards', 'materials', 'tests', 'declarations'],
        optionalFields: ['maintenanceInstructions'],
        responsibleRole: 'Installatore Abilitato',
        isRequired: true,
        normativeReference: 'D.M. 37/2008'
    },
    {
        id: 'tpl_ape',
        type: 'APE',
        category: 'Certificazioni Fine Lavori',
        name: 'APE - Attestato Prestazione Energetica',
        description: 'Certifica la classe energetica dell\'edificio',
        requiredFields: ['buildingData', 'energyClass', 'consumption', 'recommendations'],
        optionalFields: ['renewableEnergy', 'improvements'],
        responsibleRole: 'Certificatore Energetico',
        isRequired: true,
        normativeReference: 'D.Lgs. 192/2005'
    },
    {
        id: 'tpl_collaudo',
        type: 'Collaudo Statico',
        category: 'Certificazioni Fine Lavori',
        name: 'Certificato di Collaudo Statico',
        description: 'Redatto da tecnico abilitato terzo',
        requiredFields: ['collaudator', 'structuralElements', 'tests', 'compliance', 'conclusions'],
        optionalFields: ['nonDestructiveTests'],
        responsibleRole: 'Collaudatore Statico',
        isRequired: true,
        normativeReference: 'NTC 2018 - Art. 9'
    },
    {
        id: 'tpl_agibilita',
        type: 'Agibilità',
        category: 'Certificazioni Fine Lavori',
        name: 'SCA - Segnalazione Certificata di Agibilità',
        description: 'Attesta rispetto norme igienico-sanitarie e sicurezza',
        requiredFields: ['buildingCompliance', 'systems', 'accessibility', 'safety'],
        optionalFields: ['parkingSpaces'],
        responsibleRole: 'Tecnico Abilitato',
        isRequired: true,
        normativeReference: 'D.P.R. 380/2001 - Art. 24'
    },
    {
        id: 'tpl_docfa',
        type: 'DOCFA',
        category: 'Certificazioni Fine Lavori',
        name: 'DOCFA - Variazione Catastale',
        description: 'Aggiornamento planimetrie al Catasto',
        requiredFields: ['cadastralData', 'updatedFloorPlans', 'category', 'class'],
        optionalFields: ['previousCadastralData'],
        responsibleRole: 'Tecnico Abilitato',
        isRequired: true,
        normativeReference: 'D.P.R. 1142/1949'
    },

    // GESTIONE AMMINISTRATIVA
    {
        id: 'tpl_giornale',
        type: 'Giornale Lavori',
        category: 'Gestione Amministrativa',
        name: 'Giornale dei Lavori',
        description: 'Registro cronologico eventi cantiere',
        requiredFields: ['date', 'weather', 'workers', 'activities', 'materials'],
        optionalFields: ['incidents', 'inspections'],
        responsibleRole: 'Direttore Lavori',
        isRequired: true,
        normativeReference: 'D.P.R. 207/2010'
    },
    {
        id: 'tpl_sal',
        type: 'SAL',
        category: 'Gestione Amministrativa',
        name: 'SAL - Stato Avanzamento Lavori',
        description: 'Documenti per fatturazione a rate',
        requiredFields: ['number', 'period', 'progressPercentage', 'worksCompleted', 'amounts'],
        optionalFields: ['photos', 'variations'],
        responsibleRole: 'Direttore Lavori',
        isRequired: false,
        normativeReference: 'D.P.R. 207/2010'
    },
    {
        id: 'tpl_libretto',
        type: 'Libretto Misure',
        category: 'Gestione Amministrativa',
        name: 'Libretto delle Misure',
        description: 'Registrazione quantità materiali e lavorazioni',
        requiredFields: ['date', 'workType', 'quantity', 'unit', 'location'],
        optionalFields: ['photos', 'notes'],
        responsibleRole: 'Direttore Lavori',
        isRequired: true,
        normativeReference: 'D.P.R. 207/2010'
    },
    {
        id: 'tpl_registro',
        type: 'Registro Contabilità',
        category: 'Gestione Amministrativa',
        name: 'Registro di Contabilità',
        description: 'Sintesi economica del progetto',
        requiredFields: ['contractAmount', 'variations', 'payments', 'balance'],
        optionalFields: ['reserves', 'penalties'],
        responsibleRole: 'Direttore Lavori',
        isRequired: true,
        normativeReference: 'D.P.R. 207/2010'
    }
];

export const getTemplatesByCategory = (category: DocumentCategory): DocumentTemplate[] => {
    return documentTemplates.filter(t => t.category === category);
};

export const getTemplateByType = (type: DocumentType): DocumentTemplate | undefined => {
    return documentTemplates.find(t => t.type === type);
};

export const getRequiredDocuments = (): DocumentTemplate[] => {
    return documentTemplates.filter(t => t.isRequired);
};

export const getDocumentsByPhase = (phase: 'pre-cantiere' | 'cantiere' | 'fine-lavori') => {
    switch (phase) {
        case 'pre-cantiere':
            return documentTemplates.filter(t =>
                t.category === 'Titoli Abilitativi' ||
                t.category === 'Documentazione Tecnica' ||
                (t.category === 'Sicurezza sul Lavoro' && ['PSC', 'Notifica Preliminare'].includes(t.type))
            );
        case 'cantiere':
            return documentTemplates.filter(t =>
                t.category === 'Gestione Amministrativa' ||
                (t.category === 'Sicurezza sul Lavoro' && ['POS', 'DURC', 'Organico Medio Annuo'].includes(t.type))
            );
        case 'fine-lavori':
            return documentTemplates.filter(t => t.category === 'Certificazioni Fine Lavori');
        default:
            return [];
    }
};
