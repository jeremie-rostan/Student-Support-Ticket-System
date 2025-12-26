import { IncidentState } from '@/types';

export const defaultState: IncidentState = {
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

export async function loadState(): Promise<IncidentState> {
  if (typeof window === 'undefined') return defaultState;

  try {
    const response = await fetch('/api/incidents');
    if (!response.ok) return defaultState;
    const data = await response.json();
    
    return {
      ...defaultState,
      ...data,
      settings: { ...defaultState.settings, ...data.settings },
    };
  } catch (error) {
    console.error('Failed to load state:', error);
    return defaultState;
  }
}

export async function saveState(state: IncidentState): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

export async function clearState(): Promise<void> {
  await saveState(defaultState);
}
