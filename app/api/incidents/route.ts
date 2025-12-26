import { NextRequest, NextResponse } from 'next/server';
import { IncidentState } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');
const TEMPLATE_FILE = path.join(DATA_DIR, 'incidents.json.template');

// Simple mutex to serialize write operations
let writeLock: Promise<void> = Promise.resolve();

const defaultState: IncidentState = {
  students: [],
  incidents: [],
  categories: [
    {
      id: 'academic',
      name: 'Academic',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
      id: 'behavioral',
      name: 'Behavioral',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    {
      id: 'sel',
      name: 'SEL',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
    },
  ],
  settings: {
    theme: 'light',
    lmStudioModel: 'llama-3.2-3b',
  },
};

async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function loadIncidentData(): Promise<IncidentState> {
  try {
    await fs.access(INCIDENTS_FILE);
    const data = await fs.readFile(INCIDENTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    
    return {
      ...defaultState,
      ...parsed,
      settings: { ...defaultState.settings, ...parsed.settings },
    };
  } catch {
    return defaultState;
  }
}

async function saveIncidentData(state: IncidentState): Promise<void> {
  // Serialize all write operations using mutex
  const previousLock = writeLock;
  let releaseLock: () => void;
  writeLock = new Promise(resolve => {
    releaseLock = resolve;
  });

  try {
    await previousLock;
    await ensureDataDirectory();

    // Use timestamp + random string to ensure unique temp file names
    const uniqueId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const tempFile = path.join(DATA_DIR, `incidents-${uniqueId}.tmp`);

    try {
      // Write temp file
      await fs.writeFile(tempFile, JSON.stringify(state, null, 2), 'utf-8');

      // Atomic rename
      await fs.rename(tempFile, INCIDENTS_FILE);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempFile);
      } catch {
        // Ignore cleanup errors
      }

      // Fallback: write directly
      await fs.writeFile(INCIDENTS_FILE, JSON.stringify(state, null, 2), 'utf-8');
    }
  } finally {
    releaseLock!();
  }
}

export async function GET() {
  try {
    await ensureDataDirectory();

    let state = await loadIncidentData();

    if (state.categories.length === 0) {
      try {
        const templateData = await fs.readFile(TEMPLATE_FILE, 'utf-8');
        const parsed = JSON.parse(templateData);
        state = {
          ...defaultState,
          ...parsed,
          settings: { ...defaultState.settings, ...parsed.settings },
        };
        await saveIncidentData(state);
      } catch {
        state = defaultState;
        await saveIncidentData(state);
      }
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error('Failed to load incidents data:', error);
    return NextResponse.json(defaultState);
  }
}

export async function POST(req: NextRequest) {
  try {
    const state = (await req.json()) as IncidentState;
    await saveIncidentData(state);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save incidents data:', error);
    return NextResponse.json({ error: 'Failed to save incidents data' }, { status: 500 });
  }
}
