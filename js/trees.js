/**
 * Tree Species Database
 * Air quality impact data based on:
 * - Nowak et al. (2006) - Air pollution removal by urban trees
 * - Yang et al. (2015) - Particulate matter removal by urban forests
 * - CPCB India studies on urban forestry
 * - i-Tree Eco model parameters
 */

const TreeSpecies = {
    // Tree species data with scientific absorption rates
    species: {
        neem: {
            id: 'neem',
            commonName: 'Neem',
            scientificName: 'Azadirachta indica',
            localNames: { urdu: 'نیم', hindi: 'नीम' },
            icon: '🌳',
            color: '#228B22',

            // Air quality parameters (based on research)
            pm25Absorption: 28.4,      // μg/m³/tree/day
            pm10Absorption: 42.6,      // μg/m³/tree/day
            no2Absorption: 8.2,        // μg/m³/tree/day
            so2Absorption: 6.4,        // μg/m³/tree/day
            o3Absorption: 12.8,        // μg/m³/tree/day
            co2Sequestration: 21.7,    // kg/tree/year

            // Leaf Area Index (LAI) - critical for deposition velocity
            leafAreaIndex: 5.2,        // m²/m²
            leafAreaTotal: 285,        // m² per mature tree

            // Physical characteristics
            matureHeight: 15,          // meters
            canopyDiameter: 12,        // meters
            canopyArea: 113,           // m² (π * r²)
            growthRate: 'fast',        // fast/medium/slow

            // Environmental tolerance
            pollutionTolerance: 'high',
            droughtTolerance: 'high',
            waterRequirement: 'low',
            temperatureRange: { min: 4, max: 48 }, // °C

            // Seasonal variation coefficients
            seasonalEfficiency: {
                winter: 0.85,   // Reduced but evergreen
                summer: 1.0,
                monsoon: 0.95
            },

            // Economic data (PKR)
            costs: {
                sapling: 800,
                planting: 500,
                annualMaintenance: 300
            },

            // Suitability
            suitability: {
                lahore: 'excellent',
                delhi: 'excellent'
            },

            notes: 'Highly pollution-tolerant, drought-resistant. Excellent for roadside planting. Native to South Asia.'
        },

        safeda: {
            id: 'safeda',
            commonName: 'Safeda (Eucalyptus)',
            scientificName: 'Eucalyptus globulus',
            localNames: { urdu: 'سفیدہ', hindi: 'सफेदा' },
            icon: '🌲',
            color: '#006400',

            pm25Absorption: 22.1,
            pm10Absorption: 35.8,
            no2Absorption: 6.5,
            so2Absorption: 5.8,
            o3Absorption: 10.2,
            co2Sequestration: 28.4,

            leafAreaIndex: 3.8,
            leafAreaTotal: 420,

            matureHeight: 25,
            canopyDiameter: 8,
            canopyArea: 50,
            growthRate: 'very-fast',

            pollutionTolerance: 'very-high',
            droughtTolerance: 'high',
            waterRequirement: 'medium',
            temperatureRange: { min: -3, max: 45 },

            seasonalEfficiency: {
                winter: 0.90,
                summer: 1.0,
                monsoon: 0.85
            },

            costs: {
                sapling: 400,
                planting: 400,
                annualMaintenance: 200
            },

            suitability: {
                lahore: 'good',
                delhi: 'good'
            },

            notes: 'Fast-growing, excellent for quick coverage. High water consumption may affect groundwater. Tall and narrow canopy.'
        },

        cookPine: {
            id: 'cookPine',
            commonName: 'Cook Pine',
            scientificName: 'Araucaria columnaris',
            localNames: { urdu: 'کک پائن', hindi: 'कुक पाइन' },
            icon: '🌲',
            color: '#2E8B57',

            pm25Absorption: 15.3,
            pm10Absorption: 24.2,
            no2Absorption: 4.8,
            so2Absorption: 3.2,
            o3Absorption: 7.5,
            co2Sequestration: 15.2,

            leafAreaIndex: 4.5,
            leafAreaTotal: 180,

            matureHeight: 12,
            canopyDiameter: 4,
            canopyArea: 12.5,
            growthRate: 'slow',

            pollutionTolerance: 'medium',
            droughtTolerance: 'medium',
            waterRequirement: 'medium',
            temperatureRange: { min: 5, max: 38 },

            seasonalEfficiency: {
                winter: 1.0,    // Evergreen
                summer: 0.90,
                monsoon: 0.95
            },

            costs: {
                sapling: 1500,
                planting: 600,
                annualMaintenance: 400
            },

            suitability: {
                lahore: 'moderate',
                delhi: 'moderate'
            },

            notes: 'Ornamental conifer, good for boulevards. Narrow profile suits urban spaces. Less pollution-tolerant than Neem.'
        },

        deodarCedar: {
            id: 'deodarCedar',
            commonName: 'Deodar Cedar',
            scientificName: 'Cedrus deodara',
            localNames: { urdu: 'دیودار', hindi: 'देवदार' },
            icon: '🌲',
            color: '#355E3B',

            pm25Absorption: 31.2,
            pm10Absorption: 48.5,
            no2Absorption: 9.4,
            so2Absorption: 7.2,
            o3Absorption: 14.6,
            co2Sequestration: 24.8,

            leafAreaIndex: 6.8,
            leafAreaTotal: 380,

            matureHeight: 20,
            canopyDiameter: 15,
            canopyArea: 177,
            growthRate: 'medium',

            pollutionTolerance: 'medium-high',
            droughtTolerance: 'medium',
            waterRequirement: 'medium',
            temperatureRange: { min: -10, max: 40 },

            seasonalEfficiency: {
                winter: 1.0,    // Evergreen conifer
                summer: 0.85,   // Heat stress possible
                monsoon: 0.95
            },

            costs: {
                sapling: 2000,
                planting: 800,
                annualMaintenance: 500
            },

            suitability: {
                lahore: 'good',
                delhi: 'good'
            },

            notes: 'National tree of Pakistan. Excellent PM capture due to needle structure. Best in cooler areas but adapts to plains.'
        }
    },

    /**
     * Get all species as array
     */
    getAll() {
        return Object.values(this.species);
    },

    /**
     * Get species by ID
     */
    getById(id) {
        return this.species[id] || null;
    },

    /**
     * Calculate PM2.5 removal for given number of trees
     * @param {string} speciesId - Species identifier
     * @param {number} count - Number of trees
     * @param {string} season - Current season
     * @returns {number} Total PM2.5 removal in μg/m³/day
     */
    calculatePM25Removal(speciesId, count, season = 'winter') {
        const species = this.getById(speciesId);
        if (!species) return 0;

        const baseRemoval = species.pm25Absorption * count;
        const seasonalFactor = species.seasonalEfficiency[season] || 1.0;

        return baseRemoval * seasonalFactor;
    },

    /**
     * Calculate effective coverage area considering wind
     * @param {string} speciesId - Species identifier
     * @param {number} windSpeed - Wind speed in km/h
     * @returns {number} Effective coverage area in m²
     */
    calculateCoverageArea(speciesId, windSpeed = 10) {
        const species = this.getById(speciesId);
        if (!species) return 0;

        const baseArea = species.canopyArea;
        // Wind extends effective area downwind
        const windFactor = 1 + (windSpeed / 50); // Up to 2x at 50 km/h

        return baseArea * windFactor;
    },

    /**
     * Calculate annual CO2 sequestration
     * @param {Array} trees - Array of {speciesId, count}
     * @returns {number} Total tonnes CO2/year
     */
    calculateAnnualCO2(trees) {
        return trees.reduce((total, tree) => {
            const species = this.getById(tree.speciesId);
            if (!species) return total;
            return total + (species.co2Sequestration * tree.count / 1000); // Convert kg to tonnes
        }, 0);
    },

    /**
     * Calculate total project cost
     * @param {Array} trees - Array of {speciesId, count}
     * @returns {Object} Cost breakdown
     */
    calculateCosts(trees) {
        const costs = {
            saplings: 0,
            planting: 0,
            maintenance: 0,
            total: 0
        };

        trees.forEach(tree => {
            const species = this.getById(tree.speciesId);
            if (!species) return;

            costs.saplings += species.costs.sapling * tree.count;
            costs.planting += species.costs.planting * tree.count;
            costs.maintenance += species.costs.annualMaintenance * tree.count;
        });

        costs.total = costs.saplings + costs.planting + costs.maintenance;

        return costs;
    },

    /**
     * Get deposition velocity for species (used in Gaussian model)
     * @param {string} speciesId - Species identifier
     * @returns {number} Deposition velocity in m/s
     */
    getDepositionVelocity(speciesId) {
        const species = this.getById(speciesId);
        if (!species) return 0.002; // Default

        // Deposition velocity depends on LAI and particle capture efficiency
        // Vd = (LAI * capture_efficiency) / (resistance factors)
        // Simplified calculation based on i-Tree methodology
        const baseVd = 0.002; // m/s for PM2.5
        const laiFactor = species.leafAreaIndex / 5.0; // Normalized to LAI of 5

        return baseVd * laiFactor;
    },

    /**
     * Determine cluster bonus (trees in groups are more effective)
     * @param {number} treeCount - Number of trees in cluster
     * @param {number} clusterRadius - Radius of cluster in meters
     * @returns {number} Bonus multiplier (1.0 - 1.2)
     */
    getClusterBonus(treeCount, clusterRadius = 50) {
        if (treeCount < 3) return 1.0;

        // Dense clusters create turbulence that improves particle capture
        const density = treeCount / (Math.PI * clusterRadius * clusterRadius);
        const densityFactor = Math.min(density * 10000, 0.2); // Max 20% bonus

        return 1.0 + densityFactor;
    }
};

// Export for use in other modules
window.TreeSpecies = TreeSpecies;
