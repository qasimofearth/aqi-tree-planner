/**
 * Map Module
 * Handles Leaflet map initialization, tree placement, and visualizations
 */

const MapManager = {
    // Map instance
    map: null,

    // Layer groups
    layers: {
        trees: null,
        aqiHeatmap: null,
        projectedHeatmap: null,
        windArrows: null,
        coverageZones: null,
        stations: null,
        impactZones: null
    },

    // City configurations
    cities: {
        lahore: {
            center: [31.5204, 74.3587],
            zoom: 12,
            bounds: [[31.35, 74.15], [31.65, 74.55]]
        },
        delhi: {
            center: [28.6139, 77.2090],
            zoom: 11,
            bounds: [[28.40, 76.85], [28.85, 77.45]]
        }
    },

    // Current state
    currentCity: 'lahore',
    selectedSpecies: null,
    placedTrees: [],
    treeIdCounter: 0,

    // Tree icon templates
    treeIcons: {},

    /**
     * Initialize the map
     */
    init() {
        // Create map instance
        this.map = L.map('map', {
            zoomControl: false,
            attributionControl: true
        });

        // Add zoom control to top-left
        L.control.zoom({ position: 'topleft' }).addTo(this.map);

        // Add base tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Initialize layer groups
        this.layers.trees = L.layerGroup().addTo(this.map);
        this.layers.aqiHeatmap = L.layerGroup().addTo(this.map);
        this.layers.projectedHeatmap = L.layerGroup();
        this.layers.windArrows = L.layerGroup().addTo(this.map);
        this.layers.coverageZones = L.layerGroup();
        this.layers.stations = L.layerGroup().addTo(this.map);
        this.layers.impactZones = L.layerGroup();

        // Create tree icons
        this.createTreeIcons();

        // Set initial view
        this.setCity('lahore');

        // Add click handler for tree placement
        this.map.on('click', (e) => this.handleMapClick(e));

        // Bind control buttons
        this.bindControls();

        return this;
    },

    /**
     * Create custom icons for each tree species
     */
    createTreeIcons() {
        const species = TreeSpecies.getAll();

        species.forEach(sp => {
            this.treeIcons[sp.id] = L.divIcon({
                className: 'tree-marker-icon',
                html: `<div class="tree-marker" style="border-color: ${sp.color}; width: 32px; height: 32px;">
                         <i class="fas fa-tree" style="color: ${sp.color}; font-size: 16px;"></i>
                       </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32]
            });
        });
    },

    /**
     * Switch to a different city
     */
    setCity(city) {
        const config = this.cities[city];
        if (!config) return;

        this.currentCity = city;
        this.map.setView(config.center, config.zoom);

        // Dispatch event for app controller
        const event = new CustomEvent('cityChanged', { detail: { city } });
        document.dispatchEvent(event);
    },

    /**
     * Handle map click for tree placement
     */
    handleMapClick(e) {
        if (!this.selectedSpecies) {
            // Show hint to select species first
            this.showToast('Please select a tree species first');
            return;
        }

        const { lat, lng } = e.latlng;
        this.placeTree(lat, lng, this.selectedSpecies);
    },

    /**
     * Place a tree on the map
     */
    placeTree(lat, lng, speciesId) {
        const species = TreeSpecies.getById(speciesId);
        if (!species) return;

        const treeId = ++this.treeIdCounter;
        const tree = {
            id: treeId,
            lat,
            lng,
            speciesId,
            timestamp: new Date().toISOString()
        };

        // Create marker
        const marker = L.marker([lat, lng], {
            icon: this.treeIcons[speciesId],
            draggable: true
        });

        // Add popup
        const popupContent = this.createTreePopup(tree, species);
        marker.bindPopup(popupContent);

        // Handle drag
        marker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            tree.lat = newPos.lat;
            tree.lng = newPos.lng;
            this.updateStats();
        });

        // Store reference
        tree.marker = marker;

        // Add to layer and array
        marker.addTo(this.layers.trees);
        this.placedTrees.push(tree);

        // Update statistics
        this.updateStats();

        // Dispatch event
        const event = new CustomEvent('treePlaced', { detail: tree });
        document.dispatchEvent(event);

        return tree;
    },

    /**
     * Create popup content for a tree
     */
    createTreePopup(tree, species) {
        return `
            <div class="tree-popup">
                <h4>${species.icon} ${species.commonName}</h4>
                <p><em>${species.scientificName}</em></p>
                <p><strong>PM2.5 Absorption:</strong> ${species.pm25Absorption} μg/m³/day</p>
                <p><strong>Canopy:</strong> ${species.canopyDiameter}m diameter</p>
                <p><strong>Pollution Tolerance:</strong> ${species.pollutionTolerance}</p>
                <button class="delete-btn" onclick="MapManager.removeTree(${tree.id})">
                    <i class="fas fa-trash"></i> Remove Tree
                </button>
            </div>
        `;
    },

    /**
     * Remove a tree from the map
     */
    removeTree(treeId) {
        const index = this.placedTrees.findIndex(t => t.id === treeId);
        if (index === -1) return;

        const tree = this.placedTrees[index];

        // Remove marker
        this.layers.trees.removeLayer(tree.marker);

        // Remove from array
        this.placedTrees.splice(index, 1);

        // Update stats
        this.updateStats();

        // Close any open popup
        this.map.closePopup();

        // Dispatch event
        const event = new CustomEvent('treeRemoved', { detail: { treeId } });
        document.dispatchEvent(event);
    },

    /**
     * Clear all trees
     */
    clearAllTrees() {
        this.layers.trees.clearLayers();
        this.placedTrees = [];
        this.updateStats();

        const event = new CustomEvent('treesCleared');
        document.dispatchEvent(event);
    },

    /**
     * Undo last tree placement
     */
    undoLastTree() {
        if (this.placedTrees.length === 0) return;

        const lastTree = this.placedTrees[this.placedTrees.length - 1];
        this.removeTree(lastTree.id);
    },

    /**
     * Update AQI heatmap layer
     */
    updateAqiHeatmap(stationData) {
        this.layers.aqiHeatmap.clearLayers();

        if (!stationData || stationData.length === 0) return;

        // Generate heatmap points
        const heatData = AqiApi.generateHeatmapData(this.currentCity, stationData, 0.3);

        // Create heatmap layer
        const heat = L.heatLayer(heatData, {
            radius: 35,
            blur: 25,
            maxZoom: 15,
            max: 1.0,
            gradient: {
                0.0: '#00e400',   // Good
                0.2: '#ffff00',   // Moderate
                0.4: '#ff7e00',   // Unhealthy for Sensitive
                0.6: '#ff0000',   // Unhealthy
                0.8: '#8f3f97',   // Very Unhealthy
                1.0: '#7e0023'    // Hazardous
            }
        });

        this.layers.aqiHeatmap.addLayer(heat);
    },

    /**
     * Update projected AQI heatmap (after simulation)
     */
    updateProjectedHeatmap(projectedField) {
        this.layers.projectedHeatmap.clearLayers();

        if (!projectedField) return;

        const heatData = Simulation.generateProjectedHeatmap(projectedField);

        const heat = L.heatLayer(heatData, {
            radius: 35,
            blur: 25,
            maxZoom: 15,
            max: 1.0,
            gradient: {
                0.0: '#00e400',
                0.2: '#ffff00',
                0.4: '#ff7e00',
                0.6: '#ff0000',
                0.8: '#8f3f97',
                1.0: '#7e0023'
            }
        });

        this.layers.projectedHeatmap.addLayer(heat);
    },

    /**
     * Add AQI monitoring station markers
     */
    addStationMarkers(stationData) {
        this.layers.stations.clearLayers();

        stationData.forEach(station => {
            const category = AqiApi.getAQICategory(station.aqi || station.pm25);

            const icon = L.divIcon({
                className: 'aqi-station-icon',
                html: `<div class="aqi-station-marker" style="background: ${category.color}; color: ${category.textColor}">
                         ${station.pm25 || station.aqi}
                       </div>`,
                iconSize: [50, 24],
                iconAnchor: [25, 12]
            });

            const marker = L.marker([station.lat, station.lng], { icon });

            marker.bindPopup(`
                <strong>${station.name}</strong><br>
                PM2.5: ${station.pm25} μg/m³<br>
                PM10: ${station.pm10 || 'N/A'} μg/m³<br>
                Status: ${category.label}<br>
                <small>${station.isReal ? 'Live data' : 'Estimated'}</small>
            `);

            this.layers.stations.addLayer(marker);
        });
    },

    /**
     * Update wind arrows visualization
     */
    updateWindArrows(windData) {
        this.layers.windArrows.clearLayers();

        const bounds = this.cities[this.currentCity].bounds;
        const arrows = WindModel.generateWindArrows(
            {
                north: bounds[1][0],
                south: bounds[0][0],
                east: bounds[1][1],
                west: bounds[0][1]
            },
            windData,
            0.03
        );

        arrows.forEach(arrow => {
            const icon = L.divIcon({
                className: 'wind-arrow-icon',
                html: `<div style="transform: rotate(${arrow.direction}deg); color: #1976d2; opacity: 0.4;">
                         <i class="fas fa-location-arrow" style="font-size: 12px;"></i>
                       </div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            L.marker([arrow.lat, arrow.lng], { icon, interactive: false })
                .addTo(this.layers.windArrows);
        });
    },

    /**
     * Show tree coverage zones
     */
    showCoverageZones(show = true) {
        this.layers.coverageZones.clearLayers();

        if (!show) {
            this.map.removeLayer(this.layers.coverageZones);
            return;
        }

        this.placedTrees.forEach(tree => {
            const species = TreeSpecies.getById(tree.speciesId);
            if (!species) return;

            // Canopy circle
            const canopyCircle = L.circle([tree.lat, tree.lng], {
                radius: species.canopyDiameter / 2,
                color: species.color,
                fillColor: species.color,
                fillOpacity: 0.2,
                weight: 1
            });

            this.layers.coverageZones.addLayer(canopyCircle);
        });

        this.layers.coverageZones.addTo(this.map);
    },

    /**
     * Show impact zones after simulation
     */
    showImpactZones(impactZones) {
        this.layers.impactZones.clearLayers();

        impactZones.forEach(zone => {
            const species = TreeSpecies.getById(zone.speciesId);

            // Draw impact zone polygon
            if (zone.impactZone) {
                const polygon = L.polygon(
                    zone.impactZone.map(p => [p.lat, p.lng]),
                    {
                        color: species?.color || '#2d5a27',
                        fillColor: species?.color || '#2d5a27',
                        fillOpacity: 0.15,
                        weight: 1,
                        dashArray: '5, 5'
                    }
                );

                this.layers.impactZones.addLayer(polygon);
            }
        });

        this.layers.impactZones.addTo(this.map);
    },

    /**
     * Toggle layer visibility
     */
    toggleLayer(layerName, visible) {
        const layer = this.layers[layerName];
        if (!layer) return;

        if (visible) {
            layer.addTo(this.map);
        } else {
            this.map.removeLayer(layer);
        }
    },

    /**
     * Fit map to show all trees
     */
    fitToTrees() {
        if (this.placedTrees.length === 0) {
            this.setCity(this.currentCity);
            return;
        }

        const bounds = L.latLngBounds(
            this.placedTrees.map(t => [t.lat, t.lng])
        );

        this.map.fitBounds(bounds, { padding: [50, 50] });
    },

    /**
     * Set selected species for placement
     */
    setSelectedSpecies(speciesId) {
        this.selectedSpecies = speciesId;

        // Update cursor
        if (speciesId) {
            this.map.getContainer().style.cursor = 'crosshair';
        } else {
            this.map.getContainer().style.cursor = '';
        }
    },

    /**
     * Bind UI control buttons
     */
    bindControls() {
        document.getElementById('btn-clear-trees')?.addEventListener('click', () => {
            if (this.placedTrees.length > 0 && confirm('Clear all placed trees?')) {
                this.clearAllTrees();
            }
        });

        document.getElementById('btn-undo')?.addEventListener('click', () => {
            this.undoLastTree();
        });

        document.getElementById('btn-zoom-fit')?.addEventListener('click', () => {
            this.fitToTrees();
        });
    },

    /**
     * Update statistics display
     */
    updateStats() {
        const event = new CustomEvent('statsUpdate', {
            detail: {
                trees: this.placedTrees,
                city: this.currentCity
            }
        });
        document.dispatchEvent(event);
    },

    /**
     * Show a toast notification
     */
    showToast(message, duration = 3000) {
        // Simple toast implementation
        let toast = document.getElementById('toast-notification');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
        }, duration);
    },

    /**
     * Get current map state for report
     */
    getMapState() {
        return {
            city: this.currentCity,
            center: this.map.getCenter(),
            zoom: this.map.getZoom(),
            trees: this.placedTrees.map(t => ({
                id: t.id,
                lat: t.lat,
                lng: t.lng,
                speciesId: t.speciesId
            }))
        };
    },

    /**
     * Export tree locations as GeoJSON
     */
    exportGeoJSON() {
        const features = this.placedTrees.map(tree => {
            const species = TreeSpecies.getById(tree.speciesId);
            return {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [tree.lng, tree.lat]
                },
                properties: {
                    id: tree.id,
                    speciesId: tree.speciesId,
                    speciesName: species?.commonName,
                    scientificName: species?.scientificName,
                    pm25Absorption: species?.pm25Absorption,
                    canopyDiameter: species?.canopyDiameter
                }
            };
        });

        return {
            type: 'FeatureCollection',
            features
        };
    }
};

// Export for use in other modules
window.MapManager = MapManager;
