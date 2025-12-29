/**
 * AQI Data Integration Module
 * Fetches real-time air quality data from AQICN API
 * Falls back to simulated data for demo purposes
 */

const AqiApi = {
    // AQICN API configuration
    // Get your free token at: https://aqicn.org/data-platform/token/
    API_TOKEN: 'demo', // Replace with real token for production
    BASE_URL: 'https://api.waqi.info',

    // Monitoring stations for each city
    stations: {
        lahore: [
            { id: 'lahore-us-consulate', name: 'US Consulate', lat: 31.5600, lng: 74.3350 },
            { id: '@7766', name: 'PAK EPA Lahore', lat: 31.5204, lng: 74.3587 },
            { id: '@8686', name: 'Punjab EPA', lat: 31.5497, lng: 74.3436 },
            { id: 'lahore-gulberg', name: 'Gulberg', lat: 31.5107, lng: 74.3460 },
            { id: 'lahore-johar-town', name: 'Johar Town', lat: 31.4697, lng: 74.2728 },
            { id: 'lahore-model-town', name: 'Model Town', lat: 31.4837, lng: 74.3168 },
            { id: 'lahore-cantonment', name: 'Cantonment', lat: 31.5370, lng: 74.3780 }
        ],
        delhi: [
            { id: '@8539', name: 'Anand Vihar', lat: 28.6469, lng: 77.3164 },
            { id: '@11260', name: 'ITO', lat: 28.6289, lng: 77.2405 },
            { id: '@8540', name: 'Mandir Marg', lat: 28.6365, lng: 77.2012 },
            { id: '@8545', name: 'RK Puram', lat: 28.5630, lng: 77.1750 },
            { id: '@11609', name: 'Punjabi Bagh', lat: 28.6714, lng: 77.1200 },
            { id: '@11263', name: 'Dwarka Sector 8', lat: 28.5691, lng: 77.0715 },
            { id: '@11605', name: 'Ashok Vihar', lat: 28.6959, lng: 77.1823 },
            { id: '@8541', name: 'Shadipur', lat: 28.6514, lng: 77.1558 },
            { id: '@11607', name: 'Rohini', lat: 28.7325, lng: 77.1201 },
            { id: '@11608', name: 'Siri Fort', lat: 28.5504, lng: 77.2157 }
        ]
    },

    // Simulated baseline AQI data (used when API unavailable)
    // Based on historical averages for each season
    simulatedData: {
        lahore: {
            winter: { pm25: 285, pm10: 380, no2: 65, so2: 28, o3: 35 },
            summer: { pm25: 145, pm10: 195, no2: 45, so2: 18, o3: 55 },
            monsoon: { pm25: 95, pm10: 130, no2: 35, so2: 15, o3: 40 }
        },
        delhi: {
            winter: { pm25: 320, pm10: 420, no2: 75, so2: 32, o3: 38 },
            summer: { pm25: 165, pm10: 220, no2: 55, so2: 22, o3: 65 },
            monsoon: { pm25: 85, pm10: 120, no2: 30, so2: 12, o3: 35 }
        }
    },

    // Cache for API responses
    cache: new Map(),
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutes

    /**
     * Fetch AQI data for a city
     * @param {string} city - 'lahore' or 'delhi'
     * @returns {Promise<Array>} Station data with AQI readings
     */
    async fetchCityData(city) {
        const cacheKey = `city-${city}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            return cached.data;
        }

        const stations = this.stations[city] || [];
        const results = [];

        // Try to fetch real data from API
        for (const station of stations) {
            try {
                const data = await this.fetchStationData(station.id);
                if (data) {
                    results.push({
                        ...station,
                        ...data,
                        isReal: true
                    });
                }
            } catch (error) {
                // API failed, will use simulated data
                console.warn(`Failed to fetch ${station.name}:`, error.message);
            }
        }

        // If no real data, generate simulated data
        if (results.length === 0) {
            const season = this.getCurrentSeason();
            const baseData = this.simulatedData[city]?.[season] || this.simulatedData.lahore.winter;

            stations.forEach(station => {
                // Add some variance to make it realistic
                const variance = () => 1 + (Math.random() - 0.5) * 0.3;

                results.push({
                    ...station,
                    aqi: Math.round(baseData.pm25 * variance()),
                    pm25: Math.round(baseData.pm25 * variance()),
                    pm10: Math.round(baseData.pm10 * variance()),
                    no2: Math.round(baseData.no2 * variance()),
                    so2: Math.round(baseData.so2 * variance()),
                    o3: Math.round(baseData.o3 * variance()),
                    dominantPollutant: 'pm25',
                    timestamp: new Date().toISOString(),
                    isReal: false
                });
            });
        }

        // Cache results
        this.cache.set(cacheKey, {
            timestamp: Date.now(),
            data: results
        });

        return results;
    },

    /**
     * Fetch data for a single station
     * @param {string} stationId - AQICN station ID
     * @returns {Promise<Object>} Station readings
     */
    async fetchStationData(stationId) {
        const url = `${this.BASE_URL}/feed/${stationId}/?token=${this.API_TOKEN}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'ok' && data.data) {
                const iaqi = data.data.iaqi || {};

                return {
                    aqi: data.data.aqi,
                    pm25: iaqi.pm25?.v || null,
                    pm10: iaqi.pm10?.v || null,
                    no2: iaqi.no2?.v || null,
                    so2: iaqi.so2?.v || null,
                    o3: iaqi.o3?.v || null,
                    temperature: iaqi.t?.v || null,
                    humidity: iaqi.h?.v || null,
                    wind: iaqi.w?.v || null,
                    dominantPollutant: data.data.dominentpol,
                    timestamp: data.data.time?.iso
                };
            }
        } catch (error) {
            throw error;
        }

        return null;
    },

    /**
     * Get AQI at a specific location using interpolation
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {Array} stationData - Array of station readings
     * @returns {Object} Interpolated AQI data
     */
    interpolateAQI(lat, lng, stationData) {
        if (!stationData || stationData.length === 0) {
            return { aqi: 200, pm25: 200 }; // Default high value
        }

        // Inverse Distance Weighting (IDW) interpolation
        let weightedSum = 0;
        let totalWeight = 0;
        let weightedPM25 = 0;
        let weightedPM10 = 0;

        stationData.forEach(station => {
            const distance = this.haversineDistance(lat, lng, station.lat, station.lng);
            // Avoid division by zero
            const weight = distance < 0.1 ? 1000 : 1 / Math.pow(distance, 2);

            weightedSum += (station.aqi || station.pm25) * weight;
            weightedPM25 += (station.pm25 || station.aqi) * weight;
            weightedPM10 += (station.pm10 || station.aqi * 1.3) * weight;
            totalWeight += weight;
        });

        return {
            aqi: Math.round(weightedSum / totalWeight),
            pm25: Math.round(weightedPM25 / totalWeight),
            pm10: Math.round(weightedPM10 / totalWeight)
        };
    },

    /**
     * Calculate distance between two points using Haversine formula
     * @returns {number} Distance in kilometers
     */
    haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    },

    toRad(deg) {
        return deg * (Math.PI / 180);
    },

    /**
     * Generate heatmap data for visualization
     * @param {string} city - City name
     * @param {Array} stationData - Station readings
     * @param {number} gridSize - Grid resolution in km
     * @returns {Array} Heatmap points [lat, lng, intensity]
     */
    generateHeatmapData(city, stationData, gridSize = 0.5) {
        const bounds = this.getCityBounds(city);
        const points = [];

        // Create grid of interpolated points
        for (let lat = bounds.south; lat <= bounds.north; lat += gridSize / 111) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSize / 85) {
                const { pm25 } = this.interpolateAQI(lat, lng, stationData);
                // Normalize intensity (0-1 scale for heatmap)
                const intensity = Math.min(pm25 / 500, 1);
                points.push([lat, lng, intensity]);
            }
        }

        return points;
    },

    /**
     * Get geographic bounds for a city
     */
    getCityBounds(city) {
        const bounds = {
            lahore: {
                north: 31.65,
                south: 31.35,
                east: 74.55,
                west: 74.15
            },
            delhi: {
                north: 28.85,
                south: 28.40,
                east: 77.45,
                west: 76.85
            }
        };

        return bounds[city] || bounds.lahore;
    },

    /**
     * Get current season based on month
     */
    getCurrentSeason() {
        const month = new Date().getMonth() + 1; // 1-12

        if (month >= 11 || month <= 2) return 'winter';
        if (month >= 3 && month <= 6) return 'summer';
        return 'monsoon';
    },

    /**
     * Get AQI category and color
     */
    getAQICategory(aqi) {
        if (aqi <= 50) return { label: 'Good', color: '#00e400', textColor: '#000' };
        if (aqi <= 100) return { label: 'Moderate', color: '#ffff00', textColor: '#000' };
        if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: '#ff7e00', textColor: '#000' };
        if (aqi <= 200) return { label: 'Unhealthy', color: '#ff0000', textColor: '#fff' };
        if (aqi <= 300) return { label: 'Very Unhealthy', color: '#8f3f97', textColor: '#fff' };
        return { label: 'Hazardous', color: '#7e0023', textColor: '#fff' };
    },

    /**
     * Get average AQI for a city
     */
    getCityAverageAQI(stationData) {
        if (!stationData || stationData.length === 0) return { aqi: 0, pm25: 0 };

        const totalAqi = stationData.reduce((sum, s) => sum + (s.aqi || 0), 0);
        const totalPm25 = stationData.reduce((sum, s) => sum + (s.pm25 || 0), 0);

        return {
            aqi: Math.round(totalAqi / stationData.length),
            pm25: Math.round(totalPm25 / stationData.length)
        };
    },

    /**
     * Set API token (for production use)
     */
    setApiToken(token) {
        this.API_TOKEN = token;
    }
};

// Export for use in other modules
window.AqiApi = AqiApi;
