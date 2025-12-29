/**
 * Wind Pattern Modeling Module
 * Fetches wind data and models pollution dispersion corridors
 */

const WindModel = {
    // OpenWeatherMap API (get free key at openweathermap.org)
    API_KEY: 'demo', // Replace with real key for production
    BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',

    // City coordinates for weather lookup
    cityCoords: {
        lahore: { lat: 31.5204, lng: 74.3587 },
        delhi: { lat: 28.6139, lng: 77.2090 }
    },

    // Typical wind patterns by season (fallback data)
    typicalPatterns: {
        lahore: {
            winter: { speed: 8, direction: 315, gustSpeed: 15 },   // NW winds
            summer: { speed: 12, direction: 225, gustSpeed: 25 },  // SW monsoon
            monsoon: { speed: 15, direction: 180, gustSpeed: 30 }  // S winds
        },
        delhi: {
            winter: { speed: 6, direction: 300, gustSpeed: 12 },   // NW winds
            summer: { speed: 10, direction: 270, gustSpeed: 20 },  // W winds
            monsoon: { speed: 14, direction: 135, gustSpeed: 28 }  // SE monsoon
        }
    },

    // Current wind data cache
    currentWind: null,
    lastUpdate: null,
    CACHE_DURATION: 15 * 60 * 1000, // 15 minutes

    /**
     * Fetch current wind data for a city
     * @param {string} city - 'lahore' or 'delhi'
     * @returns {Promise<Object>} Wind data
     */
    async fetchWindData(city) {
        // Check cache
        if (this.currentWind &&
            this.lastUpdate &&
            Date.now() - this.lastUpdate < this.CACHE_DURATION) {
            return this.currentWind;
        }

        const coords = this.cityCoords[city] || this.cityCoords.lahore;

        try {
            const url = `${this.BASE_URL}?lat=${coords.lat}&lon=${coords.lng}&appid=${this.API_KEY}&units=metric`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.wind) {
                this.currentWind = {
                    speed: data.wind.speed * 3.6, // Convert m/s to km/h
                    direction: data.wind.deg || 0,
                    gustSpeed: (data.wind.gust || data.wind.speed * 1.5) * 3.6,
                    temperature: data.main?.temp,
                    humidity: data.main?.humidity,
                    pressure: data.main?.pressure,
                    isReal: true
                };
                this.lastUpdate = Date.now();
                return this.currentWind;
            }
        } catch (error) {
            console.warn('Failed to fetch wind data:', error.message);
        }

        // Fallback to typical patterns
        return this.getTypicalWind(city);
    },

    /**
     * Get typical wind data based on season
     */
    getTypicalWind(city) {
        const season = this.getCurrentSeason();
        const pattern = this.typicalPatterns[city]?.[season] ||
                       this.typicalPatterns.lahore.winter;

        // Add some randomness for realism
        return {
            speed: pattern.speed + (Math.random() - 0.5) * 4,
            direction: pattern.direction + (Math.random() - 0.5) * 30,
            gustSpeed: pattern.gustSpeed + (Math.random() - 0.5) * 5,
            isReal: false
        };
    },

    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 11 || month <= 2) return 'winter';
        if (month >= 3 && month <= 6) return 'summer';
        return 'monsoon';
    },

    /**
     * Calculate downwind pollution reduction zone for a tree
     * @param {Object} treeLocation - { lat, lng }
     * @param {number} canopyRadius - Tree canopy radius in meters
     * @param {Object} windData - Current wind data
     * @returns {Object} Zone polygon coordinates
     */
    calculateDownwindZone(treeLocation, canopyRadius, windData) {
        const windSpeed = windData.speed || 10;
        const windDirection = windData.direction || 0; // Degrees from North

        // Effective downwind distance depends on wind speed and canopy size
        // Based on aerodynamic research: effective zone = 10-15x canopy height
        const effectiveDistance = canopyRadius * 10 * (1 + windSpeed / 30);

        // Zone width narrows with distance
        const nearWidth = canopyRadius * 2;
        const farWidth = canopyRadius * 0.5;

        // Convert wind direction to radians (direction wind is coming FROM)
        // We want direction wind is going TO
        const downwindRad = ((windDirection + 180) % 360) * Math.PI / 180;

        // Calculate zone vertices
        const zone = this.calculateZonePolygon(
            treeLocation,
            downwindRad,
            effectiveDistance,
            nearWidth,
            farWidth
        );

        return zone;
    },

    /**
     * Calculate zone polygon vertices
     */
    calculateZonePolygon(origin, direction, length, nearWidth, farWidth) {
        const metersPerDegLat = 111320;
        const metersPerDegLng = metersPerDegLat * Math.cos(origin.lat * Math.PI / 180);

        // Perpendicular direction for width
        const perpDir = direction + Math.PI / 2;

        // Near edge points (at tree)
        const nearLeft = {
            lat: origin.lat + (nearWidth * Math.cos(perpDir)) / metersPerDegLat,
            lng: origin.lng + (nearWidth * Math.sin(perpDir)) / metersPerDegLng
        };
        const nearRight = {
            lat: origin.lat - (nearWidth * Math.cos(perpDir)) / metersPerDegLat,
            lng: origin.lng - (nearWidth * Math.sin(perpDir)) / metersPerDegLng
        };

        // Far edge points (downwind)
        const farCenter = {
            lat: origin.lat + (length * Math.cos(direction)) / metersPerDegLat,
            lng: origin.lng + (length * Math.sin(direction)) / metersPerDegLng
        };
        const farLeft = {
            lat: farCenter.lat + (farWidth * Math.cos(perpDir)) / metersPerDegLat,
            lng: farCenter.lng + (farWidth * Math.sin(perpDir)) / metersPerDegLng
        };
        const farRight = {
            lat: farCenter.lat - (farWidth * Math.cos(perpDir)) / metersPerDegLat,
            lng: farCenter.lng - (farWidth * Math.sin(perpDir)) / metersPerDegLng
        };

        return [nearLeft, farLeft, farRight, nearRight];
    },

    /**
     * Calculate atmospheric stability class (Pasquill-Gifford)
     * Used in Gaussian dispersion model
     * @param {Object} conditions - { windSpeed, cloudCover, timeOfDay }
     * @returns {string} Stability class A-F
     */
    getStabilityClass(conditions = {}) {
        const windSpeed = conditions.windSpeed || 10;
        const isDay = conditions.timeOfDay === 'day' ||
                     (new Date().getHours() >= 6 && new Date().getHours() < 18);

        // Simplified Pasquill stability classification
        if (isDay) {
            if (windSpeed < 2) return 'A'; // Very unstable
            if (windSpeed < 5) return 'B'; // Moderately unstable
            if (windSpeed < 6) return 'C'; // Slightly unstable
            return 'D'; // Neutral
        } else {
            if (windSpeed < 3) return 'F'; // Stable
            if (windSpeed < 5) return 'E'; // Slightly stable
            return 'D'; // Neutral
        }
    },

    /**
     * Get dispersion coefficients for Gaussian model
     * @param {string} stabilityClass - Pasquill class A-F
     * @param {number} distance - Downwind distance in meters
     * @returns {Object} { sigmaY, sigmaZ } - horizontal and vertical dispersion
     */
    getDispersionCoefficients(stabilityClass, distance) {
        // Pasquill-Gifford dispersion coefficients
        // Based on rural terrain (urban would be higher)
        const coefficients = {
            A: { ay: 0.22, by: 0.0001, az: 0.20, bz: 0.0 },
            B: { ay: 0.16, by: 0.0001, az: 0.12, bz: 0.0 },
            C: { ay: 0.11, by: 0.0001, az: 0.08, bz: 0.0002 },
            D: { ay: 0.08, by: 0.0001, az: 0.06, bz: 0.0015 },
            E: { ay: 0.06, by: 0.0001, az: 0.03, bz: 0.0003 },
            F: { ay: 0.04, by: 0.0001, az: 0.016, bz: 0.0003 }
        };

        const coef = coefficients[stabilityClass] || coefficients['D'];
        const x = Math.max(distance, 1);

        // Simplified formulas
        const sigmaY = coef.ay * x * Math.pow(1 + coef.by * x, -0.5);
        const sigmaZ = coef.az * x * Math.pow(1 + coef.bz * x, -0.5);

        return { sigmaY, sigmaZ };
    },

    /**
     * Calculate wind effect on tree cluster
     * Multiple trees create wind breaks that enhance particle settling
     * @param {Array} trees - Array of tree positions
     * @param {Object} windData - Wind data
     * @returns {number} Cluster effectiveness multiplier
     */
    calculateClusterWindEffect(trees, windData) {
        if (trees.length < 2) return 1.0;

        const windSpeed = windData.speed || 10;
        const windDir = windData.direction || 0;

        // Check if trees form a windbreak perpendicular to wind
        // Simplified: more trees = better windbreak
        const windBreakFactor = Math.min(1 + (trees.length * 0.05), 1.3);

        // High winds can bypass sparse plantings
        const speedPenalty = windSpeed > 30 ? 0.9 : 1.0;

        return windBreakFactor * speedPenalty;
    },

    /**
     * Generate wind visualization arrows for the map
     * @param {Object} bounds - Map bounds { north, south, east, west }
     * @param {Object} windData - Wind data
     * @param {number} gridSpacing - Spacing in degrees
     * @returns {Array} Arrow coordinates and rotations
     */
    generateWindArrows(bounds, windData, gridSpacing = 0.02) {
        const arrows = [];
        const direction = windData.direction || 0;
        const speed = windData.speed || 10;

        // Arrow length based on wind speed
        const arrowLength = 0.005 + (speed / 100) * 0.01;

        for (let lat = bounds.south; lat <= bounds.north; lat += gridSpacing) {
            for (let lng = bounds.west; lng <= bounds.east; lng += gridSpacing) {
                // Add slight random variation for natural look
                const varDir = direction + (Math.random() - 0.5) * 10;

                arrows.push({
                    lat,
                    lng,
                    direction: varDir,
                    length: arrowLength,
                    speed: speed + (Math.random() - 0.5) * 2
                });
            }
        }

        return arrows;
    },

    /**
     * Set API key (for production use)
     */
    setApiKey(key) {
        this.API_KEY = key;
    }
};

// Export for use in other modules
window.WindModel = WindModel;
