'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StudentSelector } from './StudentSelector';
import { RecordNote } from './RecordNote';
import { format } from 'date-fns';
import { X, Plus } from 'lucide-react';
import { useIncidents } from '@/contexts/IncidentsContext';
import { parseLocalDate } from '@/lib/dateUtils';

interface IncidentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  incident?: any;
}

export function IncidentDialog({ open, onClose, onSave, incident }: IncidentDialogProps) {
  const { state, actions } = useIncidents();
  const [date, setDate] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'new' | 'in-progress' | 'resolved'>('new');
  const [details, setDetails] = useState('');
  const [showRecordNote, setShowRecordNote] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Get fresh incident data from state if editing
  const currentIncident = incident ? state.tickets.find(i => i.id === incident.id) : undefined;

  useEffect(() => {
    if (open) {
      if (currentIncident) {
        setDate(currentIncident.date);
        setStudentIds(currentIncident.studentIds);
        setCategory(currentIncident.category);
        setStatus(currentIncident.status);
        setDetails(currentIncident.details);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setStudentIds([]);
        setCategory('academic');
        setStatus('new');
        setDetails('');
      }
    }
  }, [open, currentIncident]);

  const handleSave = () => {
    if (!date.trim() || !details.trim()) return;

    const incidentData = {
      date: date,
      studentIds,
      category,
      status,
      details,
      notes: currentIncident?.notes || [],
    };

    if (currentIncident) {
      actions.updateIncident(currentIncident.id, incidentData);
    } else {
      actions.addIncident(incidentData);
    }

    onClose();
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      actions.addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setAddingCategory(false);
    }
  };

  const handleDelete = () => {
    if (currentIncident && confirm('Are you sure you want to delete this ticket?')) {
      actions.deleteIncident(currentIncident.id);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentIncident ? 'Edit Ticket' : 'New Ticket'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date *</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Status *</label>
                <Select value={status} onValueChange={(value) => setStatus(value as 'new' | 'in-progress' | 'resolved')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Students Involved</label>
              <StudentSelector
                selectedIds={studentIds}
                onChange={setStudentIds}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Category *</label>
              <Select
                value={category}
                onValueChange={(value) => {
                  if (value === 'add-new') {
                    setAddingCategory(true);
                  } else {
                    setCategory(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {state.categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="add-new" className="text-primary">
                    + Add Category
                  </SelectItem>
                </SelectContent>
              </Select>

              {addingCategory && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Details *</label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the ticket..."
                rows={4}
              />
            </div>

            {currentIncident && currentIncident.notes.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Conversation Notes</label>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {currentIncident.notes.map((note: any) => (
                    <div key={note.id} className="p-3 bg-muted rounded-md space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          {format(parseLocalDate(note.timestamp), 'MMM d, yyyy h:mm a')}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => actions.updateNote(currentIncident.id, note.id, note.content)}
                          >
                            <span className="text-xs">Edit</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive"
                            onClick={() => actions.deleteNote(currentIncident.id, note.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {note.summary && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                          <p className="text-xs font-semibold mb-1">Summary</p>
                          <p className="text-xs">{note.summary}</p>
                        </div>
                      )}

                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>

                      {note.utterances && note.utterances.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs font-semibold cursor-pointer text-primary">
                            Speaker Breakdown ({note.utterances.length} speakers)
                          </summary>
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-primary/20">
                            {note.utterances.map((utterance: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium text-primary">{utterance.speaker}:</span>{' '}
                                <span className="text-muted-foreground">{utterance.text}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      <div className="flex gap-1">
                        {note.source === 'audio-transcription' && (
                          <Badge variant="outline" className="text-xs">
                            🎤 Voice
                          </Badge>
                        )}
                        {note.source === 'assembly-transcription' && (
                          <Badge variant="outline" className="text-xs">
                            🎙️ AssemblyAI
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentIncident && (
              <Button
                variant="outline"
                onClick={() => setShowRecordNote(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center">
            {currentIncident && (
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!date.trim() || !details.trim()}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentIncident && (
        <RecordNote
          open={showRecordNote}
          onClose={() => setShowRecordNote(false)}
          onSave={(content, source, metadata) => {
            if (metadata) {
              actions.addNoteWithMetadata(currentIncident.id, {
                content,
                source,
                utterances: metadata.utterances,
                summary: metadata.summary,
              });
            } else {
              actions.addNote(currentIncident.id, content, source);
            }
            setShowRecordNote(false);
          }}
        />
      )}
    </>
  );
}
