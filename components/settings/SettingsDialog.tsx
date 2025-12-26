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
import { Label } from '@/components/ui/label';
import { useIncidents } from '@/contexts/IncidentsContext';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { state, actions } = useIncidents();
  const [assemblyAIKey, setAssemblyAIKey] = useState('');

  useEffect(() => {
    setAssemblyAIKey(state.settings.assemblyAIKey || '');
  }, [state.settings.assemblyAIKey]);

  const handleSave = () => {
    actions.updateSettings({
      assemblyAIKey: assemblyAIKey.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="assemblyai-key">AssemblyAI API Key</Label>
            <Input
              id="assemblyai-key"
              type="password"
              placeholder="Enter your AssemblyAI API key"
              value={assemblyAIKey}
              onChange={(e) => setAssemblyAIKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://www.assemblyai.com/dashboard/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                AssemblyAI Dashboard
              </a>
              . Required for advanced transcription with speaker identification.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
