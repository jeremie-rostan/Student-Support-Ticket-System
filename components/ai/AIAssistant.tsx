'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Sparkles, X, ChevronRight, User, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { useIncidents } from '@/contexts/IncidentsContext';
import { format } from 'date-fns';
import { parseLocalDate } from '@/lib/dateUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIAssistantProps {
  onClose?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant({ onClose }: AIAssistantProps) {
  const { state } = useIncidents();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build comprehensive context from all ticket data
  const buildDataContext = () => {
    const context = {
      students: state.students.map(student => ({
        id: student.id,
        name: student.name,
        grade: student.grade,
        ticketCount: state.tickets.filter(i => i.studentIds.includes(student.id)).length,
      })),
      categories: state.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
      })),
      tickets: state.tickets.map(ticket => {
        const studentNames = ticket.studentIds.map(id =>
          state.students.find(s => s.id === id)?.name || 'Unknown'
        );
        const categoryName = state.categories.find(c => c.id === ticket.category)?.name || 'Unknown';

        return {
          id: ticket.id,
          date: format(parseLocalDate(ticket.date), 'MMM d, yyyy'),
          students: studentNames,
          category: categoryName,
          status: ticket.status,
          details: ticket.details,
          noteCount: ticket.notes.length,
          notes: ticket.notes.map(note => ({
            timestamp: format(parseLocalDate(note.timestamp), 'MMM d, yyyy h:mm a'),
            content: note.content,
            source: note.source,
            summary: note.summary,
            speakers: note.utterances?.map(u => u.speaker).filter((v, i, a) => a.indexOf(v) === i),
          })),
        };
      }),
    };

    return `# STUDENT SUPPORT TICKET DATABASE

## STUDENTS (${context.students.length} total)
${context.students.map(s => `- ${s.name} (Grade ${s.grade}) - ${s.ticketCount} ticket(s)`).join('\n')}

## CATEGORIES (${context.categories.length} total)
${context.categories.map(c => `- ${c.name}`).join('\n')}

## TICKETS (${context.tickets.length} total)
${context.tickets.map(inc => `
### Ticket ID: ${inc.id}
- **Date**: ${inc.date}
- **Students**: ${inc.students.join(', ')}
- **Category**: ${inc.category}
- **Status**: ${inc.status}
- **Details**: ${inc.details}
- **Notes (${inc.noteCount} total)**:
${inc.notes.map(note => `  - [${note.timestamp}] ${note.source === 'assembly-transcription' ? '🎙️' : note.source === 'audio-transcription' ? '🎤' : '✍️'} ${note.summary ? 'SUMMARY: ' + note.summary : ''} ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}${note.speakers && note.speakers.length > 0 ? ` (Speakers: ${note.speakers.join(', ')})` : ''}`).join('\n')}
`).join('\n')}
`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamedResponse('');

    try {
      const dataContext = buildDataContext();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a helpful student support ticket assistant. You have full access to all tickets, students, categories, and conversation notes. Help analyze student behavior, identify patterns, generate reports, and provide insights. Be concise, practical, and specific.

FORMATTING REQUIREMENTS:
- Use simple text formatting only (bold, bullets, numbered lists)
- DO NOT use markdown tables - they are hard to read
- Use bullet points and numbered lists instead of tables
- Keep paragraphs short and scannable
- Use clear section headers with **bold text**
- Add blank lines between sections for readability

When answering questions:
- Reference specific ticket IDs when relevant
- Identify patterns across students and tickets
- Provide actionable insights
- Be direct and factual
- Use the data provided below to answer questions accurately

${dataContext}`,
            },
            ...messages,
            userMessage,
          ],
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullResponse += chunk;
          setStreamedResponse(fullResponse);
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fullResponse },
      ]);
      setStreamedResponse('');
    } catch (error) {
      console.error('AI error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure LM Studio is running on localhost:1234.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    handleSend();
  };

  if (!mounted) return null;

  const expandedView = isExpanded ? (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-[95vw] h-[95vh] flex flex-col shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5" />
                AI Assistant
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsExpanded(false)}
                  title="Minimize"
                >
                  <Minimize2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClearHistory}
                  title="Clear chat history"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ask about students, tickets, and patterns
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('Generate a comprehensive report of all tickets, including statistics by category, status, and students who need the most attention.')}
                className="text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                Overall Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction('Which students have the most tickets? List the top 5 students by ticket count.')}
                className="text-xs"
              >
                <User className="w-3 h-3 mr-1" />
                Top Students
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[95%] rounded-lg px-4 py-3 text-base ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-1' : ''}>
                          {line}
                        </p>
                      ))
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                            li: ({ children }) => <li className="mb-1">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && streamedResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[95%] rounded-lg px-4 py-3 text-base bg-muted">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                        }}
                      >
                        {streamedResponse}
                      </ReactMarkdown>
                    </div>
                    <span className="inline-block animate-pulse">▊</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about students, tickets, patterns... (e.g., 'What are John\'s main issues?')"
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="self-end"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  ) : null;

  return (
    <>
      {expandedView && createPortal(expandedView, document.body)}
    <div className="flex flex-col gap-4 h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5" />
              AI Assistant
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsExpanded(true)}
                title="Expand"
              >
                <Maximize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClearHistory}
                title="Clear chat history"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Ask about students, tickets, and patterns
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('Generate a comprehensive report of all tickets, including statistics by category, status, and students who need the most attention.')}
              className="text-xs"
            >
              <FileText className="w-3 h-3 mr-1" />
              Overall Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAction('Which students have the most tickets? List the top 5 students by ticket count.')}
              className="text-xs"
            >
              <User className="w-3 h-3 mr-1" />
              Top Students
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1' : ''}>
                        {line}
                      </p>
                    ))
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="mb-1">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && streamedResponse && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-muted">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                      }}
                    >
                      {streamedResponse}
                    </ReactMarkdown>
                  </div>
                  <span className="inline-block animate-pulse">▊</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about students, tickets, patterns... (e.g., 'What are John\'s main issues?')"
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="self-end"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
