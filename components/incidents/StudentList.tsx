'use client';

import { useState } from 'react';
import { useIncidents } from '@/contexts/IncidentsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StudentProfile } from './StudentProfile';
import { Search, Plus } from 'lucide-react';

export function StudentList() {
  const { state, isLoading, actions } = useIncidents();
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(undefined);

  const filteredStudents = state.students
    .filter((s: any) => s.name.toLowerCase().includes(search.toLowerCase()))
    .map((student: any) => {
      const studentIncidents = state.tickets.filter((inc: any) =>
        inc.studentIds.includes(student.id)
      );
      const lastIncident = studentIncidents.sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      return {
        ...student,
        incidentCount: studentIncidents.length,
        lastIncidentDate: lastIncident?.date || null,
      };
    })
    .sort((a: any, b: any) => b.incidentCount - a.incidentCount);

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

  if (selectedStudent) {
    const enhancedStudent = {
      ...selectedStudent,
      incidentCount: state.tickets.filter((inc: any) =>
        inc.studentIds.includes(selectedStudent.id)
      ).length,
    };

    return (
      <StudentProfile
        student={enhancedStudent}
        onBack={() => setSelectedStudent(undefined)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Students</h2>
        <Button onClick={() => {
          const name = prompt('Enter student name:');
          if (name && name.trim()) actions.addStudent(name.trim());
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredStudents.length === 0 && state.students.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No students yet. Click "Add Student" to create one.
        </div>
      )}

      {filteredStudents.length === 0 && state.students.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No students match "{search}"
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student: any) => (
          <Card
            key={student.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedStudent(student)}
          >
            <CardHeader>
              <CardTitle className="text-base">{student.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Incidents: </span>
                  <span className="font-semibold">{student.incidentCount}</span>
                </div>
                {student.lastIncidentDate && (
                  <div className="text-muted-foreground">
                    Last: {new Date(student.lastIncidentDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
