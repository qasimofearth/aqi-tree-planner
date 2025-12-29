/**
 * PDF Report Generator Module
 * Creates professional planning documents for city officials
 */

const ReportGenerator = {
    // jsPDF instance
    doc: null,

    // Page dimensions
    pageWidth: 210,  // A4 width in mm
    pageHeight: 297, // A4 height in mm
    margin: 20,

    // Colors
    colors: {
        primary: [45, 90, 39],      // Dark green
        secondary: [25, 118, 210],  // Blue
        text: [33, 33, 33],
        textLight: [117, 117, 117],
        success: [56, 142, 60],
        danger: [211, 47, 47],
        headerBg: [26, 53, 24]
    },

    /**
     * Generate complete PDF report
     * @param {Object} data - Report data
     * @returns {Promise<Blob>} PDF blob
     */
    async generateReport(data) {
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF('p', 'mm', 'a4');

        const {
            city,
            trees,
            simulationResults,
            stationData,
            windData,
            mapScreenshot
        } = data;

        // Page 1: Cover & Executive Summary
        await this.addCoverPage(city, simulationResults);

        // Page 2: Current AQI Assessment
        this.doc.addPage();
        this.addAqiAssessmentPage(stationData, city);

        // Page 3: Tree Placement Map
        this.doc.addPage();
        await this.addMapPage(mapScreenshot, trees);

        // Page 4: Species Analysis
        this.doc.addPage();
        this.addSpeciesAnalysisPage(trees, simulationResults);

        // Page 5: Impact Projections
        this.doc.addPage();
        this.addImpactProjectionsPage(simulationResults);

        // Page 6: Implementation & Budget
        this.doc.addPage();
        this.addImplementationPage(simulationResults, city);

        // Add page numbers
        this.addPageNumbers();

        // Return as blob
        return this.doc.output('blob');
    },

    /**
     * Add cover page with executive summary
     */
    async addCoverPage(city, results) {
        const doc = this.doc;

        // Header background
        doc.setFillColor(...this.colors.headerBg);
        doc.rect(0, 0, this.pageWidth, 80, 'F');

        // Logo/Icon area
        doc.setFontSize(40);
        doc.setTextColor(0, 228, 0);
        doc.text('🌳', 95, 35);

        // Title
        doc.setFontSize(28);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('Urban Tree Planning Report', this.pageWidth / 2, 55, { align: 'center' });

        // City name
        doc.setFontSize(18);
        doc.setFont('helvetica', 'normal');
        const cityName = city === 'lahore' ? 'Lahore, Pakistan' : 'Delhi, India';
        doc.text(`Strategic Air Quality Improvement for ${cityName}`, this.pageWidth / 2, 68, { align: 'center' });

        // Date
        doc.setFontSize(12);
        doc.setTextColor(...this.colors.textLight);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, this.margin, 95);

        // Executive Summary
        let y = 110;
        doc.setFontSize(16);
        doc.setTextColor(...this.colors.primary);
        doc.setFont('helvetica', 'bold');
        doc.text('Executive Summary', this.margin, y);

        y += 10;
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.text);
        doc.setFont('helvetica', 'normal');

        if (results && results.summary) {
            const summary = results.summary;

            // Key metrics boxes
            const boxWidth = 40;
            const boxHeight = 35;
            const startX = this.margin;

            // Trees Planted
            this.drawMetricBox(startX, y, boxWidth, boxHeight, summary.trees.total.toString(), 'Trees Planned', this.colors.primary);

            // PM2.5 Reduction
            this.drawMetricBox(startX + boxWidth + 5, y, boxWidth, boxHeight, `${summary.reduction.percentage}%`, 'PM2.5 Reduction', this.colors.success);

            // Coverage Area
            this.drawMetricBox(startX + (boxWidth + 5) * 2, y, boxWidth, boxHeight, `${summary.coverage.areaSqKm}`, 'Coverage (km²)', this.colors.secondary);

            // CO2 Sequestered
            this.drawMetricBox(startX + (boxWidth + 5) * 3, y, boxWidth, boxHeight, `${summary.environmental.co2Tonnes}`, 'CO₂ (t/yr)', this.colors.primary);

            y += boxHeight + 15;

            // Summary text
            const summaryText = `This report presents a strategic urban forestry plan for ${cityName}, designed to improve air quality through the strategic placement of ${summary.trees.total} native trees. The implementation is projected to reduce PM2.5 concentrations by ${summary.reduction.absolute} μg/m³ (${summary.reduction.percentage}% reduction), benefiting approximately ${summary.coverage.populationBenefited.toLocaleString()} residents within the coverage area of ${summary.coverage.areaSqKm} km².`;

            const lines = doc.splitTextToSize(summaryText, this.pageWidth - 2 * this.margin);
            doc.text(lines, this.margin, y);

            y += lines.length * 6 + 10;

            // Key Recommendations
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...this.colors.primary);
            doc.text('Key Recommendations', this.margin, y);

            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...this.colors.text);

            const recommendations = [
                'Prioritize Neem and Deodar Cedar for maximum PM2.5 absorption',
                'Plant trees in clusters of 3-5 for enhanced pollutant capture',
                'Focus on high-traffic corridors and pollution hotspots',
                'Implement phased planting during monsoon season for better survival',
                'Establish maintenance schedule for first 3 years post-planting'
            ];

            recommendations.forEach((rec, i) => {
                doc.text(`${i + 1}. ${rec}`, this.margin + 5, y + (i * 6));
            });
        }

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(...this.colors.textLight);
        doc.text('Generated by AQI Tree Planner | Scientific data from i-Tree Eco & AQICN.org', this.pageWidth / 2, 285, { align: 'center' });
    },

    /**
     * Draw a metric box
     */
    drawMetricBox(x, y, width, height, value, label, color) {
        const doc = this.doc;

        // Background
        doc.setFillColor(color[0], color[1], color[2], 0.1);
        doc.roundedRect(x, y, width, height, 3, 3, 'F');

        // Border
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, width, height, 3, 3, 'S');

        // Value
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...color);
        doc.text(value, x + width / 2, y + 15, { align: 'center' });

        // Label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.colors.textLight);
        const lines = doc.splitTextToSize(label, width - 4);
        doc.text(lines, x + width / 2, y + 25, { align: 'center' });
    },

    /**
     * Add current AQI assessment page
     */
    addAqiAssessmentPage(stationData, city) {
        const doc = this.doc;

        // Header
        this.addPageHeader('Current Air Quality Assessment');

        let y = 45;

        // Introduction
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.text);
        const introText = `Analysis of current air quality conditions in ${city === 'lahore' ? 'Lahore' : 'Delhi'} based on real-time monitoring data from government and international monitoring stations.`;
        const lines = doc.splitTextToSize(introText, this.pageWidth - 2 * this.margin);
        doc.text(lines, this.margin, y);

        y += 20;

        // Station data table
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Monitoring Station Readings', this.margin, y);

        y += 8;

        // Table headers
        doc.setFillColor(240, 240, 240);
        doc.rect(this.margin, y, this.pageWidth - 2 * this.margin, 8, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.text);

        const columns = ['Station', 'PM2.5', 'PM10', 'AQI', 'Status'];
        const colWidths = [55, 25, 25, 25, 40];
        let x = this.margin + 2;

        columns.forEach((col, i) => {
            doc.text(col, x, y + 5.5);
            x += colWidths[i];
        });

        y += 10;

        // Table rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        if (stationData && stationData.length > 0) {
            stationData.slice(0, 10).forEach((station, i) => {
                const category = AqiApi.getAQICategory(station.aqi || station.pm25);

                // Alternating row background
                if (i % 2 === 0) {
                    doc.setFillColor(250, 250, 250);
                    doc.rect(this.margin, y, this.pageWidth - 2 * this.margin, 7, 'F');
                }

                x = this.margin + 2;
                doc.setTextColor(...this.colors.text);
                doc.text(station.name.substring(0, 25), x, y + 5);

                x += colWidths[0];
                doc.text(String(station.pm25 || '--'), x, y + 5);

                x += colWidths[1];
                doc.text(String(station.pm10 || '--'), x, y + 5);

                x += colWidths[2];
                doc.text(String(station.aqi || station.pm25), x, y + 5);

                x += colWidths[3];
                // Status with color
                const rgb = this.hexToRgb(category.color);
                if (rgb) {
                    doc.setFillColor(rgb.r, rgb.g, rgb.b);
                    doc.roundedRect(x, y + 1, 35, 5, 1, 1, 'F');
                }
                doc.setTextColor(0, 0, 0);
                doc.text(category.label.substring(0, 18), x + 2, y + 5);

                y += 7;
            });
        }

        y += 15;

        // AQI Scale Legend
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('AQI Scale Reference', this.margin, y);

        y += 10;

        const aqiScale = [
            { range: '0-50', label: 'Good', color: '#00e400', desc: 'Minimal health risk' },
            { range: '51-100', label: 'Moderate', color: '#ffff00', desc: 'Acceptable for most' },
            { range: '101-150', label: 'Unhealthy (Sensitive)', color: '#ff7e00', desc: 'Risk for sensitive groups' },
            { range: '151-200', label: 'Unhealthy', color: '#ff0000', desc: 'Health effects for all' },
            { range: '201-300', label: 'Very Unhealthy', color: '#8f3f97', desc: 'Serious health effects' },
            { range: '301+', label: 'Hazardous', color: '#7e0023', desc: 'Emergency conditions' }
        ];

        aqiScale.forEach((item, i) => {
            const rgb = this.hexToRgb(item.color);
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.rect(this.margin, y + i * 8, 10, 6, 'F');

            doc.setFontSize(9);
            doc.setTextColor(...this.colors.text);
            doc.text(`${item.range}: ${item.label}`, this.margin + 15, y + i * 8 + 4.5);
            doc.setTextColor(...this.colors.textLight);
            doc.text(`- ${item.desc}`, this.margin + 80, y + i * 8 + 4.5);
        });
    },

    /**
     * Add map visualization page
     */
    async addMapPage(mapScreenshot, trees) {
        const doc = this.doc;

        this.addPageHeader('Tree Placement Map');

        let y = 45;

        // Map image placeholder
        const mapHeight = 120;

        if (mapScreenshot) {
            try {
                doc.addImage(mapScreenshot, 'PNG', this.margin, y, this.pageWidth - 2 * this.margin, mapHeight);
            } catch (e) {
                // Fallback: draw placeholder
                doc.setFillColor(230, 230, 230);
                doc.rect(this.margin, y, this.pageWidth - 2 * this.margin, mapHeight, 'F');
                doc.setTextColor(...this.colors.textLight);
                doc.setFontSize(14);
                doc.text('Map visualization', this.pageWidth / 2, y + mapHeight / 2, { align: 'center' });
            }
        } else {
            doc.setFillColor(230, 230, 230);
            doc.rect(this.margin, y, this.pageWidth - 2 * this.margin, mapHeight, 'F');
            doc.setTextColor(...this.colors.textLight);
            doc.setFontSize(12);
            doc.text('[Tree placement map - run simulation to capture]', this.pageWidth / 2, y + mapHeight / 2, { align: 'center' });
        }

        y += mapHeight + 15;

        // Legend
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Map Legend', this.margin, y);

        y += 8;

        const species = TreeSpecies.getAll();
        species.forEach((sp, i) => {
            const count = trees.filter(t => t.speciesId === sp.id).length;
            const rgb = this.hexToRgb(sp.color);

            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.circle(this.margin + 5, y + i * 7, 3, 'F');

            doc.setFontSize(9);
            doc.setTextColor(...this.colors.text);
            doc.text(`${sp.commonName} (${sp.scientificName})`, this.margin + 12, y + i * 7 + 1);

            doc.setTextColor(...this.colors.textLight);
            doc.text(`- ${count} trees`, this.margin + 100, y + i * 7 + 1);
        });

        y += species.length * 7 + 15;

        // Coordinate table (first 10 trees)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Sample Tree Coordinates (for GIS import)', this.margin, y);

        y += 8;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...this.colors.textLight);
        doc.text('ID', this.margin, y);
        doc.text('Latitude', this.margin + 15, y);
        doc.text('Longitude', this.margin + 45, y);
        doc.text('Species', this.margin + 75, y);

        y += 5;
        doc.setTextColor(...this.colors.text);

        trees.slice(0, 15).forEach((tree, i) => {
            const sp = TreeSpecies.getById(tree.speciesId);
            doc.text(String(tree.id), this.margin, y + i * 5);
            doc.text(tree.lat.toFixed(6), this.margin + 15, y + i * 5);
            doc.text(tree.lng.toFixed(6), this.margin + 45, y + i * 5);
            doc.text(sp?.commonName || tree.speciesId, this.margin + 75, y + i * 5);
        });
    },

    /**
     * Add species analysis page
     */
    addSpeciesAnalysisPage(trees, results) {
        const doc = this.doc;

        this.addPageHeader('Species Analysis & Selection');

        let y = 45;

        // Introduction
        doc.setFontSize(11);
        doc.setTextColor(...this.colors.text);
        doc.text('Analysis of selected tree species based on air quality improvement potential,', this.margin, y);
        doc.text('environmental tolerance, and suitability for local conditions.', this.margin, y + 5);

        y += 20;

        const speciesData = TreeSpecies.getAll();

        speciesData.forEach((sp, i) => {
            const count = trees.filter(t => t.speciesId === sp.id).length;

            // Species header
            doc.setFillColor(...this.colors.primary);
            doc.rect(this.margin, y, this.pageWidth - 2 * this.margin, 8, 'F');

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text(`${sp.icon} ${sp.commonName} (${sp.scientificName})`, this.margin + 3, y + 5.5);
            doc.text(`${count} trees`, this.pageWidth - this.margin - 20, y + 5.5);

            y += 12;

            // Species details in two columns
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...this.colors.text);

            const leftCol = [
                `PM2.5 Absorption: ${sp.pm25Absorption} μg/m³/day`,
                `CO₂ Sequestration: ${sp.co2Sequestration} kg/tree/year`,
                `Leaf Area Index: ${sp.leafAreaIndex}`,
                `Pollution Tolerance: ${sp.pollutionTolerance}`
            ];

            const rightCol = [
                `Canopy Diameter: ${sp.canopyDiameter}m`,
                `Mature Height: ${sp.matureHeight}m`,
                `Water Requirement: ${sp.waterRequirement}`,
                `Growth Rate: ${sp.growthRate}`
            ];

            leftCol.forEach((text, j) => {
                doc.text(text, this.margin + 5, y + j * 5);
            });

            rightCol.forEach((text, j) => {
                doc.text(text, this.margin + 90, y + j * 5);
            });

            y += 25;

            // Notes
            doc.setFontSize(8);
            doc.setTextColor(...this.colors.textLight);
            const noteLines = doc.splitTextToSize(sp.notes, this.pageWidth - 2 * this.margin - 10);
            doc.text(noteLines, this.margin + 5, y);

            y += noteLines.length * 4 + 10;

            // Check page break
            if (y > 250 && i < speciesData.length - 1) {
                doc.addPage();
                this.addPageHeader('Species Analysis & Selection (continued)');
                y = 45;
            }
        });
    },

    /**
     * Add impact projections page
     */
    addImpactProjectionsPage(results) {
        const doc = this.doc;

        this.addPageHeader('Projected Impact Analysis');

        let y = 45;

        if (!results || !results.summary) {
            doc.setFontSize(11);
            doc.setTextColor(...this.colors.textLight);
            doc.text('Run simulation to generate impact projections.', this.margin, y);
            return;
        }

        const summary = results.summary;

        // Before/After comparison
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Air Quality Improvement Projection', this.margin, y);

        y += 15;

        // Comparison boxes
        const boxWidth = 70;
        const boxHeight = 45;

        // Before
        doc.setFillColor(255, 200, 200);
        doc.roundedRect(this.margin, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.text);
        doc.text('CURRENT STATE', this.margin + boxWidth / 2, y + 10, { align: 'center' });
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.danger);
        doc.text(String(summary.baseline.avgPM25), this.margin + boxWidth / 2, y + 28, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('μg/m³ PM2.5', this.margin + boxWidth / 2, y + 36, { align: 'center' });

        // Arrow
        doc.setFontSize(20);
        doc.setTextColor(...this.colors.success);
        doc.text('→', this.margin + boxWidth + 10, y + 25);

        // After
        doc.setFillColor(200, 255, 200);
        doc.roundedRect(this.margin + boxWidth + 25, y, boxWidth, boxHeight, 3, 3, 'F');
        doc.setFontSize(10);
        doc.setTextColor(...this.colors.text);
        doc.setFont('helvetica', 'normal');
        doc.text('PROJECTED', this.margin + boxWidth + 25 + boxWidth / 2, y + 10, { align: 'center' });
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.success);
        doc.text(String(summary.projected.avgPM25), this.margin + boxWidth + 25 + boxWidth / 2, y + 28, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('μg/m³ PM2.5', this.margin + boxWidth + 25 + boxWidth / 2, y + 36, { align: 'center' });

        y += boxHeight + 15;

        // Reduction summary
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.success);
        doc.text(`${summary.reduction.percentage}% Reduction in PM2.5 Concentration`, this.margin, y);

        y += 15;

        // Detailed metrics
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Impact Metrics', this.margin, y);

        y += 10;

        const metrics = [
            ['Total Trees Planted', String(summary.trees.total)],
            ['Absolute PM2.5 Reduction', `${summary.reduction.absolute} μg/m³`],
            ['Percentage Reduction', `${summary.reduction.percentage}%`],
            ['Coverage Area', `${summary.coverage.areaSqKm} km²`],
            ['Population Benefited', summary.coverage.populationBenefited.toLocaleString()],
            ['Annual CO₂ Sequestration', `${summary.environmental.co2Tonnes} tonnes`]
        ];

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        metrics.forEach((metric, i) => {
            doc.setTextColor(...this.colors.text);
            doc.text(metric[0], this.margin + 5, y + i * 8);
            doc.setTextColor(...this.colors.primary);
            doc.setFont('helvetica', 'bold');
            doc.text(metric[1], this.margin + 100, y + i * 8);
            doc.setFont('helvetica', 'normal');
        });

        y += metrics.length * 8 + 15;

        // Health impact note
        doc.setFillColor(255, 250, 230);
        doc.rect(this.margin, y, this.pageWidth - 2 * this.margin, 25, 'F');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.text);
        doc.text('Health Impact Note', this.margin + 5, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const healthNote = `A reduction of ${summary.reduction.absolute} μg/m³ in PM2.5 can reduce respiratory hospitalizations by approximately ${Math.round(summary.reduction.percentage * 0.6)}% and cardiovascular events by ${Math.round(summary.reduction.percentage * 0.4)}% within the affected area (based on WHO epidemiological studies).`;
        const noteLines = doc.splitTextToSize(healthNote, this.pageWidth - 2 * this.margin - 10);
        doc.text(noteLines, this.margin + 5, y + 15);
    },

    /**
     * Add implementation & budget page
     */
    addImplementationPage(results, city) {
        const doc = this.doc;

        this.addPageHeader('Implementation Plan & Budget');

        let y = 45;

        const currency = city === 'lahore' ? 'PKR' : 'INR';
        const costs = results?.summary?.costs || { saplings: 0, planting: 0, maintenance: 0, total: 0 };

        // Budget breakdown
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Cost Estimate', this.margin, y);

        y += 12;

        // Cost table
        const costItems = [
            ['Item', 'Amount'],
            ['Tree Saplings', `${currency} ${costs.saplings.toLocaleString()}`],
            ['Planting Labor', `${currency} ${costs.planting.toLocaleString()}`],
            ['Annual Maintenance', `${currency} ${costs.maintenance.toLocaleString()}`],
            ['Total First Year', `${currency} ${costs.total.toLocaleString()}`]
        ];

        doc.setFontSize(10);
        costItems.forEach((row, i) => {
            if (i === 0 || i === costItems.length - 1) {
                doc.setFillColor(240, 240, 240);
                doc.rect(this.margin, y, 100, 8, 'F');
                doc.setFont('helvetica', 'bold');
            } else {
                doc.setFont('helvetica', 'normal');
            }

            doc.setTextColor(...this.colors.text);
            doc.text(row[0], this.margin + 5, y + 5.5);
            doc.text(row[1], this.margin + 70, y + 5.5);
            y += 8;
        });

        y += 15;

        // Implementation phases
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...this.colors.primary);
        doc.text('Implementation Phases', this.margin, y);

        y += 12;

        const phases = [
            {
                title: 'Phase 1: Site Preparation',
                tasks: ['Survey and mark planting locations', 'Soil testing and amendment', 'Infrastructure coordination (utilities, sidewalks)', 'Procure tree saplings from certified nurseries']
            },
            {
                title: 'Phase 2: Planting (Monsoon Season Recommended)',
                tasks: ['Install tree guards and support stakes', 'Plant trees with proper spacing', 'Apply mulch and initial irrigation', 'Document GPS coordinates for monitoring']
            },
            {
                title: 'Phase 3: Establishment Care (Years 1-3)',
                tasks: ['Weekly watering during dry periods', 'Quarterly pruning and inspection', 'Pest and disease monitoring', 'Replace any failed trees within 6 months']
            },
            {
                title: 'Phase 4: Long-term Maintenance',
                tasks: ['Annual structural pruning', 'Soil nutrition management', 'Community engagement programs', 'Air quality monitoring and reporting']
            }
        ];

        phases.forEach(phase => {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...this.colors.primary);
            doc.text(phase.title, this.margin, y);
            y += 6;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...this.colors.text);

            phase.tasks.forEach(task => {
                doc.text(`• ${task}`, this.margin + 5, y);
                y += 5;
            });

            y += 5;
        });

        // Footer note
        y = 270;
        doc.setFontSize(8);
        doc.setTextColor(...this.colors.textLight);
        doc.text('This report is generated using scientific models and may vary based on local conditions.', this.margin, y);
        doc.text('Consult with local forestry experts and environmental agencies before implementation.', this.margin, y + 4);
    },

    /**
     * Add page header
     */
    addPageHeader(title) {
        const doc = this.doc;

        doc.setFillColor(...this.colors.headerBg);
        doc.rect(0, 0, this.pageWidth, 30, 'F');

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(title, this.margin, 20);
    },

    /**
     * Add page numbers to all pages
     */
    addPageNumbers() {
        const totalPages = this.doc.internal.getNumberOfPages();

        for (let i = 1; i <= totalPages; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(9);
            this.doc.setTextColor(...this.colors.textLight);
            this.doc.text(
                `Page ${i} of ${totalPages}`,
                this.pageWidth / 2,
                this.pageHeight - 10,
                { align: 'center' }
            );
        }
    },

    /**
     * Helper: Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /**
     * Download the report
     */
    async downloadReport(data) {
        const blob = await this.generateReport(data);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AQI_Tree_Plan_${data.city}_${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// Export for use in other modules
window.ReportGenerator = ReportGenerator;
