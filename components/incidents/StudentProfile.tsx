'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IncidentDialog } from './IncidentDialog';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { useIncidents } from '@/contexts/IncidentsContext';
import { parseLocalDate } from '@/lib/dateUtils';

interface StudentProfileProps {
  student: any;
  onBack: () => void;
}

export function StudentProfile({ student, onBack }: StudentProfileProps) {
  const { state, actions } = useIncidents();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(undefined);

  const studentIncidents = state.tickets
    .filter((inc: any) => inc.studentIds.includes(student.id))
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const categoryBreakdown = state.categories.reduce((acc: any, cat: any) => {
    const count = studentIncidents.filter((inc: any) => inc.category === cat.id).length;
    if (count > 0) acc[cat.name] = count;
    return acc;
  }, {});

  const statusBreakdown: Record<string, number> = {
    'new': studentIncidents.filter((inc: any) => inc.status === 'new').length,
    'in-progress': studentIncidents.filter((inc: any) => inc.status === 'in-progress').length,
    'resolved': studentIncidents.filter((inc: any) => inc.status === 'resolved').length,
  };

  const handleAddIncident = () => {
    setEditingIncident({
      date: new Date().toISOString().split('T')[0],
      studentIds: [student.id],
      category: 'behavioral',
      status: 'new',
      details: '',
      notes: [],
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Students
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{student.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold text-primary">{studentIncidents.length}</div>
              <div className="text-sm text-muted-foreground">Total Incidents</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {statusBreakdown['new'] + statusBreakdown['in-progress']}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{statusBreakdown['resolved']}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </div>
          </div>

          {Object.keys(categoryBreakdown).length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Category Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(categoryBreakdown).map(([category, count]: [string, any]) => {
                  const percentage = Math.round((count / studentIncidents.length) * 100);
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <span>{category}</span>
                      <div className="flex items-center gap-2">
                        <Badge>{count}</Badge>
                        <span className="text-sm text-muted-foreground">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          {studentIncidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No incidents recorded for this student yet.
            </div>
          ) : (
            <div className="space-y-3">
              {studentIncidents.slice(0, 10).map((incident: any) => {
                const category = state.categories.find((c: any) => c.id === incident.category);
                const statusColors: Record<string, string> = {
                  'new': 'bg-blue-100 text-blue-800',
                  'in-progress': 'bg-yellow-100 text-yellow-800',
                  'resolved': 'bg-green-100 text-green-800',
                };
                const statusLabels: Record<string, string> = {
                  'new': 'New',
                  'in-progress': 'In Progress',
                  'resolved': 'Resolved',
                };

                return (
                  <div
                    key={incident.id}
                    className="p-4 border rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setEditingIncident(incident);
                      setDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[incident.status]}>
                            {statusLabels[incident.status]}
                          </Badge>
                          <Badge variant="outline">{category?.name || incident.category}</Badge>
                        </div>
                        <p className="text-sm">{incident.details}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(parseLocalDate(incident.date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {studentIncidents.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  Showing 10 of {studentIncidents.length} incidents
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handleAddIncident}
            className="w-full mt-4"
          >
            + Add Ticket for {student.name}
          </Button>
        </CardContent>
      </Card>

      <IncidentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={() => setDialogOpen(false)}
        incident={editingIncident}
      />
    </div>
  );
}
