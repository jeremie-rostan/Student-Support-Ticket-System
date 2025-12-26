'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useIncidents } from '@/contexts/IncidentsContext';
import { Mic, X, Upload, Loader2 } from 'lucide-react';

interface RecordNoteProps {
  open: boolean;
  onClose: () => void;
  onSave: (content: string, source: 'manual' | 'audio-transcription' | 'assembly-transcription', metadata?: {
    utterances?: Array<{
      speaker: string;
      text: string;
      start: number;
      end: number;
      confidence: number;
    }>;
    summary?: string;
  }) => void;
}

export function RecordNote({ open, onClose, onSave }: RecordNoteProps) {
  const { state } = useIncidents();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [mode, setMode] = useState<'manual' | 'audio' | 'upload'>('manual');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speakerLabels, setSpeakerLabels] = useState(true);
  const [summarization, setSummarization] = useState(true);
  const [transcriptionResult, setTranscriptionResult] = useState<any>(null);
  const [useAssemblyAI, setUseAssemblyAI] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
      setRecordingTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        alert('Please select an audio or video file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAssemblyAITranscribe = async (audioFile?: Blob | File) => {
    const fileToTranscribe = audioFile || selectedFile || recordedBlob;

    if (!fileToTranscribe) return;

    const apiKey = state.settings.assemblyAIKey;
    if (!apiKey) {
      alert('Please set your AssemblyAI API key in Settings first');
      return;
    }

    setIsTranscribing(true);

    try {
      const formData = new FormData();

      // Convert Blob to File if needed
      if (fileToTranscribe instanceof Blob && !(fileToTranscribe instanceof File)) {
        const file = new File([fileToTranscribe], 'recording.webm', { type: 'audio/webm' });
        formData.append('audio', file);
      } else {
        formData.append('audio', fileToTranscribe);
      }

      formData.append('apiKey', apiKey);
      formData.append('speakerLabels', String(speakerLabels));
      formData.append('summarization', String(summarization));

      const response = await fetch('/api/transcribe-assembly', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Transcription failed');
      }

      const result = await response.json();
      setTranscriptionResult(result);
      setTranscription(result.text);
    } catch (error: any) {
      console.error('Transcription error:', error);
      alert(`Transcription failed: ${error.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  useEffect(() => {
    // Auto-transcribe when recording stops
    if (recordedBlob && useAssemblyAI && state.settings.assemblyAIKey) {
      handleAssemblyAITranscribe(recordedBlob);
    }
  }, [recordedBlob]);

  const handleSave = () => {
    if (mode === 'manual' && manualNote.trim()) {
      onSave(manualNote.trim(), 'manual');
      setManualNote('');
    } else if (mode === 'audio' && transcription.trim()) {
      const metadata: any = {};
      if (transcriptionResult?.utterances) {
        metadata.utterances = transcriptionResult.utterances;
      }
      if (transcriptionResult?.summary) {
        metadata.summary = transcriptionResult.summary;
      }
      onSave(transcription.trim(), useAssemblyAI ? 'assembly-transcription' : 'audio-transcription', Object.keys(metadata).length > 0 ? metadata : undefined);
      setTranscription('');
      setTranscriptionResult(null);
      setRecordedBlob(null);
    } else if (mode === 'upload' && transcription.trim()) {
      const metadata: any = {};
      if (transcriptionResult?.utterances) {
        metadata.utterances = transcriptionResult.utterances;
      }
      if (transcriptionResult?.summary) {
        metadata.summary = transcriptionResult.summary;
      }
      onSave(transcription.trim(), 'assembly-transcription', metadata);
      setTranscription('');
      setTranscriptionResult(null);
      setSelectedFile(null);
    }
    onClose();
  };

  const handleModeChange = (newMode: 'manual' | 'audio' | 'upload') => {
    setMode(newMode);
    setTranscription('');
    setTranscriptionResult(null);
    setRecordedBlob(null);
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    setTranscription('');
    setManualNote('');
    setSelectedFile(null);
    setRecordedBlob(null);
    setTranscriptionResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              onClick={() => handleModeChange('manual')}
              className="flex-1"
            >
              Text Note
            </Button>
            <Button
              variant={mode === 'audio' ? 'default' : 'outline'}
              onClick={() => handleModeChange('audio')}
              className="flex-1"
            >
              Voice Note
            </Button>
            <Button
              variant={mode === 'upload' ? 'default' : 'outline'}
              onClick={() => handleModeChange('upload')}
              className="flex-1"
            >
              Upload Audio
            </Button>
          </div>

          {mode === 'manual' ? (
            <Textarea
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="Type your note..."
              rows={6}
              className="w-full"
            />
          ) : mode === 'audio' ? (
            <div className="space-y-4">
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <h4 className="text-sm font-semibold">Transcription Options</h4>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="use-assemblyai"
                    checked={useAssemblyAI}
                    onCheckedChange={(checked) => setUseAssemblyAI(checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-assemblyai" className="text-sm cursor-pointer font-medium">
                      Use AssemblyAI for transcription
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Get speaker identification and AI summary (requires API key)
                    </p>
                  </div>
                </div>

                {useAssemblyAI && (
                  <>
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="speaker-labels-voice"
                        checked={speakerLabels}
                        onCheckedChange={(checked) => setSpeakerLabels(checked as boolean)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="speaker-labels-voice" className="text-sm cursor-pointer font-medium">
                          Enable speaker identification
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Detect and label different speakers (Speaker A, Speaker B, etc.)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="summarization-voice"
                        checked={summarization}
                        onCheckedChange={(checked) => setSummarization(checked as boolean)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="summarization-voice" className="text-sm cursor-pointer font-medium">
                          Generate AI summary
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Create a concise summary of the conversation
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {useAssemblyAI && !state.settings.assemblyAIKey && (
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-800 dark:text-amber-400">
                      <strong>API Key Required:</strong> Set your AssemblyAI API key in Settings
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4">
                {!isRecording && !recordedBlob ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="w-full"
                  >
                    <Mic className="w-6 h-6 mr-2" />
                    Start Recording
                  </Button>
                ) : isRecording ? (
                  <>
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="destructive"
                      className="w-full"
                    >
                      <X className="w-6 h-6 mr-2" />
                      Stop Recording
                    </Button>
                    <div className="text-center text-muted-foreground">
                      <div className="animate-pulse text-2xl mb-2">🎙️</div>
                      <p>Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</p>
                      <p className="text-sm mt-2">Speak clearly into your microphone</p>
                    </div>
                  </>
                ) : null}

                {recordedBlob && isTranscribing && (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Transcribing your recording...</p>
                  </div>
                )}
              </div>

              {transcriptionResult && (
                <div className="space-y-4">
                  {transcriptionResult.summary && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-semibold mb-2">Summary</h4>
                      <p className="text-sm">{transcriptionResult.summary}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium mb-1 block">
                      Full Transcription (edit if needed)
                    </label>
                    <Textarea
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      rows={8}
                      className="w-full"
                    />
                  </div>

                  {transcriptionResult.utterances && transcriptionResult.utterances.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md border">
                      <h4 className="text-sm font-semibold mb-2">Speaker Breakdown</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {transcriptionResult.utterances.map((utterance: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium text-primary">{utterance.speaker}:</span>{' '}
                            <span className="text-muted-foreground">{utterance.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <Label htmlFor="audio-file" className="cursor-pointer text-primary hover:underline">
                    {selectedFile ? selectedFile.name : 'Click to select an audio file'}
                  </Label>
                  <input
                    id="audio-file"
                    type="file"
                    accept="audio/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports MP3, WAV, M4A, MP4, and more
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <h4 className="text-sm font-semibold">Transcription Options</h4>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="speaker-labels"
                    checked={speakerLabels}
                    onCheckedChange={(checked) => setSpeakerLabels(checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="speaker-labels" className="text-sm cursor-pointer font-medium">
                      Enable speaker identification
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Detect and label different speakers (Speaker A, Speaker B, etc.)
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="summarization"
                    checked={summarization}
                    onCheckedChange={(checked) => setSummarization(checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor="summarization" className="text-sm cursor-pointer font-medium">
                      Generate AI summary
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Create a concise summary of the conversation
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleAssemblyAITranscribe()}
                disabled={isTranscribing || !selectedFile}
                className="w-full"
                size="lg"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedFile ? 'Transcribe with AssemblyAI' : 'Select a file first'}
                  </>
                )}
              </Button>

              {!state.settings.assemblyAIKey && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    <strong>API Key Required:</strong> Please set your AssemblyAI API key in Settings to use this feature
                  </p>
                </div>
              )}

              {transcriptionResult && (
                <div className="space-y-4">
                  {transcriptionResult.summary && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <h4 className="text-sm font-semibold mb-2">Summary</h4>
                      <p className="text-sm">{transcriptionResult.summary}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium mb-1 block">
                      Full Transcription (edit if needed)
                    </label>
                    <Textarea
                      value={transcription}
                      onChange={(e) => setTranscription(e.target.value)}
                      rows={8}
                      className="w-full"
                    />
                  </div>

                  {transcriptionResult.utterances && transcriptionResult.utterances.length > 0 && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md border">
                      <h4 className="text-sm font-semibold mb-2">Speaker Breakdown</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {transcriptionResult.utterances.map((utterance: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium text-primary">{utterance.speaker}:</span>{' '}
                            <span className="text-muted-foreground">{utterance.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                (mode === 'manual' && !manualNote.trim()) ||
                (mode === 'audio' && !transcription.trim()) ||
                (mode === 'upload' && !transcription.trim()) ||
                isRecording ||
                isTranscribing
              }
            >
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
