import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

type CompanionType = 'Parente' | 'Bambino';

type Companion = {
  name: string;
  type: CompanionType;
};

type RsvpPayload = {
  firstName: string;
  lastName: string;
  allergies: string;
  companions: Companion[];
};

const HEADERS = [
  'Timestamp',
  'Nome',
  'Cognome',
  'Intolleranze',
  'Totale Persone',
  'Accompagnatori'
];

const dataDir = path.join(process.cwd(), 'data');
const workbookPath = path.join(dataDir, 'rsvp.xlsx');

function isCompanionType(value: string): value is CompanionType {
  return value === 'Parente' || value === 'Bambino';
}

function isValidPayload(value: unknown): value is RsvpPayload {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<RsvpPayload>;

  if (typeof candidate.firstName !== 'string' || typeof candidate.lastName !== 'string' || typeof candidate.allergies !== 'string') {
    return false;
  }

  if (!Array.isArray(candidate.companions)) {
    return false;
  }

  return candidate.companions.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Companion).name === 'string' &&
      isCompanionType((item as Companion).type)
  );
}

async function getWorkbook() {
  try {
    const fileBuffer = await readFile(workbookPath);
    return XLSX.read(fileBuffer, { type: 'buffer' });
  } catch {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([HEADERS]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'RSVP');
    return workbook;
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!isValidPayload(body)) {
      return NextResponse.json({ ok: false, message: 'Dati RSVP non validi.' }, { status: 400 });
    }

    const firstName = body.firstName.trim();
    const lastName = body.lastName.trim();
    const allergies = body.allergies.trim() || 'Nessuna';
    const companions = body.companions
      .map((item) => ({ name: item.name.trim(), type: item.type }))
      .filter((item) => item.name.length > 0);

    if (!firstName || !lastName) {
      return NextResponse.json({ ok: false, message: 'Nome e cognome sono obbligatori.' }, { status: 400 });
    }

    const workbook = await getWorkbook();
    const sheetName = workbook.SheetNames[0] || 'RSVP';
    const sheet = workbook.Sheets[sheetName] || XLSX.utils.aoa_to_sheet([HEADERS]);

    const companionsLabel =
      companions.length === 0 ? 'Nessuno' : companions.map((item) => `${item.name} (${item.type})`).join('; ');

    const newRow = {
      Timestamp: new Date().toISOString(),
      Nome: firstName,
      Cognome: lastName,
      Intolleranze: allergies,
      'Totale Persone': 1 + companions.length,
      Accompagnatori: companionsLabel
    };

    XLSX.utils.sheet_add_json(sheet, [newRow], { skipHeader: true, origin: -1 });
    workbook.Sheets[sheetName] = sheet;

    await mkdir(dataDir, { recursive: true });

    const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
    await writeFile(workbookPath, output);

    return NextResponse.json({ ok: true, message: 'RSVP salvato con successo.' });
  } catch {
    return NextResponse.json({ ok: false, message: 'Errore interno durante il salvataggio RSVP.' }, { status: 500 });
  }
}

