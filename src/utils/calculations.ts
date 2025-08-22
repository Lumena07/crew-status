import { TechlogEntry, PilotStats, AircraftStats, Sector } from '../types';

// Flight time limits
const FLIGHT_TIME_LIMITS = {
  MAX_SECTORS_24H: 10,
  MAX_HOURS_7D: 34,
  MAX_HOURS_28D: 100,
  MAX_HOURS_365D: 1000,
};

// Duty time limits
const DUTY_TIME_LIMITS = {
  MAX_HOURS_7D: 55,
  MAX_HOURS_28D: 190,
  MAX_HOURS_365D: 1800,
};

export const calculateFlightTime = (sectors: Sector[]): number => {
  return sectors.reduce((total, sector) => total + sector.flightTime, 0);
};

export const calculateDutyTime = (sectors: Sector[]): number => {
  if (sectors.length === 0) return 0;
  
  const takeoffTimes = sectors.map(s => new Date(`2000-01-01T${s.takeoffTime}`).getTime());
  const landingTimes = sectors.map(s => new Date(`2000-01-01T${s.landingTime}`).getTime());
  
  const earliestTakeoff = Math.min(...takeoffTimes);
  const latestLanding = Math.max(...landingTimes);
  
  // Add 45 minutes to earliest takeoff (duty start)
  const dutyStart = earliestTakeoff + (45 * 60 * 1000);
  // Add 15 minutes to latest landing (duty end)
  const dutyEnd = latestLanding + (15 * 60 * 1000);
  
  const dutyTimeMs = dutyEnd - dutyStart;
  const dutyTimeHours = dutyTimeMs / (1000 * 60 * 60);
  
  return Math.max(0, dutyTimeHours); // Ensure non-negative
};

export const getEntriesInDateRange = (
  entries: TechlogEntry[],
  startDate: Date,
  endDate: Date
): TechlogEntry[] => {
  return entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startDate && entryDate <= endDate;
  });
};

export const calculatePilotStats = (
  pilotName: string,
  entries: TechlogEntry[]
): PilotStats => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const threeSixtyFiveDaysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const pilotEntries = entries.filter(entry => 
    entry.pilotName === pilotName || entry.coPilotName === pilotName
  );

  const entries7Days = getEntriesInDateRange(pilotEntries, sevenDaysAgo, now);
  const entries28Days = getEntriesInDateRange(pilotEntries, twentyEightDaysAgo, now);
  const entries365Days = getEntriesInDateRange(pilotEntries, threeSixtyFiveDaysAgo, now);

  // Calculate flight times
  const flightTime7Days = entries7Days.reduce((total, entry) => 
    total + calculateFlightTime(entry.sectors), 0
  );
  const flightTime28Days = entries28Days.reduce((total, entry) => 
    total + calculateFlightTime(entry.sectors), 0
  );
  const flightTime365Days = entries365Days.reduce((total, entry) => 
    total + calculateFlightTime(entry.sectors), 0
  );

  // Calculate duty times
  const dutyTime7Days = entries7Days.reduce((total, entry) => 
    total + calculateDutyTime(entry.sectors), 0
  );
  const dutyTime28Days = entries28Days.reduce((total, entry) => 
    total + calculateDutyTime(entry.sectors), 0
  );
  const dutyTime365Days = entries365Days.reduce((total, entry) => 
    total + calculateDutyTime(entry.sectors), 0
  );

  // Calculate sectors
  const sectors7Days = entries7Days.reduce((total, entry) => 
    total + entry.sectors.length, 0
  );
  const sectors28Days = entries28Days.reduce((total, entry) => 
    total + entry.sectors.length, 0
  );
  const sectors365Days = entries365Days.reduce((total, entry) => 
    total + entry.sectors.length, 0
  );

  // Check for 24-hour sector limit (last 24 hours)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const entries24Hours = getEntriesInDateRange(pilotEntries, twentyFourHoursAgo, now);
  const sectors24Hours = entries24Hours.reduce((total, entry) => 
    total + entry.sectors.length, 0
  );

  return {
    pilotName,
    flightTime7Days,
    flightTime28Days,
    flightTime365Days,
    dutyTime7Days,
    dutyTime28Days,
    dutyTime365Days,
    sectors7Days,
    sectors28Days,
    sectors365Days,
    exceedances: {
      flightTime7Days: flightTime7Days > FLIGHT_TIME_LIMITS.MAX_HOURS_7D,
      flightTime28Days: flightTime28Days > FLIGHT_TIME_LIMITS.MAX_HOURS_28D,
      flightTime365Days: flightTime365Days > FLIGHT_TIME_LIMITS.MAX_HOURS_365D,
      dutyTime7Days: dutyTime7Days > DUTY_TIME_LIMITS.MAX_HOURS_7D,
      dutyTime28Days: dutyTime28Days > DUTY_TIME_LIMITS.MAX_HOURS_28D,
      dutyTime365Days: dutyTime365Days > DUTY_TIME_LIMITS.MAX_HOURS_365D,
      sectors24Hours: sectors24Hours > FLIGHT_TIME_LIMITS.MAX_SECTORS_24H,
    },
  };
};

export const calculateAircraftStats = (
  registration: string,
  entries: TechlogEntry[]
): AircraftStats => {
  const aircraftEntries = entries.filter(entry => 
    entry.aircraftRegistration === registration
  );

  const totalCycles = aircraftEntries.reduce((total, entry) => 
    total + entry.sectors.length, 0
  );

  const totalFlightHours = aircraftEntries.reduce((total, entry) => 
    total + calculateFlightTime(entry.sectors), 0
  );

  return {
    registration,
    totalCycles,
    totalFlightHours,
    lastUpdated: new Date(),
  };
};

export const getAllPilotNames = (entries: TechlogEntry[]): string[] => {
  const pilotNames = new Set<string>();
  
  entries.forEach(entry => {
    pilotNames.add(entry.pilotName);
    if (entry.coPilotName) {
      pilotNames.add(entry.coPilotName);
    }
  });
  
  return Array.from(pilotNames).sort();
};

export const getAllAircraftRegistrations = (entries: TechlogEntry[]): string[] => {
  const registrations = new Set<string>();
  
  entries.forEach(entry => {
    registrations.add(entry.aircraftRegistration);
  });
  
  return Array.from(registrations).sort();
};
