'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { IncidentList } from '@/components/incidents/IncidentList';
import { StudentList } from '@/components/incidents/StudentList';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Button } from '@/components/ui/button';
import { List, Users, Sparkles, Settings } from 'lucide-react';

export default function HomePage() {
  const [viewMode, setViewMode] = useState<'category' | 'student'>('category');
  const [showAI, setShowAI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Student Support Tickets
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track and manage student needs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shadow-inner">
              <Button
                variant={viewMode === 'category' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('category')}
                className={viewMode === 'category' ? 'shadow-sm' : ''}
              >
                <List className="w-4 h-4 mr-2" />
                Categories
              </Button>
              <Button
                variant={viewMode === 'student' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('student')}
                className={viewMode === 'student' ? 'shadow-sm' : ''}
              >
                <Users className="w-4 h-4 mr-2" />
                Students
              </Button>
            </div>

            <Button
              variant={showAI ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAI(!showAI)}
              className={showAI ? 'shadow-sm' : ''}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="rounded-xl"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-xl"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-73px)]">
        {showAI && (
          <aside className="w-96 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 overflow-y-auto">
            <AIAssistant onClose={() => setShowAI(false)} />
          </aside>
        )}

        <main className="flex-1 overflow-auto">
          <div className="min-h-full p-6">
            {viewMode === 'category' && <IncidentList />}
            {viewMode === 'student' && <StudentList />}
          </div>
        </main>
      </div>

      <SettingsDialog open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
