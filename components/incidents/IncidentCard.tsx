'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useIncidents } from '@/contexts/IncidentsContext';
import { parseLocalDate } from '@/lib/dateUtils';

interface IncidentCardProps {
  incident: any;
  onEdit: () => void;
}

export function IncidentCard({ incident, onEdit }: IncidentCardProps) {
  const { actions } = useIncidents();

  const categoryColors: Record<string, { border: string; bg: string; badge: string }> = {
    'academic': {
      border: 'border-l-blue-500 dark:border-l-blue-400',
      bg: 'bg-blue-50/50 dark:bg-blue-950/20',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
    },
    'behavioral': {
      border: 'border-l-amber-500 dark:border-l-amber-400',
      bg: 'bg-amber-50/50 dark:bg-amber-950/20',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
    },
    'sel': {
      border: 'border-l-purple-500 dark:border-l-purple-400',
      bg: 'bg-purple-50/50 dark:bg-purple-950/20',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
    },
  };

  const statusColors: Record<string, string> = {
    'new': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
    'resolved': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  };

  const statusLabels: Record<string, string> = {
    'new': 'New',
    'in-progress': 'In Progress',
    'resolved': 'Resolved',
  };

  const categoryStyle = categoryColors[incident.category] || categoryColors['academic'];
  const studentNames = actions.getStudentsByIds(incident.studentIds).map(s => s.name).join(', ');

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${categoryStyle.border} ${categoryStyle.bg} backdrop-blur-sm hover:scale-[1.02]`}
      onClick={onEdit}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2 font-semibold">
            {incident.details}
          </CardTitle>
          <Badge className={`${statusColors[incident.status]} shrink-0 shadow-sm`}>
            {statusLabels[incident.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          {format(parseLocalDate(incident.date), 'MMM d, yyyy')}
        </div>
        {incident.studentIds.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="line-clamp-1 font-medium text-slate-700 dark:text-slate-300">
              {studentNames || `${incident.studentIds.length} student(s)`}
            </span>
          </div>
        )}
        {incident.notes && incident.notes.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <MessageSquare className="w-3 h-3" />
            {incident.notes.length} note{incident.notes.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
