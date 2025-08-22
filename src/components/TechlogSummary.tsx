import React, { useState, useMemo } from 'react';
import { TechlogEntry } from '../types';
import { loadFromLocalStorage } from '../utils/storage';

interface TechlogSummaryProps {
  refreshTrigger: number;
}

const TechlogSummary: React.FC<TechlogSummaryProps> = ({ refreshTrigger }) => {
  const [techlogEntries, setTechlogEntries] = useState<TechlogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof TechlogEntry>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  React.useEffect(() => {
    const data = loadFromLocalStorage();
    setTechlogEntries(data.techlogEntries);
  }, [refreshTrigger]);

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = techlogEntries.filter(entry => 
      (entry.techlogNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.aircraftRegistration?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.pilotName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.coPilotName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (entry.date || '').includes(searchTerm)
    );

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [techlogEntries, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof TechlogEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  const calculateTotalFlightTime = (sectors: any[]): number => {
    return sectors.reduce((total, sector) => total + sector.flightTime, 0);
  };

  const getSortIcon = (field: keyof TechlogEntry) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleRowClick = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  if (techlogEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Techlog Summary</h2>
        <div className="text-center text-gray-500 py-8">
          <p>No techlog entries available. Add some entries to see the summary.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Techlog Summary</h2>
      
      {/* Search and Stats */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Entries
            </label>
                         <input
               type="text"
               id="search"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search by techlog number, aircraft, pilot, or date..."
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredAndSortedEntries.length}</span> of {techlogEntries.length} entries
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Entries:</span>
            <span className="ml-2 font-medium">{techlogEntries.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Unique Aircraft:</span>
            <span className="ml-2 font-medium">
              {new Set(techlogEntries.map(e => e.aircraftRegistration)).size}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Unique Pilots:</span>
            <span className="ml-2 font-medium">
              {new Set(techlogEntries.map(e => e.pilotName)).size}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Total Sectors:</span>
            <span className="ml-2 font-medium">
              {techlogEntries.reduce((sum, entry) => sum + entry.sectors.length, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Techlog Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
             <tr>
               <th 
                 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                 onClick={() => handleSort('techlogNumber')}
               >
                 <div className="flex items-center space-x-1">
                   <span>Techlog #</span>
                   <span className="text-xs">{getSortIcon('techlogNumber')}</span>
                 </div>
               </th>
               <th 
                 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                 onClick={() => handleSort('date')}
               >
                 <div className="flex items-center space-x-1">
                   <span>Date</span>
                   <span className="text-xs">{getSortIcon('date')}</span>
                 </div>
               </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('aircraftRegistration')}
              >
                <div className="flex items-center space-x-1">
                  <span>Aircraft</span>
                  <span className="text-xs">{getSortIcon('aircraftRegistration')}</span>
                </div>
              </th>
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
                Co-Pilot
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sectors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flight Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
                                           <tbody className="bg-white divide-y divide-gray-200">
             {filteredAndSortedEntries.map((entry) => (
               <React.Fragment key={entry.id}>
                 <tr 
                   className="hover:bg-gray-50 cursor-pointer"
                   onClick={() => handleRowClick(entry.id)}
                 >
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm font-medium text-gray-900">
                       {entry.techlogNumber || '-'}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-900">
                       {formatDate(entry.date)}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm font-medium text-gray-900">
                       {entry.aircraftRegistration}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-900">
                       {entry.pilotName}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-500">
                       {entry.coPilotName || '-'}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-900">
                       {entry.sectors.length}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-900">
                       {formatTime(calculateTotalFlightTime(entry.sectors))}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-gray-500">
                       {formatDate(entry.createdAt.toISOString())}
                     </div>
                   </td>
                 </tr>
                 
                 {/* Expanded Details Row */}
                 {expandedEntry === entry.id && (
                   <tr className="bg-blue-50">
                     <td colSpan={8} className="px-6 py-4">
                       <div className="space-y-4">
                         <div className="flex justify-between items-center">
                           <h4 className="text-lg font-semibold text-gray-800">
                             Techlog Details: {entry.techlogNumber || 'N/A'}
                           </h4>
                           <span className="text-sm text-gray-500">
                             Click row to collapse
                           </span>
                         </div>
                         
                         {/* Entry Details */}
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                           <div>
                             <span className="font-medium text-gray-700">Date:</span>
                             <span className="ml-2 text-gray-900">{formatDate(entry.date)}</span>
                           </div>
                           <div>
                             <span className="font-medium text-gray-700">Aircraft:</span>
                             <span className="ml-2 text-gray-900">{entry.aircraftRegistration}</span>
                           </div>
                           <div>
                             <span className="font-medium text-gray-700">Pilot:</span>
                             <span className="ml-2 text-gray-900">{entry.pilotName}</span>
                           </div>
                           <div>
                             <span className="font-medium text-gray-700">Co-Pilot:</span>
                             <span className="ml-2 text-gray-900">{entry.coPilotName || 'N/A'}</span>
                           </div>
                         </div>
                         
                         {/* Sectors Details */}
                         <div>
                           <h5 className="font-medium text-gray-700 mb-3">Sectors ({entry.sectors.length})</h5>
                           <div className="space-y-3">
                             {entry.sectors.map((sector, index) => (
                               <div key={sector.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                 <div className="flex justify-between items-center mb-2">
                                   <h6 className="font-medium text-gray-800">Sector {index + 1}</h6>
                                   <span className="text-sm text-gray-600">
                                     Flight Time: {formatTime(sector.flightTime)}
                                   </span>
                                 </div>
                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                   <div>
                                     <span className="text-gray-600">Departure:</span>
                                     <span className="ml-2 font-medium">{sector.departure}</span>
                                   </div>
                                   <div>
                                     <span className="text-gray-600">Arrival:</span>
                                     <span className="ml-2 font-medium">{sector.arrival}</span>
                                   </div>
                                   <div>
                                     <span className="text-gray-600">Takeoff:</span>
                                     <span className="ml-2 font-medium">{sector.takeoffTime}</span>
                                   </div>
                                   <div>
                                     <span className="text-gray-600">Landing:</span>
                                     <span className="ml-2 font-medium">{sector.landingTime}</span>
                                   </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                         
                         {/* Summary */}
                         <div className="bg-gray-100 rounded-lg p-3">
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                             <div>
                               <span className="text-gray-600">Total Flight Time:</span>
                               <span className="ml-2 font-medium">{formatTime(calculateTotalFlightTime(entry.sectors))}</span>
                             </div>
                             <div>
                               <span className="text-gray-600">Total Sectors:</span>
                               <span className="ml-2 font-medium">{entry.sectors.length}</span>
                             </div>
                             <div>
                               <span className="text-gray-600">Created:</span>
                               <span className="ml-2 font-medium">{formatDate(entry.createdAt.toISOString())}</span>
                             </div>
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

      {/* Pagination Info */}
      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {filteredAndSortedEntries.length} entries
        {searchTerm && ` filtered by "${searchTerm}"`}
      </div>
    </div>
  );
};

export default TechlogSummary;
