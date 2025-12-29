# AQI Tree Planner

A research-grade interactive tool for strategic urban tree planning to improve air quality in Lahore and Delhi.

## Features

- **Interactive Maps**: Toggle between Lahore and Delhi with real street-level detail
- **Tree Species Database**: Neem, Safeda, Cook Pine, and Deodar Cedar with scientifically-backed absorption rates
- **Research-Grade Simulation**: Gaussian Plume Dispersion Model based on EPA AERMOD methodology
- **Real-Time AQI Data**: Integration with AQICN monitoring stations
- **Wind Modeling**: Pollution dispersion corridors based on actual wind patterns
- **PDF Reports**: Professional planning documents for city officials

## Tree Species

| Species | PM2.5 Absorption | Canopy Diameter | Pollution Tolerance |
|---------|-----------------|-----------------|---------------------|
| Neem | 28.4 μg/m³/day | 12m | High |
| Safeda (Eucalyptus) | 22.1 μg/m³/day | 8m | Very High |
| Cook Pine | 15.3 μg/m³/day | 4m | Medium |
| Deodar Cedar | 31.2 μg/m³/day | 15m | Medium-High |

## Usage

1. Select a city (Lahore or Delhi)
2. Choose a tree species from the sidebar
3. Click on the map to place trees
4. Run simulation to see projected AQI improvement
5. Generate PDF report for planning purposes

## Scientific Basis

- **US EPA AERMOD** principles for pollution dispersion
- **i-Tree Eco** model for urban forest benefits
- **Nowak et al. (2006)** - Particulate deposition studies
- **WHO Air Quality Guidelines** for health impact thresholds

## API Configuration

For production use, replace demo API keys:
- AQICN API: Get free key at https://aqicn.org/data-platform/token/
- OpenWeatherMap: Get key at https://openweathermap.org/api

The app works without API keys using simulated data based on historical averages.

## Tech Stack

- Leaflet.js for maps
- Chart.js for visualizations
- jsPDF for report generation
- Vanilla JavaScript (no framework dependencies)

## License

MIT
