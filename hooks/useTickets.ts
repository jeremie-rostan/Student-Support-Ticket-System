'use client';

import { useState, useEffect, useCallback } from 'react';

interface Student {
  id: string;
  name: string;
  createdAt: Date;
}

interface Note {
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

interface Ticket {
  id: string;
  date: string;
  studentIds: string[];
  category: string;
  status: 'new' | 'in-progress' | 'resolved';
  details: string;
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  createdAt: Date;
}

interface TicketState {
  students: Student[];
  tickets: Ticket[];
  categories: Category[];
  settings: {
    theme: 'light' | 'dark';
    lmStudioModel: string;
    assemblyAIKey?: string;
  };
}

const defaultState: TicketState = {
  students: [],
  tickets: [],
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

async function loadStateFromAPI(): Promise<TicketState> {
  if (typeof window === 'undefined') return defaultState;

  try {
    const response = await fetch('/api/tickets');
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

async function saveStateToAPI(state: TicketState): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    console.log('[saveStateToAPI] Saving state with', state.students.length, 'students and', state.tickets.length, 'tickets');
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

export function useTickets() {
  const [state, setState] = useState<TicketState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[useTickets mount] Component mounted, loading initial state');
    const load = async () => {
      try {
        const loaded = await loadStateFromAPI();
        console.log('[useTickets mount] Loaded state from API:', loaded.students.length, 'students,', loaded.tickets.length, 'tickets');
        setState(loaded);
      } catch (error) {
        console.error('Failed to load initial state:', error);
        setState(defaultState);
      } finally {
        setIsLoading(false);
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      console.log('[useEffect save] State changed, scheduling save. Current:', state.students.length, 'students,', state.tickets.length, 'tickets');
      const timeoutId = setTimeout(() => {
        console.log('[useEffect save] Debounce expired, saving now');
        saveStateToAPI(state);
      }, 500); // Debounce saves by 500ms to batch rapid updates and handle React Strict Mode

      return () => {
        console.log('[useEffect save] Cleanup - canceling pending save');
        clearTimeout(timeoutId);
      };
    }
  }, [state, isLoaded]);

  const updateState = useCallback((updates: Partial<TicketState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const addTicket = useCallback((ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('[addTicket] Called with studentIds:', ticket.studentIds);
    const newTicket: Ticket = {
      ...ticket,
      id: `ticket-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState(prev => {
      console.log('[addTicket] Current state has', prev.students.length, 'students:', prev.students.map(s => s.id));
      // Ensure all studentIds reference existing students
      const existingStudentIds = new Set(prev.students.map(s => s.id));

      newTicket.studentIds.forEach(studentId => {
        if (!existingStudentIds.has(studentId)) {
          console.warn('[addTicket] Student ID not found, this should not happen:', studentId);
        }
      });

      const newState = { ...prev, tickets: [...prev.tickets, newTicket] };
      console.log('[addTicket] New state will have', newState.students.length, 'students and', newState.tickets.length, 'tickets');
      return newState;
    });
  }, []);

  const updateTicket = useCallback((id: string, updates: Partial<Ticket>) => {
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.map(ticket =>
        ticket.id === id
          ? { ...ticket, ...updates, updatedAt: new Date() }
          : ticket
      ),
    }));
  }, []);

  const deleteTicket = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.filter(ticket => ticket.id !== id),
    }));
  }, []);

  const addStudent = useCallback((name: string) => {
    const newStudent: Student = {
      id: `student-${Date.now()}`,
      name: name.trim(),
      createdAt: new Date(),
    };
    console.log('[addStudent] Creating student:', newStudent);
    setState(prev => {
      console.log('[addStudent] Previous students:', prev.students.length);
      const newState = { ...prev, students: [...prev.students, newStudent] };
      console.log('[addStudent] New students:', newState.students.length);
      return newState;
    });
    return newStudent.id;
  }, []);

  const updateStudent = useCallback((id: string, name: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(student =>
        student.id === id ? { ...student, name: name.trim() } : student
      ),
    }));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.filter(student => student.id !== id),
      tickets: prev.tickets.map(ticket => ({
        ...ticket,
        studentIds: ticket.studentIds.filter(sid => sid !== id),
      })),
    }));
  }, []);

  const addCategory = useCallback((name: string) => {
    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: name.trim(),
      createdAt: new Date(),
    };
    setState(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
  }, []);

  const updateCategory = useCallback((id: string, name: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(category =>
        category.id === id ? { ...category, name: name.trim() } : category
      ),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== id),
      tickets: prev.tickets.map(ticket =>
        ticket.category === id ? { ...ticket, category: 'behavioral' } : ticket
      ),
    }));
  }, []);

  const addNote = useCallback((ticketId: string, content: string, source: Note['source']) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: content.trim(),
      timestamp: new Date(),
      author: 'You',
      source,
    };
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, notes: [...ticket.notes, newNote], updatedAt: new Date() }
          : ticket
      ),
    }));
  }, []);

  const addNoteWithMetadata = useCallback((ticketId: string, noteData: Omit<Note, 'id' | 'timestamp' | 'author'>) => {
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}`,
      timestamp: new Date(),
      author: 'You',
    };
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, notes: [...ticket.notes, newNote], updatedAt: new Date() }
          : ticket
      ),
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<TicketState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  }, []);

  const updateNote = useCallback((ticketId: string, noteId: string, content: string) => {
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.map(ticket =>
        ticket.id === ticketId
          ? {
              ...ticket,
              notes: ticket.notes.map(note =>
                note.id === noteId ? { ...note, content: content.trim() } : note
              ),
              updatedAt: new Date(),
            }
          : ticket
      ),
    }));
  }, []);

  const deleteNote = useCallback((ticketId: string, noteId: string) => {
    setState(prev => ({
      ...prev,
      tickets: prev.tickets.map(ticket =>
        ticket.id === ticketId
          ? {
              ...ticket,
              notes: ticket.notes.filter(note => note.id !== noteId),
              updatedAt: new Date(),
            }
          : ticket
      ),
    }));
  }, []);

  const getTicketsByCategory = useCallback((categoryId: string): Ticket[] => {
    return state.tickets
      .filter(ticket => ticket.category === categoryId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.tickets]);

  const getTicketsByStudent = useCallback((studentId: string): Ticket[] => {
    return state.tickets
      .filter(ticket => ticket.studentIds.includes(studentId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.tickets]);

  const getStudentById = useCallback((id: string): Student | undefined => {
    return state.students.find(s => s.id === id);
  }, [state.students]);

  const getCategoryById = useCallback((id: string): Category | undefined => {
    return state.categories.find(c => c.id === id);
  }, [state.categories]);

  const getStudentsByIds = useCallback((ids: string[]): Student[] => {
    return ids
      .map(id => getStudentById(id))
      .filter((s): s is Student => s !== undefined);
  }, [getStudentById]);

  return {
    state,
    isLoaded,
    isLoading,
    actions: {
      addTicket,
      updateTicket,
      deleteTicket,
      addStudent,
      updateStudent,
      deleteStudent,
      addCategory,
      updateCategory,
      deleteCategory,
      addNote,
      addNoteWithMetadata,
      updateNote,
      deleteNote,
      getTicketsByCategory,
      getTicketsByStudent,
      getStudentById,
      getCategoryById,
      getStudentsByIds,
      updateState,
      updateSettings,
      // Legacy aliases
      addIncident: addTicket,
      updateIncident: updateTicket,
      deleteIncident: deleteTicket,
      getIncidentsByCategory: getTicketsByCategory,
      getIncidentsByStudent: getTicketsByStudent,
    },
  };
}

// Legacy export for backwards compatibility
export const useIncidents = useTickets;
