'use client';

import { useState } from 'react';
import { useIncidents } from '@/contexts/IncidentsContext';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface StudentSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function StudentSelector({ selectedIds, onChange }: StudentSelectorProps) {
  const { state, actions } = useIncidents();
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredStudents = state.students
    .filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 10);

  const selectedStudents = selectedIds
    .map((id: string) => state.students.find((s: any) => s.id === id))
    .filter((s: any): s is any => s !== undefined);

  const handleAddStudent = (student: any) => {
    if (!selectedIds.includes(student.id)) {
      onChange([...selectedIds, student.id]);
      setSearch('');
      setShowDropdown(false);
    }
  };

  const handleRemoveStudent = (studentId: string) => {
    onChange(selectedIds.filter((id: string) => id !== studentId));
  };

  const handleCreateStudent = async () => {
    console.log('[handleCreateStudent] Called with search:', search);
    if (search.trim()) {
      console.log('[handleCreateStudent] Creating student...');
      const newId = actions.addStudent(search.trim());
      console.log('[handleCreateStudent] Got new ID:', newId);
      onChange([...selectedIds, newId]);
      setSearch('');
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedStudents.map((student: any) => (
          <Badge key={student.id} variant="secondary" className="gap-1 pr-2">
            {student.name}
            <button
              onClick={() => handleRemoveStudent(student.id)}
              className="hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <div className="relative">
        <Input
          placeholder="Search or add students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        />
        
        {showDropdown && search && (
          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredStudents.map((student: any) => (
              <div
                key={student.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  handleAddStudent(student);
                }}
                className="px-3 py-2 hover:bg-accent cursor-pointer"
              >
                {student.name}
              </div>
            ))}
            
            {search && !filteredStudents.some((s: any) =>
              s.name.toLowerCase() === search.toLowerCase()
            ) && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  handleCreateStudent();
                }}
                className="px-3 py-2 hover:bg-accent cursor-pointer text-primary"
              >
                + Create "{search}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
