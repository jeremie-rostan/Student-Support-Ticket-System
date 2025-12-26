export type TicketStatus = 'new' | 'in-progress' | 'resolved';

export interface Student {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  content: string;
  timestamp: Date;
  author: string;
  source: 'manual' | 'audio-transcription' | 'assembly-transcription';
  utterances?: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  summary?: string;
}

export interface Ticket {
  id: string;
  date: string;
  studentIds: string[];
  category: string;
  status: TicketStatus;
  details: string;
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
}

export interface TicketState {
  students: Student[];
  tickets: Ticket[];
  categories: Category[];
  settings: {
    theme: 'light' | 'dark';
    lmStudioModel: string;
    assemblyAIKey?: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
