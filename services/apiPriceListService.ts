
import { PriceList, PriceListItem } from '../types';

// Base URL per le API CKAN di dati.gov.it (tramite Proxy locale)
const DATI_GOV_API_BASE = 'http://localhost:3001/api/prezziari';

// Dataset IDs conosciuti per i prezziari regionali
export const KNOWN_PRICE_LIST_DATASETS = {
    puglia_2024: {
        id: 'prezzario-regione-puglia-2024',
        name: 'Prezzario Regione Puglia 2024',
        region: 'Puglia',
        year: 2024,
    },
    campania_2024: {
        id: 'prezzario-dei-lavori-pubblici-della-regione-campania-anno-2024',
        name: 'Prezzario Regione Campania 2024',
        region: 'Campania',
        year: 2024,
    },
    // Aggiungi altri dataset conosciuti qui
};

interface CKANDataset {
    id: string;
    name: string;
    title: string;
    resources: CKANResource[];
    organization?: {
        title: string;
    };
}

interface CKANResource {
    id: string;
    name: string;
    format: string;
    url: string;
    description?: string;
}

/**
 * Cerca dataset di prezziari su dati.gov.it
 */
export const searchPriceListDatasets = async (query: string = 'prezzario'): Promise<CKANDataset[]> => {
    try {
        const response = await fetch(
            `${DATI_GOV_API_BASE}/search?q=${encodeURIComponent(query)}&rows=50`
        );

        if (!response.ok) {
            throw new Error(`Errore API: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error('Ricerca fallita');
        }

        return data.result.results || [];
    } catch (error) {
        console.error('Error searching datasets:', error);
        throw new Error('Impossibile cercare i dataset. Verifica la connessione internet.');
    }
};

/**
 * Ottieni dettagli di un dataset specifico
 */
export const getDatasetDetails = async (datasetId: string): Promise<CKANDataset> => {
    try {
        const response = await fetch(
            `${DATI_GOV_API_BASE}/dataset/${encodeURIComponent(datasetId)}`
        );

        if (!response.ok) {
            throw new Error(`Errore API: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error('Dataset non trovato');
        }

        return data.result;
    } catch (error) {
        console.error('Error fetching dataset:', error);
        throw new Error('Impossibile recuperare i dettagli del dataset');
    }
};

/**
 * Scarica e importa un prezzario da un URL CSV
 */
export const downloadAndImportFromURL = async (
    resourceUrl: string,
    region: string,
    municipality?: string,
    datasetName?: string
): Promise<PriceList> => {
    try {
        // Usa il proxy per scaricare il file
        const proxyUrl = `${DATI_GOV_API_BASE}/download?url=${encodeURIComponent(resourceUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
            throw new Error(`Errore download: ${response.status}`);
        }

        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
            throw new Error('File CSV vuoto o non valido');
        }

        // Parse header - supporta vari formati di header
        const headers = lines[0].split(/[,;]/).map(h => h.trim().toLowerCase().replace(/"/g, ''));

        // Trova indici delle colonne (supporta nomi italiani e inglesi)
        const findColumnIndex = (possibleNames: string[]) => {
            return headers.findIndex(h =>
                possibleNames.some(name => h.includes(name.toLowerCase()))
            );
        };

        const codeIndex = findColumnIndex(['codice', 'code', 'cod', 'id']);
        const descIndex = findColumnIndex(['descrizione', 'description', 'desc', 'voce']);
        const unitIndex = findColumnIndex(['unità', 'unita', 'unit', 'um', 'u.m.', 'misura']);
        const priceIndex = findColumnIndex(['prezzo', 'price', 'importo', 'costo', 'euro', '€']);
        const categoryIndex = findColumnIndex(['categoria', 'category', 'cat', 'tipo', 'capitolo']);

        if (codeIndex === -1 || descIndex === -1 || priceIndex === -1) {
            throw new Error('Il file CSV deve contenere almeno: codice, descrizione e prezzo');
        }

        const items: PriceListItem[] = [];
        let successfulRows = 0;
        let skippedRows = 0;

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            try {
                // Supporta sia virgola che punto e virgola come separatore
                const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/"/g, ''));

                if (values.length < Math.max(codeIndex, descIndex, priceIndex) + 1) {
                    skippedRows++;
                    continue;
                }

                // Parse prezzo - gestisce vari formati
                let priceStr = values[priceIndex];
                priceStr = priceStr.replace(/[€\s]/g, '').replace(',', '.');
                const price = parseFloat(priceStr);

                if (isNaN(price) || price < 0) {
                    skippedRows++;
                    continue;
                }

                const code = values[codeIndex] || `CODE-${i}`;
                const description = values[descIndex] || 'Descrizione non disponibile';

                items.push({
                    id: `item-${Date.now()}-${i}`,
                    code: code,
                    description: description,
                    unit: unitIndex !== -1 && values[unitIndex] ? values[unitIndex] : 'cad',
                    price: price,
                    category: categoryIndex !== -1 && values[categoryIndex] ? values[categoryIndex] : 'Generale',
                    region: region,
                    municipality: municipality,
                    year: new Date().getFullYear(),
                });

                successfulRows++;
            } catch (rowError) {
                skippedRows++;
                console.warn(`Errore parsing riga ${i}:`, rowError);
            }
        }

        if (items.length === 0) {
            throw new Error('Nessuna voce valida trovata nel file');
        }

        const priceList: PriceList = {
            id: `pl-api-${Date.now()}`,
            name: datasetName || `${region}${municipality ? ` - ${municipality}` : ''} ${new Date().getFullYear()}`,
            region: region,
            municipality: municipality,
            year: new Date().getFullYear(),
            source: `API - ${resourceUrl}`,
            importDate: new Date().toISOString(),
            itemCount: items.length,
            items: items,
        };

        console.log(`Import completato: ${successfulRows} voci importate, ${skippedRows} righe saltate`);

        return priceList;
    } catch (error) {
        console.error('Error downloading and importing:', error);
        throw error instanceof Error ? error : new Error('Errore durante il download e import');
    }
};

/**
 * Importa un prezzario da un dataset CKAN
 */
export const importFromCKANDataset = async (
    dataset: CKANDataset,
    region: string,
    municipality?: string
): Promise<PriceList> => {
    // Trova la risorsa CSV più appropriata
    const csvResource = dataset.resources.find(r =>
        r.format.toLowerCase() === 'csv' ||
        r.url.toLowerCase().endsWith('.csv')
    );

    if (!csvResource) {
        throw new Error('Nessuna risorsa CSV trovata in questo dataset');
    }

    return downloadAndImportFromURL(
        csvResource.url,
        region,
        municipality,
        dataset.title
    );
};

/**
 * Ottieni lista di prezziari regionali disponibili
 */
export const getAvailableRegionalPriceLists = async (): Promise<{
    dataset: CKANDataset;
    region: string;
    year: number;
}[]> => {
    try {
        const datasets = await searchPriceListDatasets('prezzario regionale');

        return datasets.map(dataset => {
            // Estrai regione e anno dal titolo
            const title = dataset.title.toLowerCase();
            let region = 'Sconosciuta';
            let year = new Date().getFullYear();

            // Mappa regioni
            const regionMap: { [key: string]: string } = {
                'puglia': 'Puglia',
                'campania': 'Campania',
                'toscana': 'Toscana',
                'lazio': 'Lazio',
                'lombardia': 'Lombardia',
                'emilia': 'Emilia-Romagna',
                'veneto': 'Veneto',
                'piemonte': 'Piemonte',
                'sicilia': 'Sicilia',
                'sardegna': 'Sardegna',
            };

            for (const [key, value] of Object.entries(regionMap)) {
                if (title.includes(key)) {
                    region = value;
                    break;
                }
            }

            // Estrai anno
            const yearMatch = title.match(/20\d{2}/);
            if (yearMatch) {
                year = parseInt(yearMatch[0]);
            }

            return { dataset, region, year };
        });
    } catch (error) {
        console.error('Error getting available price lists:', error);
        return [];
    }
};
