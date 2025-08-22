export interface Sector {
  id: string;
  departure: string;
  arrival: string;
  takeoffTime: string;
  landingTime: string;
  flightTime: number; // in hours
}

export interface TechlogEntry {
  id: string;
  techlogNumber: string;
  date: string;
  aircraftRegistration: string;
  pilotName: string;
  coPilotName?: string;
  sectors: Sector[];
  createdAt: Date;
}

export interface PilotStats {
  pilotName: string;
  flightTime7Days: number;
  flightTime28Days: number;
  flightTime365Days: number;
  dutyTime7Days: number;
  dutyTime28Days: number;
  dutyTime365Days: number;
  sectors7Days: number;
  sectors28Days: number;
  sectors365Days: number;
  exceedances: {
    flightTime7Days: boolean;
    flightTime28Days: boolean;
    flightTime365Days: boolean;
    dutyTime7Days: boolean;
    dutyTime28Days: boolean;
    dutyTime365Days: boolean;
    sectors24Hours: boolean;
  };
}

export interface AircraftStats {
  registration: string;
  totalCycles: number;
  totalFlightHours: number;
  lastUpdated: Date;
}

export interface AppData {
  techlogEntries: TechlogEntry[];
  aircraftStats: AircraftStats[];
}
