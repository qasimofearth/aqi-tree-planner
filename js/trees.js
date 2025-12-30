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
        },

        peepal: {
            id: 'peepal',
            commonName: 'Peepal (Sacred Fig)',
            scientificName: 'Ficus religiosa',
            localNames: { urdu: 'پیپل', hindi: 'पीपल' },
            icon: '🌳',
            color: '#3CB371',

            pm25Absorption: 35.8,
            pm10Absorption: 52.4,
            no2Absorption: 11.2,
            so2Absorption: 8.6,
            o3Absorption: 15.4,
            co2Sequestration: 32.5,

            leafAreaIndex: 7.2,
            leafAreaTotal: 520,

            matureHeight: 25,
            canopyDiameter: 20,
            canopyArea: 314,
            growthRate: 'fast',

            pollutionTolerance: 'very-high',
            droughtTolerance: 'high',
            waterRequirement: 'low',
            temperatureRange: { min: 0, max: 48 },

            seasonalEfficiency: {
                winter: 0.7,    // Deciduous - loses leaves
                summer: 1.0,
                monsoon: 0.95
            },

            costs: {
                sapling: 600,
                planting: 600,
                annualMaintenance: 350
            },

            suitability: {
                lahore: 'excellent',
                delhi: 'excellent'
            },

            notes: 'Sacred tree, releases oxygen 24/7. Massive canopy, best PM absorber. Needs space - not for narrow streets. Long lifespan (500+ years).'
        },

        banyan: {
            id: 'banyan',
            commonName: 'Banyan (Bargad)',
            scientificName: 'Ficus benghalensis',
            localNames: { urdu: 'برگد', hindi: 'बरगद' },
            icon: '🌳',
            color: '#2E7D32',

            pm25Absorption: 38.5,
            pm10Absorption: 56.2,
            no2Absorption: 12.5,
            so2Absorption: 9.2,
            o3Absorption: 16.8,
            co2Sequestration: 35.2,

            leafAreaIndex: 8.5,
            leafAreaTotal: 680,

            matureHeight: 25,
            canopyDiameter: 30,
            canopyArea: 707,
            growthRate: 'medium',

            pollutionTolerance: 'very-high',
            droughtTolerance: 'very-high',
            waterRequirement: 'low',
            temperatureRange: { min: 5, max: 48 },

            seasonalEfficiency: {
                winter: 0.9,
                summer: 1.0,
                monsoon: 0.95
            },

            costs: {
                sapling: 1000,
                planting: 800,
                annualMaintenance: 400
            },

            suitability: {
                lahore: 'excellent',
                delhi: 'excellent'
            },

            notes: 'National tree of India. Largest canopy of any tree. Aerial roots expand coverage. Best for parks and open spaces, not streets.'
        },

        jamun: {
            id: 'jamun',
            commonName: 'Jamun (Indian Blackberry)',
            scientificName: 'Syzygium cumini',
            localNames: { urdu: 'جامن', hindi: 'जामुन' },
            icon: '🌳',
            color: '#4A148C',

            pm25Absorption: 26.3,
            pm10Absorption: 38.5,
            no2Absorption: 7.8,
            so2Absorption: 6.2,
            o3Absorption: 11.5,
            co2Sequestration: 22.4,

            leafAreaIndex: 5.8,
            leafAreaTotal: 320,

            matureHeight: 20,
            canopyDiameter: 12,
            canopyArea: 113,
            growthRate: 'medium',

            pollutionTolerance: 'high',
            droughtTolerance: 'medium',
            waterRequirement: 'medium',
            temperatureRange: { min: 0, max: 46 },

            seasonalEfficiency: {
                winter: 0.95,
                summer: 1.0,
                monsoon: 0.9
            },

            costs: {
                sapling: 700,
                planting: 500,
                annualMaintenance: 300
            },

            suitability: {
                lahore: 'excellent',
                delhi: 'excellent'
            },

            notes: 'Evergreen, produces edible fruit. Dense foliage good for PM capture. Attracts birds. Good for avenues and parks.'
        },

        arjun: {
            id: 'arjun',
            commonName: 'Arjun Tree',
            scientificName: 'Terminalia arjuna',
            localNames: { urdu: 'ارجن', hindi: 'अर्जुन' },
            icon: '🌳',
            color: '#5D4037',

            pm25Absorption: 29.6,
            pm10Absorption: 44.2,
            no2Absorption: 8.8,
            so2Absorption: 7.0,
            o3Absorption: 13.2,
            co2Sequestration: 26.8,

            leafAreaIndex: 6.2,
            leafAreaTotal: 380,

            matureHeight: 25,
            canopyDiameter: 14,
            canopyArea: 154,
            growthRate: 'medium',

            pollutionTolerance: 'high',
            droughtTolerance: 'high',
            waterRequirement: 'medium',
            temperatureRange: { min: 2, max: 45 },

            seasonalEfficiency: {
                winter: 0.75,   // Semi-deciduous
                summer: 1.0,
                monsoon: 0.95
            },

            costs: {
                sapling: 900,
                planting: 600,
                annualMaintenance: 350
            },

            suitability: {
                lahore: 'excellent',
                delhi: 'excellent'
            },

            notes: 'Medicinal tree with heart health benefits. Good roadside tree. Bark used in Ayurveda. Tolerates waterlogging.'
        },

        amaltas: {
            id: 'amaltas',
            commonName: 'Amaltas (Golden Shower)',
            scientificName: 'Cassia fistula',
            localNames: { urdu: 'املتاس', hindi: 'अमलतास' },
            icon: '🌼',
            color: '#FFD700',

            pm25Absorption: 18.4,
            pm10Absorption: 28.6,
            no2Absorption: 5.5,
            so2Absorption: 4.2,
            o3Absorption: 8.8,
            co2Sequestration: 16.5,

            leafAreaIndex: 4.2,
            leafAreaTotal: 180,

            matureHeight: 15,
            canopyDiameter: 10,
            canopyArea: 78.5,
            growthRate: 'medium',

            pollutionTolerance: 'medium',
            droughtTolerance: 'high',
            waterRequirement: 'low',
            temperatureRange: { min: 5, max: 45 },

            seasonalEfficiency: {
                winter: 0.6,    // Deciduous
                summer: 1.0,    // Peak flowering
                monsoon: 0.85
            },

            costs: {
                sapling: 500,
                planting: 400,
                annualMaintenance: 250
            },

            suitability: {
                lahore: 'good',
                delhi: 'excellent'
            },

            notes: 'Beautiful yellow flowers in summer. State tree of Kerala. Moderate PM capture but high aesthetic value. Good for boulevards.'
        },

        kachnar: {
            id: 'kachnar',
            commonName: 'Kachnar (Orchid Tree)',
            scientificName: 'Bauhinia variegata',
            localNames: { urdu: 'کچنار', hindi: 'कचनार' },
            icon: '🌸',
            color: '#E91E63',

            pm25Absorption: 16.8,
            pm10Absorption: 25.4,
            no2Absorption: 5.0,
            so2Absorption: 3.8,
            o3Absorption: 7.8,
            co2Sequestration: 14.2,

            leafAreaIndex: 3.8,
            leafAreaTotal: 150,

            matureHeight: 12,
            canopyDiameter: 8,
            canopyArea: 50,
            growthRate: 'fast',

            pollutionTolerance: 'medium',
            droughtTolerance: 'medium',
            waterRequirement: 'medium',
            temperatureRange: { min: 5, max: 42 },

            seasonalEfficiency: {
                winter: 0.5,    // Deciduous, loses leaves
                summer: 1.0,    // Peak with flowers
                monsoon: 0.9
            },

            costs: {
                sapling: 450,
                planting: 350,
                annualMaintenance: 200
            },

            suitability: {
                lahore: 'good',
                delhi: 'good'
            },

            notes: 'Beautiful pink/white flowers. Edible flowers used in cooking. Compact size suits urban spaces. Fast establishment.'
        },

        sheesham: {
            id: 'sheesham',
            commonName: 'Sheesham (Indian Rosewood)',
            scientificName: 'Dalbergia sissoo',
            localNames: { urdu: 'شیشم', hindi: 'शीशम' },
            icon: '🌳',
            color: '#6D4C41',

            pm25Absorption: 24.5,
            pm10Absorption: 36.8,
            no2Absorption: 7.2,
            so2Absorption: 5.8,
            o3Absorption: 10.5,
            co2Sequestration: 28.6,

            leafAreaIndex: 5.0,
            leafAreaTotal: 280,

            matureHeight: 25,
            canopyDiameter: 12,
            canopyArea: 113,
            growthRate: 'fast',

            pollutionTolerance: 'high',
            droughtTolerance: 'high',
            waterRequirement: 'low',
            temperatureRange: { min: -4, max: 48 },

            seasonalEfficiency: {
                winter: 0.7,    // Deciduous
                summer: 1.0,
                monsoon: 0.95
            },

            costs: {
                sapling: 600,
                planting: 500,
                annualMaintenance: 250
            },

            suitability: {
                lahore: 'excellent',
                delhi: 'excellent'
            },

            notes: 'Premium timber tree. Nitrogen-fixing improves soil. Very hardy and fast-growing. Excellent avenue tree. Provincial tree of Punjab.'
        },

        pilkhan: {
            id: 'pilkhan',
            commonName: 'Pilkhan (White Fig)',
            scientificName: 'Ficus virens',
            localNames: { urdu: 'پلکھن', hindi: 'पिलखन' },
            icon: '🌳',
            color: '#66BB6A',

            pm25Absorption: 32.4,
            pm10Absorption: 48.6,
            no2Absorption: 10.2,
            so2Absorption: 8.0,
            o3Absorption: 14.2,
            co2Sequestration: 30.5,

            leafAreaIndex: 6.8,
            leafAreaTotal: 450,

            matureHeight: 25,
            canopyDiameter: 18,
            canopyArea: 254,
            growthRate: 'fast',

            pollutionTolerance: 'very-high',
            droughtTolerance: 'high',
            waterRequirement: 'medium',
            temperatureRange: { min: 5, max: 46 },

            seasonalEfficiency: {
                winter: 0.65,   // Brief leaf drop
                summer: 1.0,
                monsoon: 0.95
            },

            costs: {
                sapling: 700,
                planting: 600,
                annualMaintenance: 350
            },

            suitability: {
                lahore: 'excellent',
                delhi: 'excellent'
            },

            notes: 'Fast-growing fig tree. Excellent pollution fighter. Dense canopy provides great shade. Birds love the fruit. Good for parks.'
        }
    },

    // Tree maturity multipliers for timeline calculations
    maturityMultipliers: {
        year1: 0.15,    // Sapling - 15% of mature capacity
        year5: 0.45,    // Young tree - 45%
        year10: 0.75,   // Established - 75%
        year20: 1.0     // Mature - 100%
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
    },

    /**
     * Calculate impact at different maturity stages
     * @param {Array} trees - Array of {speciesId, count}
     * @param {string} season - Current season
     * @returns {Object} Impact at year 1, 5, 10, 20
     */
    calculateTimelineImpact(trees, season = 'winter') {
        const timeline = {
            year1: { pm25Reduction: 0, co2: 0, coverage: 0 },
            year5: { pm25Reduction: 0, co2: 0, coverage: 0 },
            year10: { pm25Reduction: 0, co2: 0, coverage: 0 },
            year20: { pm25Reduction: 0, co2: 0, coverage: 0 }
        };

        trees.forEach(tree => {
            const species = this.getById(tree.speciesId);
            if (!species) return;

            const count = tree.count || 1;
            const seasonFactor = species.seasonalEfficiency[season] || 1.0;

            Object.keys(timeline).forEach(year => {
                const multiplier = this.maturityMultipliers[year];
                timeline[year].pm25Reduction += species.pm25Absorption * count * seasonFactor * multiplier;
                timeline[year].co2 += species.co2Sequestration * count * multiplier / 1000;
                timeline[year].coverage += species.canopyArea * count * multiplier / 1000000;
            });
        });

        // Round values
        Object.keys(timeline).forEach(year => {
            timeline[year].pm25Reduction = Math.round(timeline[year].pm25Reduction * 10) / 10;
            timeline[year].co2 = Math.round(timeline[year].co2 * 10) / 10;
            timeline[year].coverage = Math.round(timeline[year].coverage * 100) / 100;
        });

        return timeline;
    },

    /**
     * Calculate health impact based on PM2.5 reduction
     * Based on WHO and epidemiological studies
     * @param {number} pm25Reduction - PM2.5 reduction in μg/m³
     * @param {number} population - Affected population
     * @returns {Object} Health impact metrics
     */
    calculateHealthImpact(pm25Reduction, population) {
        // Per 10 μg/m³ reduction in PM2.5:
        // - 6% reduction in all-cause mortality (Pope et al. 2002)
        // - 8% reduction in respiratory hospitalizations
        // - 4% reduction in cardiovascular events

        const reductionPer10 = pm25Reduction / 10;

        // Baseline rates per 100,000 (South Asian urban averages)
        const baselineMortality = 850;  // per 100,000/year
        const baselineRespHosp = 1200;  // per 100,000/year
        const baselineCardio = 600;     // per 100,000/year

        const populationFactor = population / 100000;

        const livesSaved = Math.round(baselineMortality * 0.06 * reductionPer10 * populationFactor);
        const respHospPrevented = Math.round(baselineRespHosp * 0.08 * reductionPer10 * populationFactor);
        const cardioPrevented = Math.round(baselineCardio * 0.04 * reductionPer10 * populationFactor);

        // DALYs (Disability-Adjusted Life Years) saved
        // Roughly 10 DALYs per premature death prevented
        const dalysSaved = livesSaved * 10 + respHospPrevented * 0.1 + cardioPrevented * 0.5;

        // Economic value (WHO recommends $50,000-150,000 per DALY for South Asia)
        const economicValue = Math.round(dalysSaved * 75000);

        return {
            livesSavedPerYear: livesSaved,
            respiratoryHospPrevented: respHospPrevented,
            cardiovascularEventsPrevented: cardioPrevented,
            dalysSaved: Math.round(dalysSaved),
            economicValueUSD: economicValue
        };
    }
};

// Export for use in other modules
window.TreeSpecies = TreeSpecies;
