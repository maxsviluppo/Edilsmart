import { Document, CILAData, PSCData, DiCoData, SALData } from '../types';
import { generateFilledTemplate } from './customTemplateService';
import { generateCompilationGuide } from './pdfCompilationService';

// Template HTML base con stili professionali
const getBaseTemplate = (title: string, content: string): string => {
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
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
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    
    .document {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 20mm;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #2563eb;
      font-size: 24pt;
      margin-bottom: 10px;
      font-weight: bold;
    }
    
    .header .subtitle {
      color: #64748b;
      font-size: 12pt;
      margin-bottom: 5px;
    }
    
    .header .doc-info {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      font-size: 10pt;
      color: #64748b;
    }
    
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    
    .section-title {
      background: #f1f5f9;
      padding: 10px 15px;
      border-left: 4px solid #2563eb;
      font-size: 14pt;
      font-weight: bold;
      color: #1e293b;
      margin-bottom: 15px;
    }
    
    .field-group {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .field {
      margin-bottom: 12px;
    }
    
    .field-label {
      font-weight: bold;
      color: #475569;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      display: block;
    }
    
    .field-value {
      color: #1e293b;
      font-size: 11pt;
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      min-height: 35px;
      display: flex;
      align-items: center;
    }
    
    .field-value.empty {
      color: #94a3b8;
      font-style: italic;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10pt;
    }
    
    table thead {
      background: #2563eb;
      color: white;
    }
    
    table th {
      padding: 12px 10px;
      text-align: left;
      font-weight: bold;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    table tbody tr:hover {
      background: #f8fafc;
    }
    
    .checkbox {
      display: inline-flex;
      align-items: center;
      margin-right: 20px;
      margin-bottom: 10px;
    }
    
    .checkbox input {
      margin-right: 8px;
      width: 16px;
      height: 16px;
    }
    
    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }
    
    .signature-box {
      border: 1px solid #cbd5e1;
      padding: 20px;
      margin-top: 15px;
      min-height: 100px;
      background: #fafafa;
    }
    
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 5px;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      text-align: center;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .badge-success {
      background: #dcfce7;
      color: #166534;
    }
    
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }
    
    .badge-info {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .normative-ref {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
      padding: 12px 15px;
      margin: 20px 0;
      font-size: 9pt;
      color: #1e40af;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .document {
        padding: 0;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>
  <div class="document">
    ${content}
  </div>
</body>
</html>
  `;
};

// Template CILA
export const generateCILATemplate = (doc: Document): string => {
  const data = doc.data as Partial<CILAData>;

  const content = `
    <div class="header">
      <h1>CILA</h1>
      <div class="subtitle">Comunicazione Inizio Lavori Asseverata</div>
      <div class="doc-info">
        <span><strong>Numero:</strong> ${doc.number || 'N/A'}</span>
        <span><strong>Data:</strong> ${new Date(doc.createdDate).toLocaleDateString('it-IT')}</span>
        <span><strong>Stato:</strong> <span class="badge badge-info">${doc.status}</span></span>
      </div>
    </div>
    
    <div class="normative-ref">
      <strong>Riferimento Normativo:</strong> Art. 6-bis D.P.R. 380/2001 - Testo Unico Edilizia
    </div>
    
    <div class="section">
      <div class="section-title">1. Dati del Committente</div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Nome e Cognome / Ragione Sociale</span>
          <div class="field-value">${data.client?.name || 'Da compilare'}</div>
        </div>
        <div class="field">
          <span class="field-label">Codice Fiscale / P.IVA</span>
          <div class="field-value">${data.client?.fiscalCode || 'Da compilare'}</div>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Indirizzo</span>
        <div class="field-value">${data.client?.address || 'Da compilare'}</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">2. Dati dell'Immobile</div>
      <div class="field">
        <span class="field-label">Indirizzo Cantiere</span>
        <div class="field-value">${data.property?.address || 'Da compilare'}</div>
      </div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Dati Catastali</span>
          <div class="field-value">${data.property?.cadastralData || 'Da compilare'}</div>
        </div>
        <div class="field">
          <span class="field-label">Zona Urbanistica</span>
          <div class="field-value">${data.property?.urbanPlanningZone || 'Da compilare'}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">3. Descrizione Intervento</div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Tipologia Intervento</span>
          <div class="field-value">${data.interventionType || 'Manutenzione Straordinaria'}</div>
        </div>
        <div class="field">
          <span class="field-label">Data Inizio Lavori</span>
          <div class="field-value">${data.startDate ? new Date(data.startDate).toLocaleDateString('it-IT') : 'Da definire'}</div>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Durata Prevista</span>
          <div class="field-value">${data.estimatedDuration || 0} giorni</div>
        </div>
        <div class="field">
          <span class="field-label">Costo Stimato</span>
          <div class="field-value">€ ${(data.estimatedCost || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Descrizione Lavori</span>
        <div class="field-value">${data.works?.description || 'Da compilare'}</div>
      </div>
      <div class="field">
        <span class="field-label">Caratteristiche Intervento</span>
        <div class="field-value">
          <div class="checkbox">
            <input type="checkbox" ${data.works?.affectStructure ? 'checked' : ''} disabled>
            <label>Interessa parti strutturali</label>
          </div>
          <div class="checkbox">
            <input type="checkbox" ${data.works?.affectEnergy ? 'checked' : ''} disabled>
            <label>Interessa efficienza energetica</label>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">4. Tecnico Asseveratore</div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Nome e Cognome</span>
          <div class="field-value">${data.technician?.name || 'Da compilare'}</div>
        </div>
        <div class="field">
          <span class="field-label">Qualifica</span>
          <div class="field-value">${data.technician?.qualification || 'Da compilare'}</div>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Numero Iscrizione Albo</span>
          <div class="field-value">${data.technician?.registrationNumber || 'Da compilare'}</div>
        </div>
        <div class="field">
          <span class="field-label">PEC</span>
          <div class="field-value">${data.technician?.pec || 'Da compilare'}</div>
        </div>
      </div>
    </div>
    
    <div class="signature-section">
      <div class="section-title">Dichiarazioni e Firme</div>
      <p style="margin-bottom: 15px;">
        Il sottoscritto tecnico dichiara, sotto la propria responsabilità, che i lavori sono conformi 
        agli strumenti urbanistici approvati e ai regolamenti edilizi vigenti, nonché che sono compatibili 
        con la normativa in materia sismica e con quella sul rendimento energetico nell'edilizia.
      </p>
      
      <div class="signature-box">
        <strong>Firma del Tecnico Asseveratore</strong>
        <div class="signature-line">
          (Firma digitale o autografa)
        </div>
      </div>
      
      <div class="signature-box">
        <strong>Firma del Committente</strong>
        <div class="signature-line">
          (Firma per accettazione)
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Documento generato da EdilSmart - Sistema di Gestione Cantieri</p>
      <p>Data generazione: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}</p>
    </div>
  `;

  return getBaseTemplate(`CILA - ${doc.number}`, content);
};

// Template PSC
export const generatePSCTemplate = (doc: Document): string => {
  const data = doc.data as Partial<PSCData>;

  const content = `
    <div class="header">
      <h1>PSC</h1>
      <div class="subtitle">Piano di Sicurezza e Coordinamento</div>
      <div class="doc-info">
        <span><strong>Numero:</strong> ${doc.number || 'N/A'}</span>
        <span><strong>Data:</strong> ${new Date(doc.createdDate).toLocaleDateString('it-IT')}</span>
        <span><strong>Stato:</strong> <span class="badge badge-warning">${doc.status}</span></span>
      </div>
    </div>
    
    <div class="normative-ref">
      <strong>Riferimento Normativo:</strong> D.Lgs. 81/2008 - Art. 100 - Testo Unico Sicurezza sul Lavoro
    </div>
    
    <div class="section">
      <div class="section-title">1. Coordinatore per la Sicurezza in Fase di Progettazione</div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Nome e Cognome</span>
          <div class="field-value">${data.coordinator?.name || 'Da nominare'}</div>
        </div>
        <div class="field">
          <span class="field-label">Qualifica</span>
          <div class="field-value">${data.coordinator?.qualification || 'Coordinatore Sicurezza'}</div>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Numero Iscrizione</span>
        <div class="field-value">${data.coordinator?.registrationNumber || 'Da compilare'}</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">2. Dati del Cantiere</div>
      <div class="field">
        <span class="field-label">Indirizzo</span>
        <div class="field-value">${data.worksite?.address || 'Da compilare'}</div>
      </div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Data Inizio Lavori</span>
          <div class="field-value">${data.worksite?.startDate ? new Date(data.worksite.startDate).toLocaleDateString('it-IT') : 'Da definire'}</div>
        </div>
        <div class="field">
          <span class="field-label">Durata Prevista</span>
          <div class="field-value">${data.worksite?.estimatedDuration || 0} giorni</div>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Numero Lavoratori Previsti</span>
          <div class="field-value">${data.worksite?.estimatedWorkers || 0}</div>
        </div>
        <div class="field">
          <span class="field-label">Uomini-Giorno Stimati</span>
          <div class="field-value">${data.worksite?.estimatedManDays || 0}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">3. Imprese Esecutrici</div>
      ${data.companies && data.companies.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Ragione Sociale</th>
              <th>P.IVA</th>
              <th>Ruolo</th>
            </tr>
          </thead>
          <tbody>
            ${data.companies.map(company => `
              <tr>
                <td>${company.name}</td>
                <td>${company.vatNumber}</td>
                <td>${company.role}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #94a3b8; font-style: italic;">Nessuna impresa inserita</p>'}
    </div>
    
    <div class="section page-break">
      <div class="section-title">4. Analisi dei Rischi</div>
      ${data.risks && data.risks.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Tipo Rischio</th>
              <th>Descrizione</th>
              <th>Misure di Prevenzione</th>
              <th>DPI Richiesti</th>
            </tr>
          </thead>
          <tbody>
            ${data.risks.map(risk => `
              <tr>
                <td><strong>${risk.type}</strong></td>
                <td>${risk.description}</td>
                <td>${risk.preventionMeasures}</td>
                <td>${risk.protectionEquipment?.join(', ') || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #94a3b8; font-style: italic;">Analisi dei rischi da completare</p>'}
    </div>
    
    <div class="signature-section">
      <div class="section-title">Approvazione e Firme</div>
      
      <div class="signature-box">
        <strong>Il Coordinatore per la Sicurezza in Fase di Progettazione</strong>
        <div class="signature-line">
          ${data.coordinator?.name || '___________________________'}
        </div>
      </div>
      
      <div class="signature-box">
        <strong>Il Committente / Responsabile dei Lavori</strong>
        <div class="signature-line">
          ___________________________
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Piano di Sicurezza e Coordinamento - D.Lgs. 81/2008</p>
      <p>Documento generato da EdilSmart il ${new Date().toLocaleDateString('it-IT')}</p>
    </div>
  `;

  return getBaseTemplate(`PSC - ${doc.number}`, content);
};

// Template DiCo Impianti
export const generateDiCoTemplate = (doc: Document): string => {
  const data = doc.data as Partial<DiCoData>;

  const content = `
    <div class="header">
      <h1>DiCo</h1>
      <div class="subtitle">Dichiarazione di Conformità degli Impianti</div>
      <div class="doc-info">
        <span><strong>Numero:</strong> ${doc.number || 'N/A'}</span>
        <span><strong>Data:</strong> ${new Date(doc.createdDate).toLocaleDateString('it-IT')}</span>
        <span><strong>Tipo Impianto:</strong> <span class="badge badge-success">${data.systemType || 'N/A'}</span></span>
      </div>
    </div>
    
    <div class="normative-ref">
      <strong>Riferimento Normativo:</strong> D.M. 37/2008 - Regolamento Impianti
    </div>
    
    <div class="section">
      <div class="section-title">1. Dati dell'Installatore</div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Ragione Sociale</span>
          <div class="field-value">${data.installer?.name || 'Da compilare'}</div>
        </div>
        <div class="field">
          <span class="field-label">Partita IVA</span>
          <div class="field-value">${data.installer?.vatNumber || 'Da compilare'}</div>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Numero Iscrizione Camera di Commercio</span>
        <div class="field-value">${data.installer?.registrationNumber || 'Da compilare'}</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">2. Dati dell'Impianto</div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Tipologia Impianto</span>
          <div class="field-value">${data.systemType || 'Da specificare'}</div>
        </div>
        <div class="field">
          <span class="field-label">Data Installazione</span>
          <div class="field-value">${data.installationDate ? new Date(data.installationDate).toLocaleDateString('it-IT') : 'Da definire'}</div>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Norme Tecniche Rispettate</span>
        <div class="field-value">
          ${data.standards && data.standards.length > 0
      ? data.standards.map(std => `<span class="badge badge-info" style="margin: 2px;">${std}</span>`).join(' ')
      : 'Da specificare'}
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">3. Materiali Utilizzati</div>
      ${data.materials && data.materials.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Descrizione</th>
              <th>Marca</th>
              <th>Marchio di Certificazione</th>
            </tr>
          </thead>
          <tbody>
            ${data.materials.map(material => `
              <tr>
                <td>${material.description}</td>
                <td>${material.brand}</td>
                <td>${material.certificationMark}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #94a3b8; font-style: italic;">Elenco materiali da compilare</p>'}
    </div>
    
    <div class="section">
      <div class="section-title">4. Verifiche e Prove Effettuate</div>
      ${data.tests && data.tests.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Tipo Prova</th>
              <th>Risultato</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${data.tests.map(test => `
              <tr>
                <td>${test.type}</td>
                <td><span class="badge badge-success">${test.result}</span></td>
                <td>${new Date(test.date).toLocaleDateString('it-IT')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #94a3b8; font-style: italic;">Prove da effettuare</p>'}
    </div>
    
    <div class="section">
      <div class="section-title">5. Dichiarazioni</div>
      <div class="field">
        <span class="field-label">L'installatore dichiara che:</span>
        <div class="field-value">
          <div class="checkbox">
            <input type="checkbox" ${data.declarations?.conformityToProject ? 'checked' : ''} disabled>
            <label>L'impianto è conforme al progetto</label>
          </div>
          <div class="checkbox">
            <input type="checkbox" ${data.declarations?.safetyRules ? 'checked' : ''} disabled>
            <label>Sono state rispettate le norme di sicurezza</label>
          </div>
          <div class="checkbox">
            <input type="checkbox" ${data.declarations?.goodWorkmanship ? 'checked' : ''} disabled>
            <label>L'impianto è stato realizzato a regola d'arte</label>
          </div>
        </div>
      </div>
    </div>
    
    <div class="signature-section">
      <div class="signature-box">
        <strong>Il Responsabile Tecnico dell'Impresa Installatrice</strong>
        <div class="signature-line">
          ${data.installer?.name || '___________________________'}
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Dichiarazione di Conformità - D.M. 37/2008</p>
      <p>Documento generato da EdilSmart il ${new Date().toLocaleDateString('it-IT')}</p>
    </div>
  `;

  return getBaseTemplate(`DiCo ${data.systemType} - ${doc.number}`, content);
};

// Template SAL
export const generateSALTemplate = (doc: Document): string => {
  const data = doc.data as Partial<SALData>;

  const content = `
    <div class="header">
      <h1>SAL N° ${data.number || '___'}</h1>
      <div class="subtitle">Stato Avanzamento Lavori</div>
      <div class="doc-info">
        <span><strong>Numero:</strong> ${doc.number || 'N/A'}</span>
        <span><strong>Data:</strong> ${new Date(doc.createdDate).toLocaleDateString('it-IT')}</span>
        <span><strong>Progetto:</strong> ${doc.projectName || 'N/A'}</span>
      </div>
    </div>
    
    <div class="normative-ref">
      <strong>Riferimento Normativo:</strong> D.P.R. 207/2010 - Regolamento di esecuzione del Codice dei Contratti Pubblici
    </div>
    
    <div class="section">
      <div class="section-title">1. Periodo di Riferimento</div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Dal</span>
          <div class="field-value">${data.period?.from ? new Date(data.period.from).toLocaleDateString('it-IT') : 'Da definire'}</div>
        </div>
        <div class="field">
          <span class="field-label">Al</span>
          <div class="field-value">${data.period?.to ? new Date(data.period.to).toLocaleDateString('it-IT') : 'Da definire'}</div>
        </div>
      </div>
      <div class="field">
        <span class="field-label">Percentuale Avanzamento Complessivo</span>
        <div class="field-value">
          <strong style="font-size: 14pt; color: #2563eb;">${(data.progressPercentage || 0).toFixed(2)}%</strong>
        </div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">2. Lavorazioni Eseguite nel Periodo</div>
      ${data.worksCompleted && data.worksCompleted.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th style="width: 40%;">Descrizione</th>
              <th style="width: 12%;">Quantità</th>
              <th style="width: 10%;">U.M.</th>
              <th style="width: 18%;">Prezzo Unitario</th>
              <th style="width: 20%;">Importo</th>
            </tr>
          </thead>
          <tbody>
            ${data.worksCompleted.map(work => `
              <tr>
                <td>${work.description}</td>
                <td style="text-align: right;">${work.quantity.toFixed(2)}</td>
                <td>${work.unit}</td>
                <td style="text-align: right;">€ ${work.unitPrice.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right;"><strong>€ ${work.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p style="color: #94a3b8; font-style: italic;">Nessuna lavorazione inserita</p>'}
    </div>
    
    <div class="section">
      <div class="section-title">3. Riepilogo Economico</div>
      <table>
        <tbody>
          <tr>
            <td style="width: 70%; font-weight: bold;">Importo Lavori Precedenti</td>
            <td style="text-align: right; width: 30%;">€ ${(data.previousAmount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">Importo Lavori Correnti</td>
            <td style="text-align: right;">€ ${(data.currentAmount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr style="background: #f1f5f9;">
            <td style="font-weight: bold; font-size: 12pt;">TOTALE LAVORI ESEGUITI</td>
            <td style="text-align: right; font-weight: bold; font-size: 12pt;">€ ${(data.totalAmount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td>Ritenuta di Garanzia (${data.retentionPercentage || 5}%)</td>
            <td style="text-align: right; color: #dc2626;">- € ${(data.retentionAmount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr style="background: #dbeafe; border-top: 2px solid #2563eb;">
            <td style="font-weight: bold; font-size: 14pt; color: #1e40af;">NETTO A PAGARE</td>
            <td style="text-align: right; font-weight: bold; font-size: 14pt; color: #1e40af;">€ ${(data.netAmount || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="signature-section">
      <div class="section-title">Approvazione</div>
      
      <div class="signature-box">
        <strong>Il Direttore dei Lavori</strong>
        <div class="signature-line">
          ___________________________
        </div>
      </div>
      
      <div class="signature-box">
        <strong>Il Responsabile del Procedimento</strong>
        <div class="signature-line">
          ___________________________
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>Stato Avanzamento Lavori N° ${data.number || '___'}</p>
      <p>Documento generato da EdilSmart il ${new Date().toLocaleDateString('it-IT')}</p>
    </div>
  `;

  return getBaseTemplate(`SAL ${data.number} - ${doc.number}`, content);
};

// Template generico per altri documenti
export const generateGenericTemplate = (doc: Document): string => {
  const content = `
    <div class="header">
      <h1>${doc.type}</h1>
      <div class="subtitle">${doc.category}</div>
      <div class="doc-info">
        <span><strong>Numero:</strong> ${doc.number || 'N/A'}</span>
        <span><strong>Data:</strong> ${new Date(doc.createdDate).toLocaleDateString('it-IT')}</span>
        <span><strong>Stato:</strong> <span class="badge badge-info">${doc.status}</span></span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Informazioni Documento</div>
      <div class="field-group">
        <div class="field">
          <span class="field-label">Progetto</span>
          <div class="field-value">${doc.projectName || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Responsabile</span>
          <div class="field-value">${doc.responsiblePerson || 'Da assegnare'}</div>
        </div>
      </div>
      ${doc.expiryDate ? `
        <div class="field">
          <span class="field-label">Data Scadenza</span>
          <div class="field-value">${new Date(doc.expiryDate).toLocaleDateString('it-IT')}</div>
        </div>
      ` : ''}
    </div>
    
    <div class="section">
      <div class="section-title">Dati del Documento</div>
      <pre style="background: #f8fafc; padding: 20px; border-radius: 8px; overflow-x: auto; font-size: 10pt;">
${JSON.stringify(doc.data, null, 2)}
      </pre>
    </div>
    
    ${doc.notes ? `
      <div class="section">
        <div class="section-title">Note</div>
        <div class="field-value">${doc.notes}</div>
      </div>
    ` : ''}
    
    <div class="signature-section">
      <div class="signature-box">
        <strong>Firma del Responsabile</strong>
        <div class="signature-line">
          ${doc.responsiblePerson || '___________________________'}
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>${doc.type} - ${doc.category}</p>
      <p>Documento generato da EdilSmart il ${new Date().toLocaleDateString('it-IT')}</p>
    </div>
  `;

  return getBaseTemplate(doc.type, content);
};

// Funzione principale per generare il template corretto
export const generateDocumentTemplate = (doc: Document): string => {
  // Per CILA, usa sempre la guida di compilazione con link al PDF ufficiale
  if (doc.type === 'CILA') {
    return generateCompilationGuide(doc);
  }

  // Prima controlla se esiste un template personalizzato
  const customTemplate = generateFilledTemplate(doc.type, doc.data);

  if (customTemplate) {
    // Se esiste un template personalizzato, usalo
    // Se è un PDF (data:application/pdf), crea un HTML che lo mostra in iframe
    if (customTemplate.startsWith('data:application/pdf')) {
      return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.type} - ${doc.number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      background: #f5f5f5;
    }
    
    .pdf-container {
      width: 100%;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .pdf-header {
      background: #2563eb;
      color: white;
      padding: 15px 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .pdf-header h1 {
      font-size: 18px;
      margin-bottom: 5px;
    }
    
    .pdf-header p {
      font-size: 12px;
      opacity: 0.9;
    }
    
    iframe {
      flex: 1;
      border: none;
      width: 100%;
    }
    
    .pdf-info {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 12px 20px;
      color: #856404;
      font-size: 13px;
      text-align: center;
    }
    
    @media print {
      .pdf-header, .pdf-info {
        display: none;
      }
      
      iframe {
        height: 100vh;
      }
    }
  </style>
</head>
<body>
  <div class="pdf-container">
    <div class="pdf-header">
      <h1>${doc.type} - ${doc.number}</h1>
      <p>Template Ufficiale Caricato | Data: ${new Date(doc.createdDate).toLocaleDateString('it-IT')}</p>
    </div>
    
    <div class="pdf-info">
      📄 Template PDF Ufficiale - I dati sono stati compilati nel modulo di modifica. 
      Usa il pulsante "Modifica" per inserire i dati del progetto.
    </div>
    
    <iframe src="${customTemplate}" type="application/pdf"></iframe>
  </div>
</body>
</html>
      `;
    }

    // Se è HTML, ritorna direttamente
    return customTemplate;
  }

  // Altrimenti usa i template di default
  switch (doc.type) {
    case 'PSC':
      return generatePSCTemplate(doc);
    case 'DiCo Impianti':
      return generateDiCoTemplate(doc);
    case 'SAL':
      return generateSALTemplate(doc);
    default:
      return generateGenericTemplate(doc);
  }
};
