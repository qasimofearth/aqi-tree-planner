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
        isLoading: false,
        isDrawingLine: false,
        linePoints: [],
        treeSpacing: 15 // meters between trees on line
    },

    // Chart instance
    speciesChart: null,

    // Line drawing layer
    drawingLayer: null,
    previewLine: null,

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

        // Line drawing
        document.getElementById('btn-draw-line')?.addEventListener('click', () => this.toggleLineDrawing());
        document.getElementById('btn-cancel-draw')?.addEventListener('click', () => this.cancelLineDrawing());

        // Save/Load
        document.getElementById('btn-save-project')?.addEventListener('click', () => this.saveProject());
        document.getElementById('btn-load-project')?.addEventListener('click', () => {
            document.getElementById('file-input')?.click();
        });
        document.getElementById('file-input')?.addEventListener('change', (e) => this.loadProject(e));

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

        // Update timeline
        this.updateTimeline(speciesCount);

        // Update health impact
        this.updateHealthImpact(totalReduction);
    },

    /**
     * Update growth timeline display
     */
    updateTimeline(speciesCount) {
        const treeData = Object.entries(speciesCount).map(([speciesId, count]) => ({
            speciesId,
            count
        }));

        const timeline = TreeSpecies.calculateTimelineImpact(treeData, this.state.season);

        // Update Year 1
        document.getElementById('timeline-pm25-1').textContent = timeline.year1.pm25Reduction;
        document.getElementById('timeline-coverage-1').textContent = `${timeline.year1.coverage} km²`;

        // Update Year 5
        document.getElementById('timeline-pm25-5').textContent = timeline.year5.pm25Reduction;
        document.getElementById('timeline-coverage-5').textContent = `${timeline.year5.coverage} km²`;

        // Update Year 10
        document.getElementById('timeline-pm25-10').textContent = timeline.year10.pm25Reduction;
        document.getElementById('timeline-coverage-10').textContent = `${timeline.year10.coverage} km²`;

        // Update Year 20
        document.getElementById('timeline-pm25-20').textContent = timeline.year20.pm25Reduction;
        document.getElementById('timeline-coverage-20').textContent = `${timeline.year20.coverage} km²`;
    },

    /**
     * Update health impact display
     */
    updateHealthImpact(pm25Reduction) {
        // Estimate affected population based on coverage
        const trees = MapManager.placedTrees;
        let totalCoverage = 0;
        trees.forEach(tree => {
            const species = TreeSpecies.getById(tree.speciesId);
            if (species) {
                totalCoverage += species.canopyArea;
            }
        });

        // Population density (per km²)
        const density = this.state.city === 'lahore' ? 6300 : 11320;
        const coverageKm2 = totalCoverage / 1000000;
        const population = Math.round(coverageKm2 * density * 2); // x2 for surrounding area

        const health = TreeSpecies.calculateHealthImpact(pm25Reduction, population);

        document.getElementById('health-lives').textContent = health.livesSavedPerYear;
        document.getElementById('health-hosp').textContent = health.respiratoryHospPrevented;
        document.getElementById('health-economic').textContent = `$${(health.economicValueUSD / 1000000).toFixed(1)}M`;
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
    },

    /**
     * Toggle line drawing mode
     */
    toggleLineDrawing() {
        if (!this.state.selectedSpecies) {
            MapManager.showToast('Please select a tree species first');
            return;
        }

        this.state.isDrawingLine = !this.state.isDrawingLine;

        const btn = document.getElementById('btn-draw-line');
        const indicator = document.getElementById('drawing-mode-indicator');

        if (this.state.isDrawingLine) {
            btn.classList.add('active');
            indicator.style.display = 'flex';
            this.state.linePoints = [];

            // Initialize drawing layer
            if (!this.drawingLayer) {
                this.drawingLayer = L.layerGroup().addTo(MapManager.map);
            }

            // Change cursor
            MapManager.map.getContainer().style.cursor = 'crosshair';

            // Add click handler for line drawing
            MapManager.map.on('click', this.handleLineClick.bind(this));
            MapManager.map.on('dblclick', this.finishLineDrawing.bind(this));

            MapManager.showToast('Click to add points. Double-click to finish.');
        } else {
            this.cancelLineDrawing();
        }
    },

    /**
     * Handle click during line drawing
     */
    handleLineClick(e) {
        if (!this.state.isDrawingLine) return;

        const point = [e.latlng.lat, e.latlng.lng];
        this.state.linePoints.push(point);

        // Add marker for the point
        const marker = L.circleMarker(e.latlng, {
            radius: 6,
            color: '#1976d2',
            fillColor: '#1976d2',
            fillOpacity: 1
        }).addTo(this.drawingLayer);

        // Update preview line
        if (this.state.linePoints.length > 1) {
            if (this.previewLine) {
                this.drawingLayer.removeLayer(this.previewLine);
            }
            this.previewLine = L.polyline(this.state.linePoints, {
                color: '#1976d2',
                weight: 3,
                dashArray: '10, 5'
            }).addTo(this.drawingLayer);
        }
    },

    /**
     * Finish line drawing and place trees
     */
    finishLineDrawing(e) {
        if (!this.state.isDrawingLine || this.state.linePoints.length < 2) {
            this.cancelLineDrawing();
            return;
        }

        // Prevent the double-click from being treated as a point
        L.DomEvent.stopPropagation(e);

        // Calculate trees along the line
        const trees = this.calculateTreesAlongLine(this.state.linePoints, this.state.treeSpacing);

        // Place the trees
        trees.forEach(point => {
            MapManager.placeTree(point.lat, point.lng, this.state.selectedSpecies);
        });

        MapManager.showToast(`Placed ${trees.length} trees along the road`);

        // Clean up
        this.cancelLineDrawing();
    },

    /**
     * Calculate tree positions along a line
     */
    calculateTreesAlongLine(points, spacing) {
        const trees = [];
        const metersPerDegLat = 111320;

        for (let i = 0; i < points.length - 1; i++) {
            const start = points[i];
            const end = points[i + 1];

            // Calculate segment length in meters
            const dLat = (end[0] - start[0]) * metersPerDegLat;
            const dLng = (end[1] - start[1]) * metersPerDegLat * Math.cos(start[0] * Math.PI / 180);
            const segmentLength = Math.sqrt(dLat * dLat + dLng * dLng);

            // Number of trees on this segment
            const numTrees = Math.floor(segmentLength / spacing);

            for (let j = 0; j <= numTrees; j++) {
                const ratio = j / Math.max(numTrees, 1);
                trees.push({
                    lat: start[0] + (end[0] - start[0]) * ratio,
                    lng: start[1] + (end[1] - start[1]) * ratio
                });
            }
        }

        return trees;
    },

    /**
     * Cancel line drawing mode
     */
    cancelLineDrawing() {
        this.state.isDrawingLine = false;
        this.state.linePoints = [];

        const btn = document.getElementById('btn-draw-line');
        const indicator = document.getElementById('drawing-mode-indicator');

        btn?.classList.remove('active');
        if (indicator) indicator.style.display = 'none';

        // Clear drawing layer
        if (this.drawingLayer) {
            this.drawingLayer.clearLayers();
        }

        // Reset cursor
        MapManager.map.getContainer().style.cursor = '';

        // Remove event handlers
        MapManager.map.off('click', this.handleLineClick.bind(this));
        MapManager.map.off('dblclick', this.finishLineDrawing.bind(this));
    },

    /**
     * Save project to JSON file
     */
    saveProject() {
        const trees = MapManager.placedTrees;

        if (trees.length === 0) {
            MapManager.showToast('No trees to save');
            return;
        }

        const project = {
            version: '1.0',
            savedAt: new Date().toISOString(),
            city: this.state.city,
            season: this.state.season,
            trees: trees.map(t => ({
                lat: t.lat,
                lng: t.lng,
                speciesId: t.speciesId
            }))
        };

        const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aqi_tree_project_${this.state.city}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        MapManager.showToast('Project saved successfully');
    },

    /**
     * Load project from JSON file
     */
    loadProject(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target.result);

                if (!project.trees || !Array.isArray(project.trees)) {
                    throw new Error('Invalid project file');
                }

                // Confirm if current trees exist
                if (MapManager.placedTrees.length > 0) {
                    if (!confirm('This will replace current trees. Continue?')) {
                        return;
                    }
                }

                // Clear existing trees
                MapManager.clearAllTrees();

                // Switch city if needed
                if (project.city && project.city !== this.state.city) {
                    this.switchCity(project.city);
                }

                // Set season
                if (project.season) {
                    this.state.season = project.season;
                    document.getElementById('season-select').value = project.season;
                }

                // Place trees
                project.trees.forEach(t => {
                    MapManager.placeTree(t.lat, t.lng, t.speciesId);
                });

                MapManager.showToast(`Loaded ${project.trees.length} trees`);
                MapManager.fitToTrees();

            } catch (error) {
                console.error('Error loading project:', error);
                MapManager.showToast('Failed to load project file');
            }
        };

        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for global access
window.App = App;
