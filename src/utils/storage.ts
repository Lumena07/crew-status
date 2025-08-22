import { AppData, TechlogEntry, AircraftStats } from '../types';

const STORAGE_KEY = 'crewStatusTrackerData';

export const saveToLocalStorage = (data: AppData): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serializedData);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = (): AppData => {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (serializedData) {
      const data = JSON.parse(serializedData);
      
      // Convert date strings back to Date objects
      const techlogEntries = data.techlogEntries?.map((entry: any) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
      })) || [];
      
      const aircraftStats = data.aircraftStats?.map((stat: any) => ({
        ...stat,
        lastUpdated: new Date(stat.lastUpdated),
      })) || [];
      
      return {
        techlogEntries,
        aircraftStats,
      };
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  
  return {
    techlogEntries: [],
    aircraftStats: [],
  };
};

export const addTechlogEntry = (entry: TechlogEntry): void => {
  const data = loadFromLocalStorage();
  data.techlogEntries.push(entry);
  saveToLocalStorage(data);
};

export const updateAircraftStats = (stats: AircraftStats): void => {
  const data = loadFromLocalStorage();
  const existingIndex = data.aircraftStats.findIndex(
    s => s.registration === stats.registration
  );
  
  if (existingIndex >= 0) {
    data.aircraftStats[existingIndex] = stats;
  } else {
    data.aircraftStats.push(stats);
  }
  
  saveToLocalStorage(data);
};

export const clearAllData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};
