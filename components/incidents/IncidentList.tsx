'use client';

import { useState } from 'react';
import { useIncidents } from '@/contexts/IncidentsContext';
import { Button } from '@/components/ui/button';
import { IncidentCard } from './IncidentCard';
import { IncidentDialog } from './IncidentDialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter } from 'lucide-react';

export function IncidentList() {
  const { state, isLoading, actions } = useIncidents();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(undefined);

  const getFilteredIncidents = () => {
    if (filterStatus === 'all') return state.tickets;
    return state.tickets.filter((inc: any) => inc.status === filterStatus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tickets</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-md px-3 py-1.5 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <Button onClick={() => { setEditingIncident(undefined); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Ticket
          </Button>
        </div>
      </div>

      {state.categories.map((category: any) => {
        const categoryIncidents = getFilteredIncidents()
          .filter((inc: any) => inc.category === category.id);
        
        if (categoryIncidents.length === 0) return null;

        return (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium text-muted-foreground">
                {category.name}
              </h3>
              <Badge variant="secondary">{categoryIncidents.length}</Badge>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categoryIncidents.map((incident: any) => (
                <IncidentCard
                  key={incident.id}
                  incident={incident}
                  onEdit={() => { setEditingIncident(incident); setDialogOpen(true); }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {getFilteredIncidents().length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No tickets found. Click "Add Ticket" to create one.
        </div>
      )}

      <IncidentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={() => setDialogOpen(false)}
        incident={editingIncident}
      />
    </div>
  );
}
