# Crew Status Tracker

A comprehensive web application for tracking crew and aircraft status in aviation operations. Built with React, TypeScript, and Tailwind CSS.

## Features

### Data Input (Daily Techlog Entry)
- **Date**: Flight date
- **Aircraft Registration**: Aircraft identifier
- **Pilot Name**: Primary pilot
- **Co-Pilot Name**: Optional secondary pilot
- **Sectors**: Multiple flight segments with:
  - Departure and arrival airports
  - Takeoff and landing times
  - Route information
  - Automatic flight time calculation

### System Processing Rules

#### Flight Time Calculations
- Sum of all sector times for each pilot
- Automatic calculation based on takeoff/landing times

#### Duty Time Calculations
- Earliest takeoff to latest landing + 1 hour
- Accounts for multi-sector days

#### Aircraft Tracking
- **Cycles**: Number of sectors (landings)
- **Flight Hours**: Sum of sector times

### Crew Flight Time Limit Rules (Single Pilot)
- Max 10 sectors in any 24 hours
- Max 34 hours in any 7 consecutive days
- Max 100 hours in any 28 consecutive days
- Max 1000 hours per 365 days

### Crew Duty Time Limit Rules
- Max 55 hours in any 7 consecutive days
- Max 190 hours in any 28 consecutive days
- Max 1800 hours per 365 days

### Chief Pilot Dashboard
For each pilot, shows:
- Last 7, 28, and 365 days totals of:
  - Flight Time
  - Duty Time
  - Sectors flown
- Color-coded exceedance alerts
- Detailed limit violation notifications

### Aircraft Status Dashboard
For each aircraft, shows:
- Total cycles and flight hours (rolling tally)
- Average hours per cycle
- Last activity timestamp
- Fleet summary statistics

## Technology Stack

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Local Storage** for data persistence
- **Responsive Design** for all screen sizes

## Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### Adding Techlog Entries

1. Navigate to the "Techlog Entry" tab
2. Fill in the required fields:
   - Date
   - Aircraft Registration
   - Pilot Name
   - Co-Pilot Name (optional)
3. Add sectors:
   - Click "Add Sector" for multiple flight segments
   - Enter departure/arrival airports
   - Set takeoff/landing times (flight time calculates automatically)
   - Add route information (optional)
4. Click "Submit Techlog Entry"

### Viewing Crew Status

1. Navigate to the "Crew Status" tab
2. View pilot statistics for:
   - 7-day, 28-day, and 365-day periods
   - Flight time vs. limits
   - Duty time vs. limits
   - Sector counts
3. Red indicators show limit exceedances
4. Summary statistics at the bottom

### Viewing Aircraft Status

1. Navigate to the "Aircraft Status" tab
2. View aircraft cards showing:
   - Total cycles and flight hours
   - Average utilization metrics
   - Last activity timestamps
3. Fleet summary with totals
4. Recent activity table

### Data Management

- **Data Persistence**: All data is stored in your browser's local storage
- **Clear Data**: Use the "Clear All Data" button in the header to reset
- **No Backend Required**: Works completely offline

## File Structure

```
src/
├── components/
│   ├── TechlogEntryForm.tsx      # Daily data input form
│   ├── CrewStatusDashboard.tsx   # Chief Pilot view
│   └── AircraftStatusDashboard.tsx # Aircraft tracking
├── types/
│   └── index.ts                  # TypeScript interfaces
├── utils/
│   ├── calculations.ts           # Business logic
│   └── storage.ts                # Local storage utilities
├── App.tsx                       # Main application component
├── index.tsx                     # Application entry point
└── index.css                     # Tailwind CSS imports
```

## Business Logic

### Flight Time Calculation
```typescript
// Sum of all sector times for each pilot
const flightTime = sectors.reduce((total, sector) => total + sector.flightTime, 0);
```

### Duty Time Calculation
```typescript
// Earliest takeoff to latest landing + 1 hour
const dutyTime = (latestLanding - earliestTakeoff) + 1;
```

### Limit Checking
The system automatically checks all regulatory limits and flags exceedances with color-coded alerts.

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Data Export

Currently, data is stored locally in the browser. For data export functionality, consider:
- Adding CSV export for reports
- Database integration for multi-user environments
- API endpoints for enterprise deployment

## Future Enhancements

- Multi-user authentication
- Database backend
- Advanced reporting and analytics
- Mobile app version
- Integration with flight planning systems
- Maintenance tracking integration

## Support

For issues or questions, please check the browser console for error messages. The application includes comprehensive error handling and validation.

## License

This project is open source and available under the MIT License.
