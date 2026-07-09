import type { Card } from '../types';

const CSV_HEADERS = [
  'Kategorie',
  'Unterkategorie',
  'Titel',
  'Beschreibung',
  'Menge',
  'Verkaufsformat',
  'Preis',
  'Versandprofil',
  'Angebote annehmen',
  'Gefahrgut',
  'Zustand',
  'Stückpreis',
  'Artikelnummer',
  'Bild-URL 1',
  'Bild-URL 2',
  'Bild-URL 3',
  'Bild-URL 4',
  'Bild-URL 5',
  'Bild-URL 6',
  'Bild-URL 7',
  'Bild-URL 8',
];

interface UserSettings {
  kategorie: string;
  unterkategorie: string;
  verkaufsformat: string;
  preis: string;
  versandprofil: string;
  zustand: string;
}

export function generateCSV(cards: Card[], userSettings: UserSettings): string {
  const rows = cards.map((card) => {
    return [
      userSettings.kategorie,
      userSettings.unterkategorie,
      card.final_title || card.ai_title,
      card.final_description || card.ai_description,
      '1',
      userSettings.verkaufsformat,
      userSettings.preis,
      card.shipping_profile || userSettings.versandprofil,
      '',
      '',
      card.condition || userSettings.zustand,
      '',
      '',
      card.image_url,
      '', // Bild-URL 2
      '', // Bild-URL 3
      '', // Bild-URL 4
      '', // Bild-URL 5
      '', // Bild-URL 6
      '', // Bild-URL 7
      '', // Bild-URL 8
    ];
  });

  const headerRow = CSV_HEADERS.join(',');
  const dataRows = rows.map((row) => 
    row.map((cell) => {
      // Escape quotes and wrap in quotes if contains comma or quote
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

export function downloadCSV(csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `whatnot-export-${date}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
