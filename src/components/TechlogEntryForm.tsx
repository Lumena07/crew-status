import React, { useState } from 'react';
import { TechlogEntry, Sector } from '../types';
import { addTechlogEntry, updateAircraftStats, loadFromLocalStorage } from '../utils/storage';
import { calculateAircraftStats } from '../utils/calculations';

interface TechlogEntryFormProps {
  onEntryAdded: () => void;
}

const TechlogEntryForm: React.FC<TechlogEntryFormProps> = ({ onEntryAdded }) => {
  const [formData, setFormData] = useState({
    techlogNumber: '',
    date: new Date().toISOString().split('T')[0],
    aircraftRegistration: '',
    pilotName: '',
    coPilotName: '',
  });

  const [sectors, setSectors] = useState<Sector[]>([
    {
      id: '1',
      departure: '',
      arrival: '',
      takeoffTime: '',
      landingTime: '',
      flightTime: 0,
    },
  ]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSectorChange = (index: number, field: string, value: string | number) => {
    setSectors(prev => prev.map((sector, i) => 
      i === index ? { ...sector, [field]: value } : sector
    ));
  };

  const handleAddSector = () => {
    const newSector: Sector = {
      id: Date.now().toString(),
      departure: '',
      arrival: '',
      takeoffTime: '',
      landingTime: '',
      flightTime: 0,
    };
    setSectors(prev => [...prev, newSector]);
  };

  const handleRemoveSector = (index: number) => {
    if (sectors.length > 1) {
      setSectors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateFlightTime = (takeoffTime: string, landingTime: string): number => {
    if (!takeoffTime || !landingTime) return 0;
    
    const takeoff = new Date(`2000-01-01T${takeoffTime}`);
    const landing = new Date(`2000-01-01T${landingTime}`);
    
    if (landing < takeoff) {
      landing.setDate(landing.getDate() + 1);
    }
    
    const diffMs = landing.getTime() - takeoff.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const handleTimeChange = (index: number, field: 'takeoffTime' | 'landingTime', value: string) => {
    handleSectorChange(index, field, value);
    
    const sector = sectors[index];
    const otherField = field === 'takeoffTime' ? 'landingTime' : 'takeoffTime';
    const otherTime = sector[otherField];
    
    if (value && otherTime) {
      const flightTime = calculateFlightTime(
        field === 'takeoffTime' ? value : otherTime,
        field === 'landingTime' ? value : otherTime
      );
      handleSectorChange(index, 'flightTime', Math.round(flightTime * 100) / 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.techlogNumber || !formData.aircraftRegistration || !formData.pilotName) {
      alert('Please fill in all required fields');
      return;
    }

    const validSectors = sectors.filter(sector => 
      sector.departure && sector.arrival && sector.takeoffTime && sector.landingTime
    );

    if (validSectors.length === 0) {
      alert('Please add at least one valid sector');
      return;
    }

    const entry: TechlogEntry = {
      id: Date.now().toString(),
      techlogNumber: formData.techlogNumber,
      date: formData.date,
      aircraftRegistration: formData.aircraftRegistration.toUpperCase(),
      pilotName: formData.pilotName,
      coPilotName: formData.coPilotName || undefined,
      sectors: validSectors,
      createdAt: new Date(),
    };

    addTechlogEntry(entry);
    
    // Update aircraft stats
    const data = loadFromLocalStorage();
    const aircraftStats = calculateAircraftStats(formData.aircraftRegistration.toUpperCase(), data.techlogEntries);
    updateAircraftStats(aircraftStats);

    // Reset form
    setFormData({
      techlogNumber: '',
      date: new Date().toISOString().split('T')[0],
      aircraftRegistration: '',
      pilotName: '',
      coPilotName: '',
    });
    setSectors([{
      id: '1',
      departure: '',
      arrival: '',
      takeoffTime: '',
      landingTime: '',
      flightTime: 0,
    }]);

    onEntryAdded();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Daily Techlog Entry</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="techlogNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Techlog Number *
            </label>
            <input
              type="text"
              id="techlogNumber"
              value={formData.techlogNumber}
              onChange={(e) => handleInputChange('techlogNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., TL-2024-001"
              required
            />
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="aircraftRegistration" className="block text-sm font-medium text-gray-700 mb-1">
              Aircraft Registration *
            </label>
            <input
              type="text"
              id="aircraftRegistration"
              value={formData.aircraftRegistration}
              onChange={(e) => handleInputChange('aircraftRegistration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., N12345"
              required
            />
          </div>
          
          <div>
            <label htmlFor="pilotName" className="block text-sm font-medium text-gray-700 mb-1">
              Pilot Name *
            </label>
            <input
              type="text"
              id="pilotName"
              value={formData.pilotName}
              onChange={(e) => handleInputChange('pilotName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., John Smith"
              required
            />
          </div>
          
          <div>
            <label htmlFor="coPilotName" className="block text-sm font-medium text-gray-700 mb-1">
              Co-Pilot Name (Optional)
            </label>
            <input
              type="text"
              id="coPilotName"
              value={formData.coPilotName}
              onChange={(e) => handleInputChange('coPilotName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Jane Doe"
            />
          </div>
        </div>

        {/* Sectors */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Sectors</h3>
            <button
              type="button"
              onClick={handleAddSector}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Add Sector
            </button>
          </div>
          
          <div className="space-y-4">
            {sectors.map((sector, index) => (
              <div key={sector.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Sector {index + 1}</h4>
                  {sectors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSector(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departure *
                    </label>
                    <input
                      type="text"
                      value={sector.departure}
                      onChange={(e) => handleSectorChange(index, 'departure', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., KJFK"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arrival *
                    </label>
                    <input
                      type="text"
                      value={sector.arrival}
                      onChange={(e) => handleSectorChange(index, 'arrival', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., KLAX"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Takeoff Time *
                    </label>
                    <input
                      type="time"
                      value={sector.takeoffTime}
                      onChange={(e) => handleTimeChange(index, 'takeoffTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Landing Time *
                    </label>
                    <input
                      type="time"
                      value={sector.landingTime}
                      onChange={(e) => handleTimeChange(index, 'landingTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flight Time (hours)
                    </label>
                    <input
                      type="number"
                      value={sector.flightTime}
                      onChange={(e) => handleSectorChange(index, 'flightTime', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="0.1"
                      min="0"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit Techlog Entry
          </button>
        </div>
      </form>
    </div>
  );
};

export default TechlogEntryForm;
