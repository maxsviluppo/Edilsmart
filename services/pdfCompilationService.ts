import { Document, CILAData } from '../types';

// URL del PDF ufficiale CILA Regione Campania
export const CILA_PDF_URL = 'https://surap.regione.campania.it/Allegati/Allegato_231294.pdf';

// Genera un file di testo con i dati pronti per la compilazione
export const generateDataSheet = (doc: Document): string => {
    const data = doc.data as Partial<CILAData>;

    return `
═══════════════════════════════════════════════════════════════
  DATI PER COMPILAZIONE CILA - ${doc.number}
  Generato il: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}
═══════════════════════════════════════════════════════════════

📋 ISTRUZIONI:
1. Scarica il PDF ufficiale CILA dal link qui sotto
2. Apri il PDF con Adobe Acrobat Reader
3. Copia e incolla i dati da questo file nei campi corrispondenti
4. Salva il PDF compilato

🔗 LINK PDF UFFICIALE:
${CILA_PDF_URL}

───────────────────────────────────────────────────────────────
1. DATI DEL COMMITTENTE
───────────────────────────────────────────────────────────────

Nome e Cognome / Ragione Sociale:
${data.client?.name || '[DA COMPILARE]'}

Codice Fiscale / P.IVA:
${data.client?.fiscalCode || '[DA COMPILARE]'}

Indirizzo di residenza/sede:
${data.client?.address || '[DA COMPILARE]'}

───────────────────────────────────────────────────────────────
2. DATI DELL'IMMOBILE
───────────────────────────────────────────────────────────────

Indirizzo dell'intervento:
${data.property?.address || '[DA COMPILARE]'}

Dati catastali (Foglio, Particella, Sub):
${data.property?.cadastralData || '[DA COMPILARE]'}

Zona urbanistica:
${data.property?.urbanPlanningZone || '[DA COMPILARE]'}

───────────────────────────────────────────────────────────────
3. DESCRIZIONE DELL'INTERVENTO
───────────────────────────────────────────────────────────────

Tipologia di intervento:
${data.interventionType || '[DA COMPILARE]'}

Data prevista di inizio lavori:
${data.startDate ? new Date(data.startDate).toLocaleDateString('it-IT') : '[DA COMPILARE]'}

Durata prevista dei lavori (giorni):
${data.estimatedDuration || '[DA COMPILARE]'}

Costo presunto dell'intervento (€):
${data.estimatedCost ? `€ ${data.estimatedCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '[DA COMPILARE]'}

Descrizione dettagliata dei lavori:
${data.works?.description || '[DA COMPILARE]'}

Caratteristiche dell'intervento:
☐ L'intervento interessa le parti strutturali dell'edificio
  ${data.works?.affectStructure ? '✓ SÌ' : '☐ NO'}

☐ L'intervento comporta modifiche dell'efficienza energetica
  ${data.works?.affectEnergy ? '✓ SÌ' : '☐ NO'}

───────────────────────────────────────────────────────────────
4. DATI DEL TECNICO ASSEVERATORE
───────────────────────────────────────────────────────────────

Nome e Cognome:
${data.technician?.name || '[DA COMPILARE]'}

Qualifica professionale:
${data.technician?.qualification || '[DA COMPILARE]'}

Numero iscrizione all'Albo:
${data.technician?.registrationNumber || '[DA COMPILARE]'}

Indirizzo PEC:
${data.technician?.pec || '[DA COMPILARE]'}

───────────────────────────────────────────────────────────────
5. NOTE AGGIUNTIVE
───────────────────────────────────────────────────────────────

${doc.notes || 'Nessuna nota aggiuntiva'}

═══════════════════════════════════════════════════════════════
  Fine documento - EdilSmart
═══════════════════════════════════════════════════════════════
  `;
};

// Scarica il file di testo con i dati
export const downloadDataSheet = (doc: Document) => {
    const content = generateDataSheet(doc);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CILA_${doc.number}_DATI.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Apri il PDF ufficiale in una nuova tab
export const openOfficialPDF = () => {
    window.open(CILA_PDF_URL, '_blank');
};

// Genera HTML con istruzioni e dati affiancati
export const generateCompilationGuide = (doc: Document): string => {
    const data = doc.data as Partial<CILAData>;

    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guida Compilazione CILA - ${doc.number}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      background: white;
      padding: 20px;
    }
    
    .header {
      background: #2563eb;
      color: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
    }
    
    .header h1 {
      font-size: 20pt;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 11pt;
      opacity: 0.9;
    }
    
    .instructions {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-bottom: 20px;
    }
    
    .instructions h2 {
      color: #856404;
      font-size: 14pt;
      margin-bottom: 10px;
    }
    
    .instructions ol {
      margin-left: 20px;
      color: #856404;
    }
    
    .instructions li {
      margin: 5px 0;
    }
    
    .pdf-link {
      background: #dc2626;
      color: white;
      padding: 12px 20px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      background: #e5e7eb;
      padding: 10px 15px;
      font-size: 13pt;
      font-weight: bold;
      border-left: 4px solid #2563eb;
      margin-bottom: 15px;
    }
    
    .field {
      margin-bottom: 12px;
      padding: 10px;
      background: #f9fafb;
      border: 1px solid #d1d5db;
      border-radius: 4px;
    }
    
    .field-label {
      font-weight: bold;
      color: #374151;
      font-size: 10pt;
      display: block;
      margin-bottom: 5px;
    }
    
    .field-value {
      color: #1f2937;
      font-size: 11pt;
      padding: 5px;
      background: white;
      border: 1px dashed #9ca3af;
      min-height: 30px;
      display: block;
    }
    
    .field-value.empty {
      color: #9ca3af;
      font-style: italic;
    }
    
    .checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 0;
    }
    
    .checkbox-box {
      width: 18px;
      height: 18px;
      border: 2px solid #000;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14pt;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .pdf-link {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Guida Compilazione CILA</h1>
    <p>Documento: ${doc.number} | Generato: ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT')}</p>
  </div>
  
  <div class="instructions">
    <h2>🔍 Come Compilare il PDF Ufficiale</h2>
    <ol>
      <li>Scarica il PDF ufficiale CILA cliccando sul pulsante rosso qui sotto</li>
      <li>Apri il PDF con <strong>Adobe Acrobat Reader</strong></li>
      <li>Copia i dati da questa pagina e incollali nei campi corrispondenti del PDF</li>
      <li>Salva il PDF compilato</li>
      <li>Stampa questa guida per averla a portata di mano durante la compilazione</li>
    </ol>
    <a href="${CILA_PDF_URL}" target="_blank" class="pdf-link">
      📄 SCARICA PDF UFFICIALE CILA
    </a>
  </div>
  
  <div class="section">
    <div class="section-title">1. DATI DEL COMMITTENTE</div>
    
    <div class="field">
      <span class="field-label">Nome e Cognome / Ragione Sociale:</span>
      <span class="field-value ${!data.client?.name ? 'empty' : ''}">${data.client?.name || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Codice Fiscale / P.IVA:</span>
      <span class="field-value ${!data.client?.fiscalCode ? 'empty' : ''}">${data.client?.fiscalCode || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Indirizzo di residenza/sede:</span>
      <span class="field-value ${!data.client?.address ? 'empty' : ''}">${data.client?.address || '[DA COMPILARE]'}</span>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">2. DATI DELL'IMMOBILE</div>
    
    <div class="field">
      <span class="field-label">Indirizzo dell'intervento:</span>
      <span class="field-value ${!data.property?.address ? 'empty' : ''}">${data.property?.address || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Dati catastali (Foglio, Particella, Sub):</span>
      <span class="field-value ${!data.property?.cadastralData ? 'empty' : ''}">${data.property?.cadastralData || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Zona urbanistica:</span>
      <span class="field-value ${!data.property?.urbanPlanningZone ? 'empty' : ''}">${data.property?.urbanPlanningZone || '[DA COMPILARE]'}</span>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">3. DESCRIZIONE DELL'INTERVENTO</div>
    
    <div class="field">
      <span class="field-label">Tipologia di intervento:</span>
      <span class="field-value ${!data.interventionType ? 'empty' : ''}">${data.interventionType || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Data prevista di inizio lavori:</span>
      <span class="field-value ${!data.startDate ? 'empty' : ''}">${data.startDate ? new Date(data.startDate).toLocaleDateString('it-IT') : '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Durata prevista dei lavori (giorni):</span>
      <span class="field-value ${!data.estimatedDuration ? 'empty' : ''}">${data.estimatedDuration || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Costo presunto dell'intervento (€):</span>
      <span class="field-value ${!data.estimatedCost ? 'empty' : ''}">${data.estimatedCost ? `€ ${data.estimatedCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Descrizione dettagliata dei lavori:</span>
      <span class="field-value ${!data.works?.description ? 'empty' : ''}">${data.works?.description || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Caratteristiche dell'intervento:</span>
      <div class="checkbox">
        <span class="checkbox-box">${data.works?.affectStructure ? '✓' : ''}</span>
        <span>L'intervento interessa le parti strutturali dell'edificio</span>
      </div>
      <div class="checkbox">
        <span class="checkbox-box">${data.works?.affectEnergy ? '✓' : ''}</span>
        <span>L'intervento comporta modifiche dell'efficienza energetica</span>
      </div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">4. DATI DEL TECNICO ASSEVERATORE</div>
    
    <div class="field">
      <span class="field-label">Nome e Cognome:</span>
      <span class="field-value ${!data.technician?.name ? 'empty' : ''}">${data.technician?.name || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Qualifica professionale:</span>
      <span class="field-value ${!data.technician?.qualification ? 'empty' : ''}">${data.technician?.qualification || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Numero iscrizione all'Albo:</span>
      <span class="field-value ${!data.technician?.registrationNumber ? 'empty' : ''}">${data.technician?.registrationNumber || '[DA COMPILARE]'}</span>
    </div>
    
    <div class="field">
      <span class="field-label">Indirizzo PEC:</span>
      <span class="field-value ${!data.technician?.pec ? 'empty' : ''}">${data.technician?.pec || '[DA COMPILARE]'}</span>
    </div>
  </div>
  
  ${doc.notes ? `
  <div class="section">
    <div class="section-title">5. NOTE AGGIUNTIVE</div>
    <div class="field">
      <span class="field-value">${doc.notes}</span>
    </div>
  </div>
  ` : ''}
  
  <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; text-align: center;">
    <p style="font-size: 10pt; color: #6b7280;">
      Documento generato da <strong>EdilSmart</strong> - Sistema di Gestione Cantieri<br>
      Per assistenza: supporto@edilsmart.it
    </p>
  </div>
</body>
</html>
  `;
};
