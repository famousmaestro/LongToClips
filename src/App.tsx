import React, { useState } from 'react';
import { Scissors, Menu } from 'lucide-react';
import CreateJob from './components/CreateJob';
import Dashboard from './components/Dashboard';
import JobView from './components/JobView';

type View = 'create' | 'dashboard' | 'job';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('create');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const handleJobCreated = (jobId: string) => {
    setActiveJobId(jobId);
    setCurrentView('job');
  };

  const navigateToDashboard = () => {
    setCurrentView('dashboard');
    setActiveJobId(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-gray-100 selection:bg-purple-500/30 selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCurrentView('create')}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">ClipCreator</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={() => setCurrentView('create')}
              className={`${currentView === 'create' ? 'text-white' : 'text-gray-400 hover:text-white'} transition-colors`}
            >
              New Project
            </button>
            <button 
              onClick={navigateToDashboard}
              className={`${currentView === 'dashboard' ? 'text-white' : 'text-gray-400 hover:text-white'} transition-colors`}
            >
              Dashboard
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
              <Menu className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24">
        {currentView === 'create' && <CreateJob onJobCreated={handleJobCreated} />}
        {currentView === 'dashboard' && (
          <Dashboard 
            onSelectJob={(id) => {
              setActiveJobId(id);
              setCurrentView('job');
            }} 
          />
        )}
        {currentView === 'job' && activeJobId && (
          <JobView jobId={activeJobId} onBack={navigateToDashboard} />
        )}
      </main>
    </div>
  );
}
