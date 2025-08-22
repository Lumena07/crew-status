import React, { useState } from 'react';
import TechlogEntryForm from './components/TechlogEntryForm';
import CrewStatusDashboard from './components/CrewStatusDashboard';
import AircraftStatusDashboard from './components/AircraftStatusDashboard';
import TechlogSummary from './components/TechlogSummary';
import { clearAllData } from './utils/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'entry' | 'crew' | 'aircraft' | 'summary'>('entry');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEntryAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAllData();
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const tabs = [
    { id: 'entry', label: 'Techlog Entry', icon: '📝' },
    { id: 'summary', label: 'Techlog Summary', icon: '📊' },
    { id: 'crew', label: 'Crew Status', icon: '👥' },
    { id: 'aircraft', label: 'Aircraft Status', icon: '✈️' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Crew Status Tracker</h1>
              <span className="ml-2 text-sm text-gray-500">Aviation Management System</span>
            </div>
            <button
              onClick={handleClearData}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'entry' && (
          <TechlogEntryForm onEntryAdded={handleEntryAdded} />
        )}
        
        {activeTab === 'summary' && (
          <TechlogSummary refreshTrigger={refreshTrigger} />
        )}
        
        {activeTab === 'crew' && (
          <CrewStatusDashboard refreshTrigger={refreshTrigger} />
        )}
        
        {activeTab === 'aircraft' && (
          <AircraftStatusDashboard refreshTrigger={refreshTrigger} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-500">
            <p>Crew and Aircraft Status Tracking System</p>
            <p className="mt-1">Data is stored locally in your browser</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
