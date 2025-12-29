/**
 * AQI Dispersion & Tree Impact Simulation Module
 * Implements Gaussian plume model for pollution dispersion
 * and calculates tree impact on particulate matter
 *
 * Based on:
 * - US EPA AERMOD methodology
 * - i-Tree Eco model for urban forest benefits
 * - Nowak et al. (2006) particulate deposition studies
 */

const Simulation = {
    // Grid resolution for calculations
    GRID_RESOLUTION: 100, // meters

    // Simulation state
    isRunning: false,
    progress: 0,

    // Results cache
    results: null,

    /**
     * Run full AQI impact simulation
     * @param {Object} params - Simulation parameters
     * @returns {Promise<Object>} Simulation results
     */
    async runSimulation(params) {
        const {
            trees,           // Array of placed trees with species and location
            city,            // 'lahore' or 'delhi'
            stationData,     // Current AQI readings from stations
            windData,        // Current wind conditions
            season           // 'winter', 'summer', 'monsoon'
        } = params;

        this.isRunning = true;
        this.progress = 0;

        try {
            // Step 1: Calculate baseline AQI field (10%)
            this.updateProgress(5, 'Calculating baseline pollution field...');
            const baselineField = await this.calculateBaselineField(city, stationData);

            // Step 2: Calculate tree deposition effects (40%)
            this.updateProgress(15, 'Computing tree particle capture rates...');
            const treeEffects = await this.calculateTreeEffects(trees, season);

            // Step 3: Apply Gaussian dispersion model (30%)
            this.updateProgress(45, 'Running Gaussian dispersion model...');
            const dispersionField = await this.applyDispersionModel(
                baselineField,
                trees,
                treeEffects,
                windData
            );

            // Step 4: Calculate impact zones (15%)
            this.updateProgress(75, 'Calculating impact zones...');
            const impactZones = this.calculateImpactZones(trees, windData, treeEffects);

            // Step 5: Generate summary statistics (5%)
            this.updateProgress(90, 'Generating summary statistics...');
            const summary = this.calculateSummaryStats(
                baselineField,
                dispersionField,
                trees,
                treeEffects,
                city
            );

            this.updateProgress(100, 'Simulation complete');

            this.results = {
                baseline: baselineField,
                projected: dispersionField,
                impactZones,
                summary,
                trees,
                timestamp: new Date().toISOString()
            };

            this.isRunning = false;
            return this.results;

        } catch (error) {
            this.isRunning = false;
            throw error;
        }
    },

    /**
     * Calculate baseline pollution concentration field
     */
    async calculateBaselineField(city, stationData) {
        const bounds = AqiApi.getCityBounds(city);
        const field = [];

        const latStep = this.GRID_RESOLUTION / 111320; // Convert meters to degrees
        const lngStep = this.GRID_RESOLUTION / (111320 * Math.cos(bounds.north * Math.PI / 180));

        for (let lat = bounds.south; lat <= bounds.north; lat += latStep) {
            const row = [];
            for (let lng = bounds.west; lng <= bounds.east; lng += lngStep) {
                const { pm25 } = AqiApi.interpolateAQI(lat, lng, stationData);
                row.push({
                    lat,
                    lng,
                    pm25,
                    pm10: pm25 * 1.4 // Typical PM10/PM2.5 ratio
                });
            }
            field.push(row);
        }

        return field;
    },

    /**
     * Calculate deposition effects for each tree
     */
    async calculateTreeEffects(trees, season) {
        return trees.map(tree => {
            const species = TreeSpecies.getById(tree.speciesId);
            if (!species) return null;

            // Base removal rate
            const baseRemoval = species.pm25Absorption;

            // Seasonal adjustment
            const seasonalFactor = species.seasonalEfficiency[season] || 1.0;

            // Deposition velocity (m/s)
            const Vd = TreeSpecies.getDepositionVelocity(tree.speciesId);

            // Leaf area (m²)
            const leafArea = species.leafAreaTotal;

            // Calculate effective removal (μg/s)
            // Formula: Removal = Vd × LAI × Concentration × Area
            const effectiveRemoval = Vd * species.leafAreaIndex * 1000; // Simplified

            return {
                ...tree,
                species,
                baseRemoval: baseRemoval * seasonalFactor,
                depositionVelocity: Vd,
                leafArea,
                effectiveRadius: species.canopyDiameter / 2,
                seasonalFactor
            };
        }).filter(t => t !== null);
    },

    /**
     * Apply Gaussian plume model for pollution reduction
     * C(x,y,z) = (Q / 2πuσyσz) × exp(-y²/2σy²) × [exp(-(z-H)²/2σz²) + exp(-(z+H)²/2σz²)]
     */
    async applyDispersionModel(baselineField, trees, treeEffects, windData) {
        const projectedField = JSON.parse(JSON.stringify(baselineField)); // Deep copy

        const windSpeed = Math.max(windData.speed || 10, 1); // Avoid division by zero
        const windDir = ((windData.direction || 0) + 180) % 360; // Downwind direction
        const windRad = windDir * Math.PI / 180;

        // Get atmospheric stability
        const stability = WindModel.getStabilityClass({ windSpeed });

        // Process each grid cell
        for (let i = 0; i < projectedField.length; i++) {
            for (let j = 0; j < projectedField[i].length; j++) {
                const cell = projectedField[i][j];
                let totalReduction = 0;

                // Calculate influence of each tree on this cell
                for (const tree of treeEffects) {
                    const reduction = this.calculateTreeInfluence(
                        cell,
                        tree,
                        windSpeed,
                        windRad,
                        stability
                    );
                    totalReduction += reduction;
                }

                // Apply reduction (with diminishing returns)
                const reductionFactor = 1 - Math.min(totalReduction / cell.pm25, 0.6);
                cell.pm25 = Math.max(cell.pm25 * reductionFactor, 10); // Minimum 10 μg/m³
                cell.pm10 = cell.pm25 * 1.4;
                cell.reduction = (1 - reductionFactor) * 100; // Percentage reduction
            }
        }

        return projectedField;
    },

    /**
     * Calculate influence of a single tree on a grid cell
     */
    calculateTreeInfluence(cell, tree, windSpeed, windRad, stability) {
        // Distance from tree to cell
        const dx = (cell.lng - tree.lng) * 111320 * Math.cos(cell.lat * Math.PI / 180);
        const dy = (cell.lat - tree.lat) * 111320;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If within canopy, high influence
        if (distance <= tree.effectiveRadius) {
            return tree.baseRemoval * 0.3; // 30% of max effect within canopy
        }

        // Calculate downwind distance (positive = downwind of tree)
        const downwindDist = dx * Math.sin(windRad) + dy * Math.cos(windRad);

        // Only affect downwind areas
        if (downwindDist < 0) return 0;

        // Crosswind distance
        const crosswindDist = Math.abs(dx * Math.cos(windRad) - dy * Math.sin(windRad));

        // Get dispersion coefficients
        const { sigmaY, sigmaZ } = WindModel.getDispersionCoefficients(stability, downwindDist);

        // Gaussian plume formula (simplified for 2D)
        const Q = tree.baseRemoval * 1000; // Source strength
        const u = windSpeed / 3.6; // Convert to m/s

        // Concentration reduction at this point
        const expY = Math.exp(-Math.pow(crosswindDist, 2) / (2 * Math.pow(sigmaY + 1, 2)));
        const reduction = (Q / (2 * Math.PI * u * (sigmaY + 1))) * expY;

        // Distance decay
        const distanceFactor = Math.exp(-distance / 500); // 500m decay constant

        return reduction * distanceFactor * 0.001; // Scale factor
    },

    /**
     * Calculate visual impact zones for each tree
     */
    calculateImpactZones(trees, windData, treeEffects) {
        return treeEffects.map(tree => {
            const windDir = windData.direction || 0;
            const windSpeed = windData.speed || 10;

            // Zone radius depends on canopy and wind
            const baseRadius = tree.effectiveRadius * 1.5;
            const downwindExtension = tree.effectiveRadius * (5 + windSpeed / 10);

            // Calculate zone polygon
            const zone = WindModel.calculateDownwindZone(
                { lat: tree.lat, lng: tree.lng },
                tree.effectiveRadius,
                windData
            );

            return {
                treeId: tree.id,
                lat: tree.lat,
                lng: tree.lng,
                canopyRadius: tree.effectiveRadius,
                impactZone: zone,
                reduction: tree.baseRemoval,
                speciesId: tree.speciesId
            };
        });
    },

    /**
     * Calculate summary statistics
     */
    calculateSummaryStats(baseline, projected, trees, treeEffects, city) {
        // Average baseline AQI
        let baselineSum = 0, projectedSum = 0, cellCount = 0;

        for (let i = 0; i < baseline.length; i++) {
            for (let j = 0; j < baseline[i].length; j++) {
                baselineSum += baseline[i][j].pm25;
                projectedSum += projected[i][j].pm25;
                cellCount++;
            }
        }

        const avgBaseline = baselineSum / cellCount;
        const avgProjected = projectedSum / cellCount;
        const reduction = ((avgBaseline - avgProjected) / avgBaseline) * 100;

        // Tree statistics by species
        const speciesCount = {};
        trees.forEach(tree => {
            speciesCount[tree.speciesId] = (speciesCount[tree.speciesId] || 0) + 1;
        });

        // Total coverage area
        const totalCoverage = treeEffects.reduce((sum, tree) => {
            return sum + Math.PI * Math.pow(tree.effectiveRadius, 2);
        }, 0) / 1000000; // Convert to km²

        // CO2 sequestration
        const co2 = TreeSpecies.calculateAnnualCO2(
            Object.entries(speciesCount).map(([speciesId, count]) => ({ speciesId, count }))
        );

        // Cost calculation
        const costs = TreeSpecies.calculateCosts(
            Object.entries(speciesCount).map(([speciesId, count]) => ({ speciesId, count }))
        );

        // Population benefited (rough estimate based on density)
        const cityDensity = city === 'lahore' ? 6300 : 11320; // people per km²
        const populationBenefited = Math.round(totalCoverage * cityDensity * 2); // x2 for overlap

        return {
            baseline: {
                avgPM25: Math.round(avgBaseline),
                category: AqiApi.getAQICategory(avgBaseline)
            },
            projected: {
                avgPM25: Math.round(avgProjected),
                category: AqiApi.getAQICategory(avgProjected)
            },
            reduction: {
                absolute: Math.round(avgBaseline - avgProjected),
                percentage: Math.round(reduction * 10) / 10
            },
            trees: {
                total: trees.length,
                bySpecies: speciesCount
            },
            coverage: {
                areaSqKm: Math.round(totalCoverage * 100) / 100,
                populationBenefited
            },
            environmental: {
                co2Tonnes: Math.round(co2 * 10) / 10
            },
            costs: {
                saplings: costs.saplings,
                planting: costs.planting,
                maintenance: costs.maintenance,
                total: costs.total,
                currency: city === 'lahore' ? 'PKR' : 'INR'
            }
        };
    },

    /**
     * Generate heatmap data for projected AQI
     */
    generateProjectedHeatmap(projectedField) {
        const points = [];

        for (let i = 0; i < projectedField.length; i++) {
            for (let j = 0; j < projectedField[i].length; j++) {
                const cell = projectedField[i][j];
                const intensity = Math.min(cell.pm25 / 500, 1);
                points.push([cell.lat, cell.lng, intensity]);
            }
        }

        return points;
    },

    /**
     * Generate comparison data (before/after)
     */
    generateComparisonData() {
        if (!this.results) return null;

        const beforePoints = [];
        const afterPoints = [];

        for (let i = 0; i < this.results.baseline.length; i++) {
            for (let j = 0; j < this.results.baseline[i].length; j++) {
                const before = this.results.baseline[i][j];
                const after = this.results.projected[i][j];

                beforePoints.push([before.lat, before.lng, Math.min(before.pm25 / 500, 1)]);
                afterPoints.push([after.lat, after.lng, Math.min(after.pm25 / 500, 1)]);
            }
        }

        return { before: beforePoints, after: afterPoints };
    },

    /**
     * Update simulation progress
     */
    updateProgress(percent, message) {
        this.progress = percent;

        // Dispatch custom event for UI updates
        const event = new CustomEvent('simulationProgress', {
            detail: { percent, message }
        });
        document.dispatchEvent(event);
    },

    /**
     * Get cluster bonus for trees placed close together
     */
    calculateClusterBonus(trees) {
        if (trees.length < 3) return 1.0;

        // Find clusters using simple distance threshold
        const clusterRadius = 100; // meters
        const clusters = [];

        trees.forEach(tree => {
            let addedToCluster = false;

            for (const cluster of clusters) {
                const centerLat = cluster.reduce((s, t) => s + t.lat, 0) / cluster.length;
                const centerLng = cluster.reduce((s, t) => s + t.lng, 0) / cluster.length;

                const dx = (tree.lng - centerLng) * 111320 * Math.cos(tree.lat * Math.PI / 180);
                const dy = (tree.lat - centerLat) * 111320;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < clusterRadius) {
                    cluster.push(tree);
                    addedToCluster = true;
                    break;
                }
            }

            if (!addedToCluster) {
                clusters.push([tree]);
            }
        });

        // Calculate average cluster bonus
        let totalBonus = 0;
        clusters.forEach(cluster => {
            totalBonus += TreeSpecies.getClusterBonus(cluster.length, clusterRadius);
        });

        return totalBonus / clusters.length;
    }
};

// Export for use in other modules
window.Simulation = Simulation;
