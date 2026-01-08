// Servizio per generare PDF compilabili da template
import { Document, CILAData } from '../types';
import { getCustomTemplateByType } from './customTemplateService';

// Genera HTML che replica il layout del template PDF ufficiale
export const generatePDFLikeHTML = (doc: Document): string => {
    const customTemplate = getCustomTemplateByType(doc.type);

    // Se non c'è template personalizzato, usa il template di default
    if (!customTemplate) {
        return null;
    }

    // Genera HTML che replica il PDF ufficiale
    const data = doc.data as Partial<CILAData>;

    return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.type} - ${doc.number}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #000;
      background: white;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: white;
      padding: 20mm;
      position: relative;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }
    
    .header h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    
    .header .subtitle {
      font-size: 12pt;
      margin-bottom: 10px;
    }
    
    .header .doc-number {
      font-size: 10pt;
      margin-top: 10px;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      background: #f0f0f0;
      padding: 8px 12px;
      margin-bottom: 12px;
      border-left: 4px solid #000;
    }
    
    .field-row {
      display: flex;
      margin-bottom: 10px;
      align-items: baseline;
    }
    
    .field-label {
      font-weight: bold;
      min-width: 180px;
      font-size: 9pt;
    }
    
    .field-value {
      flex: 1;
      border-bottom: 1px solid #000;
      padding: 2px 5px;
      min-height: 20px;
    }
    
    .field-value.empty {
      color: #999;
      font-style: italic;
    }
    
    .checkbox-group {
      margin: 10px 0;
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
      margin: 5px 0;
    }
    
    .checkbox {
      width: 14px;
      height: 14px;
      border: 1px solid #000;
      margin-right: 8px;
      display: inline-block;
      position: relative;
    }
    
    .checkbox.checked::after {
      content: '✓';
      position: absolute;
      top: -2px;
      left: 2px;
      font-size: 12pt;
      font-weight: bold;
    }
    
    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    
    .signature-box {
      border: 1px solid #000;
      padding: 15px;
      margin: 15px 0;
      min-height: 80px;
    }
    
    .signature-line {
      border-top: 1px solid #000;
      margin-top: 50px;
      padding-top: 5px;
      text-align: center;
      font-size: 9pt;
    }
    
    .footer {
      position: absolute;
      bottom: 15mm;
      left: 20mm;
      right: 20mm;
      text-align: center;
      font-size: 8pt;
      color: #666;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }
    
    .normative-ref {
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 10px;
      margin: 15px 0;
      font-size: 9pt;
      font-style: italic;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
    }
    
    table th {
      background: #000;
      color: white;
      padding: 8px;
      text-align: left;
      font-weight: bold;
    }
    
    table td {
      border: 1px solid #000;
      padding: 6px;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .page {
        margin: 0;
        border: none;
        box-shadow: none;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>${doc.type}</h1>
      <div class="subtitle">Comunicazione Inizio Lavori Asseverata</div>
      <div class="doc-number">
        N. ${doc.number} del ${new Date(doc.createdDate).toLocaleDateString('it-IT')}
      </div>
    </div>
    
    <!-- Riferimento Normativo -->
    <div class="normative-ref">
      <strong>Riferimento Normativo:</strong> Art. 6-bis D.P.R. 380/2001 - Testo Unico Edilizia
    </div>
    
    <!-- Sezione 1: Dati del Committente -->
    <div class="section">
      <div class="section-title">1. DATI DEL COMMITTENTE</div>
      
      <div class="field-row">
        <span class="field-label">Nome e Cognome / Ragione Sociale:</span>
        <span class="field-value">${data.client?.name || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Codice Fiscale / P.IVA:</span>
        <span class="field-value">${data.client?.fiscalCode || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Indirizzo Completo:</span>
        <span class="field-value">${data.client?.address || ''}</span>
      </div>
    </div>
    
    <!-- Sezione 2: Dati dell'Immobile -->
    <div class="section">
      <div class="section-title">2. DATI DELL'IMMOBILE</div>
      
      <div class="field-row">
        <span class="field-label">Indirizzo Cantiere:</span>
        <span class="field-value">${data.property?.address || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Dati Catastali:</span>
        <span class="field-value">${data.property?.cadastralData || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Zona Urbanistica:</span>
        <span class="field-value">${data.property?.urbanPlanningZone || ''}</span>
      </div>
    </div>
    
    <!-- Sezione 3: Descrizione Intervento -->
    <div class="section">
      <div class="section-title">3. DESCRIZIONE INTERVENTO</div>
      
      <div class="field-row">
        <span class="field-label">Tipologia Intervento:</span>
        <span class="field-value">${data.interventionType || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Data Inizio Lavori:</span>
        <span class="field-value">${data.startDate ? new Date(data.startDate).toLocaleDateString('it-IT') : ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Durata Prevista (giorni):</span>
        <span class="field-value">${data.estimatedDuration || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Costo Stimato (€):</span>
        <span class="field-value">${data.estimatedCost ? '€ ' + data.estimatedCost.toLocaleString('it-IT', { minimumFractionDigits: 2 }) : ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Descrizione Lavori:</span>
        <span class="field-value">${data.works?.description || ''}</span>
      </div>
      
      <div class="checkbox-group">
        <div class="checkbox-item">
          <span class="checkbox ${data.works?.affectStructure ? 'checked' : ''}"></span>
          <span>L'intervento interessa parti strutturali</span>
        </div>
        <div class="checkbox-item">
          <span class="checkbox ${data.works?.affectEnergy ? 'checked' : ''}"></span>
          <span>L'intervento interessa l'efficienza energetica</span>
        </div>
      </div>
    </div>
    
    <!-- Sezione 4: Tecnico Asseveratore -->
    <div class="section">
      <div class="section-title">4. TECNICO ASSEVERATORE</div>
      
      <div class="field-row">
        <span class="field-label">Nome e Cognome:</span>
        <span class="field-value">${data.technician?.name || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Qualifica:</span>
        <span class="field-value">${data.technician?.qualification || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">Numero Iscrizione Albo:</span>
        <span class="field-value">${data.technician?.registrationNumber || ''}</span>
      </div>
      
      <div class="field-row">
        <span class="field-label">PEC:</span>
        <span class="field-value">${data.technician?.pec || ''}</span>
      </div>
    </div>
    
    <!-- Sezione 5: Dichiarazioni e Firme -->
    <div class="signature-section">
      <div class="section-title">5. DICHIARAZIONI E FIRME</div>
      
      <p style="margin: 15px 0; font-size: 9pt; line-height: 1.6;">
        Il sottoscritto tecnico dichiara, sotto la propria responsabilità, che i lavori sono conformi 
        agli strumenti urbanistici approvati e ai regolamenti edilizi vigenti, nonché che sono compatibili 
        con la normativa in materia sismica e con quella sul rendimento energetico nell'edilizia.
      </p>
      
      <div class="signature-box">
        <strong>Firma del Tecnico Asseveratore</strong>
        <div class="signature-line">
          ${data.technician?.name || '(Firma digitale o autografa)'}
        </div>
      </div>
      
      <div class="signature-box">
        <strong>Firma del Committente</strong>
        <div class="signature-line">
          ${data.client?.name || '(Firma per accettazione)'}
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>Documento generato da EdilSmart - Sistema di Gestione Cantieri</p>
      <p>Data generazione: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</p>
    </div>
  </div>
</body>
</html>
  `;
};
