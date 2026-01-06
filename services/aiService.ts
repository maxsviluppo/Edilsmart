
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PriceListItem, PriceList } from "../types";

// Questa dovrebbe essere configurabile nelle impostazioni dell'app
const getApiKey = () => localStorage.getItem('edilsmart_gemini_api_key') || '';

export const isAIConfigured = () => !!getApiKey();

export const setAIApiKey = (key: string) => localStorage.setItem('edilsmart_gemini_api_key', key);

// Inizializza il modello
const genAI = new GoogleGenerativeAI(getApiKey());

/**
 * Cerca voci usando l'AI per comprensione semantica
 * Es: "voci per costruire un muro" -> trova mattoni, malta, intonaco
 */
export const semanticSearch = async (
    query: string,
    availableItems: PriceListItem[]
): Promise<PriceListItem[]> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn("API Key Gemini mancante. Fallback su ricerca locale semplice.");
        // Fallback: ricerca parole chiave semplice
        const terms = query.toLowerCase().split(' ');
        return availableItems.filter(item => {
            const text = `${item.description} ${item.category}`.toLowerCase();
            return terms.some(term => text.includes(term));
        }).slice(0, 10);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Creiamo un contesto ridotto per l'AI (inviare tutto il DB potrebbe essere troppo)
        // Inviamo solo le categorie o un campione rappresentativo, oppure chiediamo all'AI di generare keyword

        // Strategia: Chiediamo all'AI di estrarre keyword tecniche e sinonimi dalla query
        const prompt = `
      Sei un esperto di edilizia. L'utente cerca: "${query}".
      Genera una lista di 5-10 parole chiave tecniche, sinonimi e materiali correlati che dovrei cercare in un prezzario edile.
      Restituisci solo le parole chiave separate da virgola, senza altro testo.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const keywordsText = response.text();
        const keywords = keywordsText.split(',').map(k => k.trim().toLowerCase());

        console.log("AI Keywords generate:", keywords);

        // Usiamo le keyword generate per filtrare gli articoli
        // Punteggio di rilevanza
        const scoredItems = availableItems.map(item => {
            let score = 0;
            const text = `${item.description} ${item.category} ${item.code}`.toLowerCase();

            keywords.forEach(keyword => {
                if (text.includes(keyword)) score += 3; // Keyword esatta

                // Match parziale
                const keywordParts = keyword.split(' ');
                keywordParts.forEach(part => {
                    if (part.length > 3 && text.includes(part)) score += 1;
                });
            });

            return { item, score };
        });

        // Ordina per score e prendi i migliori
        return scoredItems
            .filter(x => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20)
            .map(x => x.item);

    } catch (error) {
        console.error("Errore AI Search:", error);
        return [];
    }
};

/**
 * Ottieni suggerimenti intelligenti basati su una voce selezionata
 */
export const getAISuggestions = async (
    item: PriceListItem
): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
      Ho selezionato questa voce dal prezzario edile: "${item.description}" (Categoria: ${item.category}).
      Suggerisci 3 altre voci o materiali che sono tipicamente necessari insieme a questo per completare il lavoro.
      Restituisci solo una lista puntata sintetica.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return text.split('\n').filter(line => line.trim().length > 0).map(l => l.replace(/^[-\*]\s*/, ''));
    } catch (error) {
        console.error("Errore AI Suggestions:", error);
        return [];
    }
};

/**
 * Analisi prezzi tra regioni
 */
export const analyzePrices = async (
    description: string,
    items: PriceListItem[]
): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Configura la chiave API Gemini per l'analisi prezzi.";

    // Raggruppa prezzi per regione
    const pricesByRegion: Record<string, number[]> = {};
    items.forEach(item => {
        if (!pricesByRegion[item.region]) pricesByRegion[item.region] = [];
        pricesByRegion[item.region].push(item.price);
    });

    const summary = Object.entries(pricesByRegion).map(([region, prices]) => {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        return `${region}: €${avg.toFixed(2)}`;
    }).join('\n');

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
      Ho questi prezzi medi per "${description}" in diverse regioni italiane:
      ${summary}
      
      Fornisci una breve analisi (max 3 frasi) sulle differenze di prezzo e possibili cause.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        return "Analisi non disponibile al momento.";
    }
};
