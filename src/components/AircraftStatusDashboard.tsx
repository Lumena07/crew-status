import React from 'react';
import { AircraftStats } from '../types';
import { calculateAircraftStats, getAllAircraftRegistrations } from '../utils/calculations';
import { loadFromLocalStorage } from '../utils/storage';

interface AircraftStatusDashboardProps {
  refreshTrigger: number;
}

const AircraftStatusDashboard: React.FC<AircraftStatusDashboardProps> = ({ refreshTrigger }) => {
  const [aircraftStats, setAircraftStats] = React.useState<AircraftStats[]>([]);

  React.useEffect(() => {
    const data = loadFromLocalStorage();
    const registrations = getAllAircraftRegistrations(data.techlogEntries);
    const stats = registrations.map(registration => 
      calculateAircraftStats(registration, data.techlogEntries)
    );
    setAircraftStats(stats);
  }, [refreshTrigger]);

  const formatTime = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (aircraftStats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Aircraft Status Dashboard</h2>
        <div className="text-center text-gray-500 py-8">
          <p>No aircraft data available. Add some techlog entries to see aircraft statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Aircraft Status Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aircraftStats.map((aircraft) => (
          <div
            key={aircraft.registration}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{aircraft.registration}</h3>
              <span className="text-xs text-gray-500">
                Updated: {formatDate(aircraft.lastUpdated)}
              </span>
            </div>

            <div className="space-y-4">
              {/* Cycles */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Total Cycles</h4>
                    <p className="text-2xl font-bold text-blue-900">{aircraft.totalCycles}</p>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-1">Landing cycles completed</p>
              </div>

              {/* Flight Hours */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Total Flight Hours</h4>
                    <p className="text-2xl font-bold text-green-900">{formatTime(aircraft.totalFlightHours)}</p>
                  </div>
                  <div className="text-green-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-1">Cumulative flight time</p>
              </div>

              {/* Utilization Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Hours/Cycle:</span>
                  <span className="font-medium">
                    {aircraft.totalCycles > 0 
                      ? formatTime(aircraft.totalFlightHours / aircraft.totalCycles)
                      : '0.0h'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Activity:</span>
                  <span className="font-medium">
                    {formatDate(aircraft.lastUpdated)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Fleet Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {aircraftStats.length}
            </div>
            <div className="text-sm text-gray-600">Total Aircraft</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {aircraftStats.reduce((sum, a) => sum + a.totalCycles, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Cycles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {formatTime(aircraftStats.reduce((sum, a) => sum + a.totalFlightHours, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Flight Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {aircraftStats.length > 0 
                ? formatTime(
                    aircraftStats.reduce((sum, a) => sum + a.totalFlightHours, 0) / aircraftStats.length
                  )
                : '0.0h'
              }
            </div>
            <div className="text-sm text-gray-600">Avg Hours/Aircraft</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aircraft
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cycles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Flight Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aircraftStats
                  .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
                  .slice(0, 5)
                  .map((aircraft) => (
                    <tr key={aircraft.registration} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {aircraft.registration}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{aircraft.totalCycles}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatTime(aircraft.totalFlightHours)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(aircraft.lastUpdated)}</div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AircraftStatusDashboard;
