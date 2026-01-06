
import { PriceList, PriceListItem, Region, RegionCode } from '../types';

const STORAGE_KEY = 'edilsmart_price_lists';

// Database delle regioni italiane con informazioni sui prezziari ufficiali
export const ITALIAN_REGIONS: Region[] = [
    { code: 'lombardia', name: 'Lombardia', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.lombardia.it' },
    { code: 'emilia-romagna', name: 'Emilia-Romagna', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.emilia-romagna.it' },
    { code: 'veneto', name: 'Veneto', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.veneto.it' },
    { code: 'lazio', name: 'Lazio', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.lazio.it' },
    { code: 'piemonte', name: 'Piemonte', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.piemonte.it' },
    { code: 'toscana', name: 'Toscana', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.toscana.it' },
    { code: 'campania', name: 'Campania', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.campania.it' },
    { code: 'sicilia', name: 'Sicilia', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.sicilia.it' },
    { code: 'puglia', name: 'Puglia', hasOfficialPriceList: true, priceListUrl: 'https://www.regione.puglia.it' },
    { code: 'calabria', name: 'Calabria', hasOfficialPriceList: true },
    { code: 'sardegna', name: 'Sardegna', hasOfficialPriceList: true },
    { code: 'liguria', name: 'Liguria', hasOfficialPriceList: true },
    { code: 'marche', name: 'Marche', hasOfficialPriceList: true },
    { code: 'abruzzo', name: 'Abruzzo', hasOfficialPriceList: true },
    { code: 'friuli-venezia-giulia', name: 'Friuli-Venezia Giulia', hasOfficialPriceList: true },
    { code: 'trentino-alto-adige', name: 'Trentino-Alto Adige', hasOfficialPriceList: true },
    { code: 'umbria', name: 'Umbria', hasOfficialPriceList: true },
    { code: 'basilicata', name: 'Basilicata', hasOfficialPriceList: false },
    { code: 'molise', name: 'Molise', hasOfficialPriceList: false },
    { code: 'valle-daosta', name: "Valle d'Aosta", hasOfficialPriceList: false },
];

// Salva i prezziari nel localStorage
export const savePriceLists = (priceLists: PriceList[]): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(priceLists));
    } catch (error) {
        console.error('Error saving price lists:', error);
        throw new Error('Impossibile salvare i prezziari');
    }
};

// Carica i prezziari dal localStorage
export const loadPriceLists = (): PriceList[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading price lists:', error);
        return [];
    }
};

// Aggiungi un nuovo prezzario
export const addPriceList = (priceList: PriceList): void => {
    const priceLists = loadPriceLists();
    priceLists.push(priceList);
    savePriceLists(priceLists);
};

// Elimina un prezzario
export const deletePriceList = (id: string): void => {
    const priceLists = loadPriceLists();
    const filtered = priceLists.filter(pl => pl.id !== id);
    savePriceLists(filtered);
};

// Importa prezzario da file CSV
export const importFromCSV = (
    file: File,
    region: string,
    municipality?: string
): Promise<PriceList> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    reject(new Error('File CSV vuoto o non valido'));
                    return;
                }

                // Parse header
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const codeIndex = headers.findIndex(h => h.includes('codice') || h.includes('code'));
                const descIndex = headers.findIndex(h => h.includes('descrizione') || h.includes('description'));
                const unitIndex = headers.findIndex(h => h.includes('unità') || h.includes('unit') || h.includes('um'));
                const priceIndex = headers.findIndex(h => h.includes('prezzo') || h.includes('price') || h.includes('importo'));
                const categoryIndex = headers.findIndex(h => h.includes('categoria') || h.includes('category'));

                if (codeIndex === -1 || descIndex === -1 || priceIndex === -1) {
                    reject(new Error('Il file CSV deve contenere almeno: codice, descrizione e prezzo'));
                    return;
                }

                const items: PriceListItem[] = [];

                // Parse data rows
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());

                    if (values.length < headers.length) continue;

                    const price = parseFloat(values[priceIndex].replace(/[€\s]/g, '').replace(',', '.'));

                    if (isNaN(price)) continue;

                    items.push({
                        id: `item-${Date.now()}-${i}`,
                        code: values[codeIndex] || `CODE-${i}`,
                        description: values[descIndex] || 'Descrizione non disponibile',
                        unit: unitIndex !== -1 ? values[unitIndex] : 'cad',
                        price: price,
                        category: categoryIndex !== -1 ? values[categoryIndex] : 'Generale',
                        region: region,
                        municipality: municipality,
                        year: new Date().getFullYear(),
                    });
                }

                const priceList: PriceList = {
                    id: `pl-${Date.now()}`,
                    name: `${region}${municipality ? ` - ${municipality}` : ''} ${new Date().getFullYear()}`,
                    region: region,
                    municipality: municipality,
                    year: new Date().getFullYear(),
                    source: file.name,
                    importDate: new Date().toISOString(),
                    itemCount: items.length,
                    items: items,
                };

                resolve(priceList);
            } catch (error) {
                reject(new Error('Errore durante il parsing del file CSV'));
            }
        };

        reader.onerror = () => reject(new Error('Errore durante la lettura del file'));
        reader.readAsText(file);
    });
};

// Importa prezzario da file Excel (simulato - richiede libreria xlsx in produzione)
export const importFromExcel = (
    file: File,
    region: string,
    municipality?: string
): Promise<PriceList> => {
    return new Promise((resolve, reject) => {
        reject(new Error('Import Excel non ancora implementato. Usa CSV o contatta il supporto.'));
    });
};

// Cerca voci nel prezzario
export const searchPriceListItems = (
    query: string,
    filters?: {
        region?: string;
        municipality?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        year?: number;
    }
): PriceListItem[] => {
    const priceLists = loadPriceLists();
    let allItems: PriceListItem[] = [];

    // Raccogli tutti gli items da tutti i prezziari
    priceLists.forEach(pl => {
        allItems = [...allItems, ...pl.items];
    });

    // Applica filtri
    let filtered = allItems;

    if (filters?.region) {
        filtered = filtered.filter(item =>
            item.region.toLowerCase() === filters.region!.toLowerCase()
        );
    }

    if (filters?.municipality) {
        filtered = filtered.filter(item =>
            item.municipality?.toLowerCase() === filters.municipality!.toLowerCase()
        );
    }

    if (filters?.category) {
        filtered = filtered.filter(item =>
            item.category.toLowerCase().includes(filters.category!.toLowerCase())
        );
    }

    if (filters?.minPrice !== undefined) {
        filtered = filtered.filter(item => item.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
        filtered = filtered.filter(item => item.price <= filters.maxPrice!);
    }

    if (filters?.year) {
        filtered = filtered.filter(item => item.year === filters.year);
    }

    // Ricerca testuale
    if (query.trim()) {
        const searchTerms = query.toLowerCase().split(' ');
        filtered = filtered.filter(item => {
            const searchText = `${item.code} ${item.description} ${item.category}`.toLowerCase();
            return searchTerms.every(term => searchText.includes(term));
        });
    }

    return filtered;
};

// Ottieni categorie uniche
export const getCategories = (): string[] => {
    const priceLists = loadPriceLists();
    const categories = new Set<string>();

    priceLists.forEach(pl => {
        pl.items.forEach(item => {
            categories.add(item.category);
        });
    });

    return Array.from(categories).sort();
};

// Ottieni statistiche sui prezziari
export const getPriceListStats = () => {
    const priceLists = loadPriceLists();
    const totalItems = priceLists.reduce((sum, pl) => sum + pl.itemCount, 0);
    const regions = new Set(priceLists.map(pl => pl.region));
    const municipalities = new Set(priceLists.filter(pl => pl.municipality).map(pl => pl.municipality));

    return {
        totalPriceLists: priceLists.length,
        totalItems: totalItems,
        regionsCount: regions.size,
        municipalitiesCount: municipalities.size,
        latestYear: priceLists.length > 0 ? Math.max(...priceLists.map(pl => pl.year)) : new Date().getFullYear(),
    };
};
