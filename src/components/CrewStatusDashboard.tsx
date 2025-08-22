import React from 'react';
import { PilotStats } from '../types';
import { calculatePilotStats, getAllPilotNames } from '../utils/calculations';
import { loadFromLocalStorage } from '../utils/storage';

interface CrewStatusDashboardProps {
  refreshTrigger: number;
}

const CrewStatusDashboard: React.FC<CrewStatusDashboardProps> = ({ refreshTrigger }) => {
  const [pilotStats, setPilotStats] = React.useState<PilotStats[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'overview' | 'flight-time' | 'duty-time'>('overview');
  const [sortField, setSortField] = React.useState<string>('pilotName');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [expandedPilot, setExpandedPilot] = React.useState<string | null>(null);

  React.useEffect(() => {
    const data = loadFromLocalStorage();
    const pilotNames = getAllPilotNames(data.techlogEntries);
    const stats = pilotNames.map(name => calculatePilotStats(name, data.techlogEntries));
    setPilotStats(stats);
  }, [refreshTrigger]);

  const getExceedanceColor = (exceeded: boolean): string => {
    return exceeded ? 'text-red-600 font-semibold' : 'text-green-600';
  };

  // Filter and search pilots
  const filteredPilotStats = React.useMemo(() => {
    let filtered = pilotStats;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(pilot =>
        pilot.pilotName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [pilotStats, searchTerm]);

  // Sort pilots
  const sortedPilotStats = React.useMemo(() => {
    const sorted = [...filteredPilotStats];
    sorted.sort((a, b) => {
      let aValue: any = a[sortField as keyof PilotStats];
      let bValue: any = b[sortField as keyof PilotStats];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredPilotStats, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const formatTime = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  const handlePilotClick = (pilotName: string) => {
    setExpandedPilot(expandedPilot === pilotName ? null : pilotName);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get pilot's daily flight details
  const getPilotDailyDetails = (pilotName: string) => {
    const data = loadFromLocalStorage();
    const pilotEntries = data.techlogEntries.filter(entry => 
      entry.pilotName === pilotName || entry.coPilotName === pilotName
    );

    // Group by date
    const dailyGroups = pilotEntries.reduce((groups, entry) => {
      const date = entry.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
      return groups;
    }, {} as Record<string, typeof pilotEntries>);

    return Object.entries(dailyGroups).map(([date, entries]) => {
      // Get all sectors for this day
      const allSectors = entries.flatMap(entry => entry.sectors);
      
      // Determine if overnight based on last sector's arrival
      const lastSector = allSectors[allSectors.length - 1];
      const isOvernight = lastSector && lastSector.arrival !== 'HTDA';

      return {
        date,
        entries,
        sectors: allSectors,
        totalFlightTime: allSectors.reduce((sum, sector) => sum + sector.flightTime, 0),
        isOvernight
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
  };

  // Calculate overnight count based on daily details (not individual sectors)
  const getPilotOvernightCount = (pilotName: string) => {
    const dailyDetails = getPilotDailyDetails(pilotName);
    
    // Count days that ended with overnight
    const totalOvernights = dailyDetails.filter(day => day.isOvernight).length;
    
    // Count recent overnights (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentOvernights = dailyDetails
      .filter(day => new Date(day.date) >= sevenDaysAgo && day.isOvernight)
      .length;
    
    return { totalOvernights, recentOvernights };
  };

  // Calculate pilot's rest compliance and overnight count
  const getPilotRestCompliance = (pilotName: string) => {
    const data = loadFromLocalStorage();
    const pilotEntries = data.techlogEntries.filter(entry => 
      entry.pilotName === pilotName || entry.coPilotName === pilotName
    );

    // Get daily details to understand duty periods
    const dailyDetails = getPilotDailyDetails(pilotName);
    
    // Sort daily details by date (most recent first, then reverse for chronological order)
    const sortedDailyDetails = [...dailyDetails].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let totalRestPeriods = 0;
    let compliantRestPeriods = 0;
    const restPeriodDetails: Array<{
      start: Date;
      end: Date;
      hours: number;
      isCompliant: boolean;
      fromDate: string;
      toDate: string;
    }> = [];

    // Calculate rest periods between consecutive duty days
    for (let i = 0; i < sortedDailyDetails.length - 1; i++) {
      const currentDay = sortedDailyDetails[i];
      const nextDay = sortedDailyDetails[i + 1];

      // Get the last sector of current day (when duty ended)
      const lastSectorOfCurrentDay = currentDay.sectors[currentDay.sectors.length - 1];
      // Get the first sector of next day (when duty started)
      const firstSectorOfNextDay = nextDay.sectors[0];

      if (lastSectorOfCurrentDay && firstSectorOfNextDay) {
        // Calculate rest period: last landing time + 15min to first takeoff time + 45min
        const lastLandingTime = new Date(`${currentDay.date}T${lastSectorOfCurrentDay.landingTime}`);
        const firstTakeoffTime = new Date(`${nextDay.date}T${firstSectorOfNextDay.takeoffTime}`);

        // Add 15 minutes to landing time and 45 minutes to takeoff time
        const restStart = new Date(lastLandingTime.getTime() + 15 * 60 * 1000);
        const restEnd = new Date(firstTakeoffTime.getTime() + 45 * 60 * 1000);

        const restHours = (restEnd.getTime() - restStart.getTime()) / (1000 * 60 * 60);
        totalRestPeriods++;

        const isCompliant = restHours >= 36;
        if (isCompliant) {
          compliantRestPeriods++;
        }

        restPeriodDetails.push({
          start: restStart,
          end: restEnd,
          hours: restHours,
          isCompliant,
          fromDate: currentDay.date,
          toDate: nextDay.date
        });
      }
    }

    // Check last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentDailyDetails = sortedDailyDetails.filter(day => 
      new Date(day.date) >= sevenDaysAgo
    );

    let recentTotalRestPeriods = 0;
    let recentCompliantRestPeriods = 0;
    const recentRestPeriodDetails: Array<{
      start: Date;
      end: Date;
      hours: number;
      isCompliant: boolean;
      fromDate: string;
      toDate: string;
    }> = [];

    // Calculate rest periods for recent days
    for (let i = 0; i < recentDailyDetails.length - 1; i++) {
      const currentDay = recentDailyDetails[i];
      const nextDay = recentDailyDetails[i + 1];

      const lastSectorOfCurrentDay = currentDay.sectors[currentDay.sectors.length - 1];
      const firstSectorOfNextDay = nextDay.sectors[0];

      if (lastSectorOfCurrentDay && firstSectorOfNextDay) {
        const lastLandingTime = new Date(`${currentDay.date}T${lastSectorOfCurrentDay.landingTime}`);
        const firstTakeoffTime = new Date(`${nextDay.date}T${firstSectorOfNextDay.takeoffTime}`);

        const restStart = new Date(lastLandingTime.getTime() + 15 * 60 * 1000);
        const restEnd = new Date(firstTakeoffTime.getTime() + 45 * 60 * 1000);

        const restHours = (restEnd.getTime() - restStart.getTime()) / (1000 * 60 * 60);
        recentTotalRestPeriods++;

        const isCompliant = restHours >= 36;
        if (isCompliant) {
          recentCompliantRestPeriods++;
        }

        recentRestPeriodDetails.push({
          start: restStart,
          end: restEnd,
          hours: restHours,
          isCompliant,
          fromDate: currentDay.date,
          toDate: nextDay.date
        });
      }
    }

    // Determine if all rest periods are compliant (binary compliance)
    const isFullyCompliant = recentTotalRestPeriods === 0 || recentCompliantRestPeriods === recentTotalRestPeriods;

    // Get correct overnight counts
    const overnightCounts = getPilotOvernightCount(pilotName);

    return {
      totalOvernights: overnightCounts.totalOvernights,
      totalRestPeriods,
      compliantRestPeriods,
      recentOvernights: overnightCounts.recentOvernights,
      recentRestPeriods: recentTotalRestPeriods,
      recentCompliantRestPeriods: recentCompliantRestPeriods,
      isFullyCompliant: isFullyCompliant,
      recentRestPeriodDetails
    };
  };

  const tabs = [
    { id: 'overview', name: 'Overview', description: 'All pilot statistics' },
    { id: 'flight-time', name: 'Flight Time', description: 'Flight time limits and exceedances' },
    { id: 'duty-time', name: 'Duty Time', description: 'Duty time limits and exceedances' }
  ];

  if (pilotStats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Crew Status Dashboard</h2>
        <div className="text-center text-gray-500 py-8">
          <p>No crew data available. Add some techlog entries to see pilot statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Crew Status Dashboard</h2>
      
      {/* Search */}
      <div className="mb-6">
        <label htmlFor="pilot-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search Pilots
        </label>
        <input
          type="text"
          id="pilot-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by pilot name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'flight-time' | 'duty-time')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Results Info */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {sortedPilotStats.length} of {pilotStats.length} pilots
        {searchTerm && ` filtered by "${searchTerm}"`}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pilotName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Pilot</span>
                    <span className="text-xs">{getSortIcon('pilotName')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flight Time (7d)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duty Time (7d)
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Sectors (7d)
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Overnights (7d)
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   36h Rest (7d)
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Exceedances
                 </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPilotStats.map((pilot) => (
                <React.Fragment key={pilot.pilotName}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePilotClick(pilot.pilotName)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer flex items-center"
                      >
                        {pilot.pilotName}
                        <span className="ml-2 text-xs text-gray-400">
                          {expandedPilot === pilot.pilotName ? '▼' : '▶'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Object.values(pilot.exceedances).some(Boolean) ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Limit Exceeded
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Normal
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getExceedanceColor(pilot.exceedances.flightTime7Days)}>
                        {formatTime(pilot.flightTime7Days)} / 34h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getExceedanceColor(pilot.exceedances.dutyTime7Days)}>
                        {formatTime(pilot.dutyTime7Days)} / 55h
                      </span>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">{pilot.sectors7Days}</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         {getPilotRestCompliance(pilot.pilotName).recentOvernights}
                       </div>
                     </td>
                                           <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getPilotRestCompliance(pilot.pilotName).isFullyCompliant ? (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Compliant
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Not Compliant
                            </span>
                          )}
                        </div>
                      </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">
                         {Object.values(pilot.exceedances).filter(Boolean).length} exceeded
                       </div>
                     </td>
                  </tr>
                  
                                     {/* Expanded Details Row */}
                   {expandedPilot === pilot.pilotName && (
                     <tr className="bg-blue-50">
                       <td colSpan={8} className="px-6 py-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-gray-800">
                              Pilot Details: {pilot.pilotName}
                            </h4>
                            <span className="text-sm text-gray-500">
                              Click pilot name to collapse
                            </span>
                          </div>
                          
                                                     {/* Rest Compliance Summary */}
                           <div className="mb-6">
                             <h5 className="font-medium text-gray-700 mb-3">Rest Compliance Summary</h5>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-100 p-3 rounded-lg mb-4">
                               <div>
                                 <span className="text-gray-600">Total Overnights:</span>
                                 <span className="ml-2 font-medium">{getPilotRestCompliance(pilot.pilotName).totalOvernights}</span>
                               </div>
                               <div>
                                 <span className="text-gray-600">7d Overnights:</span>
                                 <span className="ml-2 font-medium">{getPilotRestCompliance(pilot.pilotName).recentOvernights}</span>
                               </div>
                               <div>
                                 <span className="text-gray-600">Rest Compliance:</span>
                                 <span className="ml-2 font-medium">
                                   {getPilotRestCompliance(pilot.pilotName).isFullyCompliant ? (
                                     <span className="text-green-600 font-medium">Compliant</span>
                                   ) : (
                                     <span className="text-red-600 font-medium">Not Compliant</span>
                                   )}
                                 </span>
                               </div>
                               <div>
                                 <span className="text-gray-600">Rest Periods (7d):</span>
                                 <span className="ml-2 font-medium">
                                   {getPilotRestCompliance(pilot.pilotName).recentCompliantRestPeriods}/{getPilotRestCompliance(pilot.pilotName).recentRestPeriods}
                                 </span>
                               </div>
                             </div>
                             
                             {/* Rest Period Details */}
                             {getPilotRestCompliance(pilot.pilotName).recentRestPeriodDetails.length > 0 && (
                               <div>
                                 <h6 className="font-medium text-gray-700 mb-2">Rest Period Details (Last 7 Days)</h6>
                                 <div className="space-y-2">
                                   {getPilotRestCompliance(pilot.pilotName).recentRestPeriodDetails.map((period, index) => (
                                     <div key={index} className={`text-sm p-2 rounded border ${period.isCompliant ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                                               <div className="flex justify-between items-center">
                                          <span className="font-medium">
                                            {formatDate(period.fromDate)} → {formatDate(period.toDate)}
                                          </span>
                                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${period.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                           {period.isCompliant ? 'Compliant' : 'Not Compliant'}
                                         </span>
                                       </div>
                                       <div className="text-gray-600 mt-1">
                                         <span>Rest Start: {period.start.toLocaleString()}</span>
                                         <br />
                                         <span>Rest End: {period.end.toLocaleString()}</span>
                                         <br />
                                         <span>Duration: {period.hours.toFixed(1)} hours</span>
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}
                           </div>
                          
                          {/* Daily Flight Details */}
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Daily Flight Details</h5>
                            <div className="space-y-3">
                              {getPilotDailyDetails(pilot.pilotName).map((day) => (
                                <div key={day.date} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <h6 className="font-medium text-gray-800">{formatDate(day.date)}</h6>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">
                                        Flight Time: {formatTime(day.totalFlightTime)}
                                      </span>
                                      {day.isOvernight ? (
                                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                          Overnight
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                          Day Trip
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">Sectors:</span>
                                      <span className="ml-2 font-medium">{day.sectors.length}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Last Stop:</span>
                                      <span className="ml-2 font-medium">{day.sectors[day.sectors.length - 1]?.arrival || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Aircraft:</span>
                                      <span className="ml-2 font-medium">{day.entries[0]?.aircraftRegistration || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Techlog:</span>
                                      <span className="ml-2 font-medium">{day.entries[0]?.techlogNumber || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'flight-time' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pilotName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Pilot</span>
                    <span className="text-xs">{getSortIcon('pilotName')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('flightTime7Days')}
                >
                  <div className="flex items-center space-x-1">
                    <span>7 Days</span>
                    <span className="text-xs">{getSortIcon('flightTime7Days')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('flightTime28Days')}
                >
                  <div className="flex items-center space-x-1">
                    <span>28 Days</span>
                    <span className="text-xs">{getSortIcon('flightTime28Days')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('flightTime365Days')}
                >
                  <div className="flex items-center space-x-1">
                    <span>365 Days</span>
                    <span className="text-xs">{getSortIcon('flightTime365Days')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPilotStats.map((pilot) => (
                <React.Fragment key={pilot.pilotName}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePilotClick(pilot.pilotName)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer flex items-center"
                      >
                        {pilot.pilotName}
                        <span className="ml-2 text-xs text-gray-400">
                          {expandedPilot === pilot.pilotName ? '▼' : '▶'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getExceedanceColor(pilot.exceedances.flightTime7Days)}>
                        {formatTime(pilot.flightTime7Days)} / 34h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getExceedanceColor(pilot.exceedances.flightTime28Days)}>
                        {formatTime(pilot.flightTime28Days)} / 100h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getExceedanceColor(pilot.exceedances.flightTime365Days)}>
                        {formatTime(pilot.flightTime365Days)} / 1000h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {pilot.exceedances.flightTime7Days || pilot.exceedances.flightTime28Days || pilot.exceedances.flightTime365Days ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Exceeded
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedPilot === pilot.pilotName && (
                    <tr className="bg-blue-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-gray-800">
                              Flight Time Details: {pilot.pilotName}
                            </h4>
                            <span className="text-sm text-gray-500">
                              Click pilot name to collapse
                            </span>
                          </div>
                          
                          {/* Daily Flight Details */}
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Daily Flight Details</h5>
                            <div className="space-y-3">
                              {getPilotDailyDetails(pilot.pilotName).map((day) => (
                                <div key={day.date} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <h6 className="font-medium text-gray-800">{formatDate(day.date)}</h6>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">
                                        Flight Time: {formatTime(day.totalFlightTime)}
                                      </span>
                                      {day.isOvernight ? (
                                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                          Overnight
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                          Day Trip
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">Sectors:</span>
                                      <span className="ml-2 font-medium">{day.sectors.length}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Last Stop:</span>
                                      <span className="ml-2 font-medium">{day.sectors[day.sectors.length - 1]?.arrival || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Aircraft:</span>
                                      <span className="ml-2 font-medium">{day.entries[0]?.aircraftRegistration || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Techlog:</span>
                                      <span className="ml-2 font-medium">{day.entries[0]?.techlogNumber || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'duty-time' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('pilotName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Pilot</span>
                    <span className="text-xs">{getSortIcon('pilotName')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dutyTime7Days')}
                >
                  <div className="flex items-center space-x-1">
                    <span>7 Days</span>
                    <span className="text-xs">{getSortIcon('dutyTime7Days')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dutyTime28Days')}
                >
                  <div className="flex items-center space-x-1">
                    <span>28 Days</span>
                    <span className="text-xs">{getSortIcon('dutyTime28Days')}</span>
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('dutyTime365Days')}
                >
                  <div className="flex items-center space-x-1">
                    <span>365 Days</span>
                    <span className="text-xs">{getSortIcon('dutyTime365Days')}</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPilotStats.map((pilot) => (
                <React.Fragment key={pilot.pilotName}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handlePilotClick(pilot.pilotName)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 cursor-pointer flex items-center"
                      >
                        {pilot.pilotName}
                        <span className="ml-2 text-xs text-gray-400">
                          {expandedPilot === pilot.pilotName ? '▼' : '▶'}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getExceedanceColor(pilot.exceedances.dutyTime7Days)}>
                        {formatTime(pilot.dutyTime7Days)} / 55h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getExceedanceColor(pilot.exceedances.dutyTime28Days)}>
                        {formatTime(pilot.dutyTime28Days)} / 190h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getExceedanceColor(pilot.exceedances.dutyTime365Days)}>
                        {formatTime(pilot.dutyTime365Days)} / 1800h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {pilot.exceedances.dutyTime7Days || pilot.exceedances.dutyTime28Days || pilot.exceedances.dutyTime365Days ? (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Exceeded
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedPilot === pilot.pilotName && (
                    <tr className="bg-blue-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-lg font-semibold text-gray-800">
                              Duty Time Details: {pilot.pilotName}
                            </h4>
                            <span className="text-sm text-gray-500">
                              Click pilot name to collapse
                            </span>
                          </div>
                          
                          {/* Daily Flight Details */}
                          <div>
                            <h5 className="font-medium text-gray-700 mb-3">Daily Flight Details</h5>
                            <div className="space-y-3">
                              {getPilotDailyDetails(pilot.pilotName).map((day) => (
                                <div key={day.date} className="bg-white rounded-lg p-4 border border-gray-200">
                                  <div className="flex justify-between items-center mb-2">
                                    <h6 className="font-medium text-gray-800">{formatDate(day.date)}</h6>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-600">
                                        Flight Time: {formatTime(day.totalFlightTime)}
                                      </span>
                                      {day.isOvernight ? (
                                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                          Overnight
                                        </span>
                                      ) : (
                                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                          Day Trip
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-600">Sectors:</span>
                                      <span className="ml-2 font-medium">{day.sectors.length}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Last Stop:</span>
                                      <span className="ml-2 font-medium">{day.sectors[day.sectors.length - 1]?.arrival || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Aircraft:</span>
                                      <span className="ml-2 font-medium">{day.entries[0]?.aircraftRegistration || 'N/A'}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Techlog:</span>
                                      <span className="ml-2 font-medium">{day.entries[0]?.techlogNumber || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Pilots:</span>
            <span className="ml-2 font-medium">{pilotStats.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Pilots with Exceedances:</span>
            <span className="ml-2 font-medium text-red-600">
              {pilotStats.filter(p => Object.values(p.exceedances).some(Boolean)).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Flight Time (7d):</span>
            <span className="ml-2 font-medium">
              {formatTime(pilotStats.reduce((sum, p) => sum + p.flightTime7Days, 0))}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Duty Time (7d):</span>
            <span className="ml-2 font-medium">
              {formatTime(pilotStats.reduce((sum, p) => sum + p.dutyTime7Days, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrewStatusDashboard;
