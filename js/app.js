/**
 * Main Application Controller
 * Coordinates all modules and handles UI interactions
 */

const App = {
    // Current state
    state: {
        city: 'lahore',
        season: 'winter',
        selectedSpecies: null,
        stationData: null,
        windData: null,
        simulationResults: null,
        isLoading: false
    },

    // Chart instance
    speciesChart: null,

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing AQI Tree Planner...');

        // Show loading overlay
        this.showLoading(true);

        try {
            // Initialize map
            MapManager.init();

            // Set up UI event listeners
            this.bindEventListeners();

            // Render tree species cards
            this.renderTreeSpecies();

            // Load initial data
            await this.loadCityData('lahore');

            // Initialize species chart
            this.initSpeciesChart();

            // Hide loading
            this.showLoading(false);

            console.log('AQI Tree Planner initialized successfully');

        } catch (error) {
            console.error('Initialization error:', error);
            this.showLoading(false);
            alert('Failed to initialize application. Please refresh the page.');
        }
    },

    /**
     * Bind all UI event listeners
     */
    bindEventListeners() {
        // City toggle buttons
        document.getElementById('btn-lahore')?.addEventListener('click', () => this.switchCity('lahore'));
        document.getElementById('btn-delhi')?.addEventListener('click', () => this.switchCity('delhi'));

        // Layer toggles
        document.getElementById('layer-aqi')?.addEventListener('change', (e) => {
            MapManager.toggleLayer('aqiHeatmap', e.target.checked);
        });

        document.getElementById('layer-wind')?.addEventListener('change', (e) => {
            MapManager.toggleLayer('windArrows', e.target.checked);
        });

        document.getElementById('layer-coverage')?.addEventListener('change', (e) => {
            MapManager.showCoverageZones(e.target.checked);
        });

        document.getElementById('layer-projected')?.addEventListener('change', (e) => {
            MapManager.toggleLayer('projectedHeatmap', e.target.checked);
            if (e.target.checked && !this.state.simulationResults) {
                MapManager.showToast('Run simulation first to see projected AQI');
                e.target.checked = false;
            }
        });

        // Season selector
        document.getElementById('season-select')?.addEventListener('change', (e) => {
            this.state.season = e.target.value;
            this.updateStats();
        });

        // Action buttons
        document.getElementById('btn-simulate')?.addEventListener('click', () => this.runSimulation());
        document.getElementById('btn-compare')?.addEventListener('click', () => this.showComparison());
        document.getElementById('btn-generate-report')?.addEventListener('click', () => this.generateReport());

        // Modal close buttons
        document.getElementById('modal-close')?.addEventListener('click', () => {
            document.getElementById('simulation-modal').classList.remove('active');
        });

        document.getElementById('compare-modal-close')?.addEventListener('click', () => {
            document.getElementById('compare-modal').classList.remove('active');
        });

        // Custom events from other modules
        document.addEventListener('cityChanged', (e) => this.loadCityData(e.detail.city));
        document.addEventListener('treePlaced', () => this.updateStats());
        document.addEventListener('treeRemoved', () => this.updateStats());
        document.addEventListener('treesCleared', () => this.updateStats());
        document.addEventListener('statsUpdate', () => this.updateStats());

        document.addEventListener('simulationProgress', (e) => {
            const { percent, message } = e.detail;
            const progressBar = document.getElementById('simulation-progress');
            const statusText = document.getElementById('simulation-status');

            if (progressBar) progressBar.style.width = `${percent}%`;
            if (statusText) statusText.textContent = message;
        });
    },

    /**
     * Switch to a different city
     */
    async switchCity(city) {
        if (this.state.city === city) return;

        // Update button states
        document.querySelectorAll('.city-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.city === city);
        });

        // Clear current trees
        if (MapManager.placedTrees.length > 0) {
            if (!confirm('Switching cities will clear placed trees. Continue?')) {
                // Revert button state
                document.querySelectorAll('.city-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.city === this.state.city);
                });
                return;
            }
            MapManager.clearAllTrees();
        }

        // Update state and map
        this.state.city = city;
        MapManager.setCity(city);

        // Load new city data
        await this.loadCityData(city);

        // Reset simulation results
        this.state.simulationResults = null;
        document.getElementById('layer-projected').checked = false;
    },

    /**
     * Load data for a city (AQI and wind)
     */
    async loadCityData(city) {
        this.showLoading(true);

        try {
            // Fetch AQI data
            this.state.stationData = await AqiApi.fetchCityData(city);

            // Fetch wind data
            this.state.windData = await WindModel.fetchWindData(city);

            // Update map visualizations
            MapManager.updateAqiHeatmap(this.state.stationData);
            MapManager.addStationMarkers(this.state.stationData);
            MapManager.updateWindArrows(this.state.windData);

            // Update UI displays
            this.updateCurrentAQI();
            this.updateWindIndicator();

        } catch (error) {
            console.error('Error loading city data:', error);
            MapManager.showToast('Error loading data. Using simulated values.');
        }

        this.showLoading(false);
    },

    /**
     * Render tree species selection cards
     */
    renderTreeSpecies() {
        const container = document.getElementById('tree-species-list');
        if (!container) return;

        const species = TreeSpecies.getAll();

        container.innerHTML = species.map(sp => `
            <div class="tree-card" data-species="${sp.id}" onclick="App.selectSpecies('${sp.id}')">
                <div class="tree-card-header">
                    <div class="tree-icon" style="background: ${sp.color}20;">
                        <span>${sp.icon}</span>
                    </div>
                    <div class="tree-name">
                        <h4>${sp.commonName}</h4>
                        <span>${sp.scientificName}</span>
                    </div>
                </div>
                <div class="tree-stats">
                    <div class="tree-stat">
                        <span>PM2.5</span>
                        <span class="tree-stat-value">${sp.pm25Absorption}</span>
                    </div>
                    <div class="tree-stat">
                        <span>Canopy</span>
                        <span class="tree-stat-value">${sp.canopyDiameter}m</span>
                    </div>
                    <div class="tree-stat">
                        <span>Tolerance</span>
                        <span class="tree-stat-value">${sp.pollutionTolerance}</span>
                    </div>
                    <div class="tree-stat">
                        <span>Water</span>
                        <span class="tree-stat-value">${sp.waterRequirement}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Select a tree species for placement
     */
    selectSpecies(speciesId) {
        this.state.selectedSpecies = speciesId;

        // Update UI
        document.querySelectorAll('.tree-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.species === speciesId);
        });

        // Update map manager
        MapManager.setSelectedSpecies(speciesId);

        const species = TreeSpecies.getById(speciesId);
        MapManager.showToast(`Selected: ${species.commonName} - Click on map to place`);
    },

    /**
     * Update current AQI display
     */
    updateCurrentAQI() {
        const { aqi, pm25 } = AqiApi.getCityAverageAQI(this.state.stationData);
        const category = AqiApi.getAQICategory(pm25);

        const aqiValue = document.getElementById('aqi-value');
        const aqiStatus = document.getElementById('aqi-status');

        if (aqiValue) {
            aqiValue.textContent = pm25;
            aqiValue.style.color = category.color;
        }

        if (aqiStatus) {
            aqiStatus.textContent = category.label;
            aqiStatus.style.background = category.color;
            aqiStatus.style.color = category.textColor;
        }
    },

    /**
     * Update wind indicator
     */
    updateWindIndicator() {
        const { speed, direction } = this.state.windData || { speed: 0, direction: 0 };

        const speedEl = document.getElementById('wind-speed');
        const arrowEl = document.getElementById('wind-arrow');

        if (speedEl) speedEl.textContent = Math.round(speed);
        if (arrowEl) arrowEl.style.transform = `rotate(${direction}deg)`;
    },

    /**
     * Update all statistics displays
     */
    updateStats() {
        const trees = MapManager.placedTrees;
        const season = this.state.season;

        // Count by species
        const speciesCount = {};
        trees.forEach(tree => {
            speciesCount[tree.speciesId] = (speciesCount[tree.speciesId] || 0) + 1;
        });

        // Total trees
        document.getElementById('stat-total-trees').textContent = trees.length;

        // PM2.5 reduction estimate
        let totalReduction = 0;
        Object.entries(speciesCount).forEach(([speciesId, count]) => {
            totalReduction += TreeSpecies.calculatePM25Removal(speciesId, count, season);
        });
        document.getElementById('stat-pm25-reduction').textContent = Math.round(totalReduction * 10) / 10;

        // Coverage area
        let totalCoverage = 0;
        trees.forEach(tree => {
            const species = TreeSpecies.getById(tree.speciesId);
            if (species) {
                totalCoverage += Math.PI * Math.pow(species.canopyDiameter / 2, 2);
            }
        });
        document.getElementById('stat-coverage').textContent = (totalCoverage / 1000000).toFixed(2);

        // CO2 sequestration
        const co2 = TreeSpecies.calculateAnnualCO2(
            Object.entries(speciesCount).map(([speciesId, count]) => ({ speciesId, count }))
        );
        document.getElementById('stat-co2').textContent = Math.round(co2 * 10) / 10;

        // Cost estimates
        const costs = TreeSpecies.calculateCosts(
            Object.entries(speciesCount).map(([speciesId, count]) => ({ speciesId, count }))
        );

        const currency = this.state.city === 'lahore' ? 'PKR' : 'INR';
        document.getElementById('cost-trees').textContent = `${currency} ${costs.saplings.toLocaleString()}`;
        document.getElementById('cost-labor').textContent = `${currency} ${costs.planting.toLocaleString()}`;
        document.getElementById('cost-maintenance').textContent = `${currency} ${costs.maintenance.toLocaleString()}`;
        document.getElementById('cost-total').textContent = `${currency} ${costs.total.toLocaleString()}`;

        // Update species chart
        this.updateSpeciesChart(speciesCount);

        // Update coverage zones if visible
        if (document.getElementById('layer-coverage')?.checked) {
            MapManager.showCoverageZones(true);
        }
    },

    /**
     * Initialize species distribution chart
     */
    initSpeciesChart() {
        const ctx = document.getElementById('species-chart')?.getContext('2d');
        if (!ctx) return;

        this.speciesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            font: { size: 10 }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    },

    /**
     * Update species chart with current data
     */
    updateSpeciesChart(speciesCount) {
        if (!this.speciesChart) return;

        const labels = [];
        const data = [];
        const colors = [];

        Object.entries(speciesCount).forEach(([speciesId, count]) => {
            const species = TreeSpecies.getById(speciesId);
            if (species) {
                labels.push(species.commonName);
                data.push(count);
                colors.push(species.color);
            }
        });

        this.speciesChart.data.labels = labels;
        this.speciesChart.data.datasets[0].data = data;
        this.speciesChart.data.datasets[0].backgroundColor = colors;
        this.speciesChart.update();
    },

    /**
     * Run AQI simulation
     */
    async runSimulation() {
        const trees = MapManager.placedTrees;

        if (trees.length === 0) {
            MapManager.showToast('Please place some trees first');
            return;
        }

        // Show simulation modal
        const modal = document.getElementById('simulation-modal');
        const resultsDiv = document.getElementById('simulation-results');

        modal.classList.add('active');
        resultsDiv.style.display = 'none';
        document.getElementById('simulation-progress').style.width = '0%';

        try {
            // Run simulation
            const results = await Simulation.runSimulation({
                trees: trees.map(t => ({
                    id: t.id,
                    lat: t.lat,
                    lng: t.lng,
                    speciesId: t.speciesId
                })),
                city: this.state.city,
                stationData: this.state.stationData,
                windData: this.state.windData,
                season: this.state.season
            });

            this.state.simulationResults = results;

            // Update projected heatmap
            MapManager.updateProjectedHeatmap(results.projected);

            // Show impact zones
            MapManager.showImpactZones(results.impactZones);

            // Display results
            document.getElementById('result-before-aqi').textContent = results.summary.baseline.avgPM25;
            document.getElementById('result-after-aqi').textContent = results.summary.projected.avgPM25;
            document.getElementById('result-reduction').textContent =
                `${results.summary.reduction.percentage}% reduction in PM2.5`;

            resultsDiv.style.display = 'block';

            // Enable projected layer toggle
            document.getElementById('layer-projected').disabled = false;

        } catch (error) {
            console.error('Simulation error:', error);
            MapManager.showToast('Simulation failed. Please try again.');
            modal.classList.remove('active');
        }
    },

    /**
     * Show before/after comparison modal
     */
    showComparison() {
        if (!this.state.simulationResults) {
            MapManager.showToast('Run simulation first');
            return;
        }

        const modal = document.getElementById('compare-modal');
        modal.classList.add('active');

        // This would ideally show side-by-side heatmaps
        // For now, show a message about using the layer toggle
        MapManager.showToast('Use the "Projected AQI" layer toggle to compare');
    },

    /**
     * Generate and download PDF report
     */
    async generateReport() {
        const trees = MapManager.placedTrees;

        if (trees.length === 0) {
            MapManager.showToast('Please place some trees first');
            return;
        }

        // Run simulation if not already done
        if (!this.state.simulationResults) {
            await this.runSimulation();
            document.getElementById('simulation-modal').classList.remove('active');
        }

        MapManager.showToast('Generating PDF report...');

        try {
            // Capture map screenshot
            let mapScreenshot = null;
            try {
                const mapElement = document.getElementById('map');
                const canvas = await html2canvas(mapElement, {
                    useCORS: true,
                    allowTaint: true
                });
                mapScreenshot = canvas.toDataURL('image/png');
            } catch (e) {
                console.warn('Could not capture map screenshot:', e);
            }

            // Generate report
            await ReportGenerator.downloadReport({
                city: this.state.city,
                trees: trees.map(t => ({
                    id: t.id,
                    lat: t.lat,
                    lng: t.lng,
                    speciesId: t.speciesId
                })),
                simulationResults: this.state.simulationResults,
                stationData: this.state.stationData,
                windData: this.state.windData,
                mapScreenshot
            });

            MapManager.showToast('Report downloaded successfully');

        } catch (error) {
            console.error('Report generation error:', error);
            MapManager.showToast('Failed to generate report');
        }
    },

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
        this.state.isLoading = show;
    },

    /**
     * Export tree placements as GeoJSON
     */
    exportGeoJSON() {
        const geojson = MapManager.exportGeoJSON();
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tree_placements_${this.state.city}_${new Date().toISOString().split('T')[0]}.geojson`;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for global access
window.App = App;
