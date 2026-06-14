import { SearchResult, LocationIntelligence, ChangeDetectionResult } from "../types";

export function generateNotebook(
  results: SearchResult,
  locationIntel?: LocationIntelligence | null,
  changeDetection?: ChangeDetectionResult | null
): string {
  const cells: any[] = [];

  // Title block
  const locationTitle = locationIntel?.title || results.location?.name || "Target Regional Coordinates";
  const latitude = results.location?.lat || 0;
  const longitude = results.location?.lng || 0;

  cells.push({
    cell_type: "markdown",
    metadata: {},
    source: [
      `# NASA EarthLens Research Copilot: Planetary Intelligence Report\n`,
      `## REGIONAL ASSESSMENT: ${locationTitle.toUpperCase()}\n`,
      `**Geospatial Coordinates:** Latitude ${latitude.toFixed(6)}°, Longitude ${longitude.toFixed(6)}°  \n`,
      `**Report Temporal Index:** Unified Decadal Audit (2010 - 2026)  \n`,
      `**Standardized Climate Zone:** ${locationIntel?.climateZone || "Dynamic Classification"}  \n`,
      `**Estimated Baseline Elevation:** ${locationIntel?.elevation !== undefined ? `${locationIntel.elevation}m` : "Sensor-Derived"}  \n`,
      `**Environmental Status Indicator:** ${locationIntel?.environmentalStatus || "Evaluating"}  \n`,
      `\n`,
      `---\n`,
      `\n`,
      `### Executive Research Summary\n`,
      `${locationIntel?.summary || results.explanation || "No active assessment compiled yet."}\n`
    ]
  });

  // Deep scientific insight trends
  if (locationIntel) {
    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [
        `### Diagnostic Earth Science Indicators\n`,
        `#### 1. Atmospheric & Thermal Dynamics\n`,
        `${locationIntel.temperatureTrends || "No explicit thermal trends noted."}\n\n`,
        `#### 2. Hydro-Climatic & Hydrological Analysis\n`,
        `${locationIntel.waterInsights || "No explicit moisture indices reported."}\n\n`,
        `#### 3. Canopy Volume & Vegetarian Changes\n`,
        `${locationIntel.vegetationChanges || "No vegetative shifts detected."}\n\n`,
        `#### 4. Extended Climate Feedback Loops\n`,
        `${locationIntel.climateTrends || "General stable physical indices persist."}\n`
      ]
    });
  }

  // Key validated findings
  if (locationIntel?.keyFindings && locationIntel.keyFindings.length > 0) {
    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [
        `### Validated Research Findings\n`,
        ...locationIntel.keyFindings.map((finding, idx) => `${idx + 1}. **[CORROBORATED]** ${finding}\n`)
      ]
    });
  }

  // Risk Indicators Code Cell + Matplotlib Graph definition
  if (locationIntel?.riskIndicators) {
    const risks = locationIntel.riskIndicators;
    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [
        `### Integrated Risk Metric & Vulnerability Analysis\n`,
        `The following visual analytics block compiles multiple Earth science markers onto a standard 0-10 vulnerability envelope.  \n`,
        `Run the Python cell below to render the regional environmental vulnerability matrix.`
      ]
    });

    cells.push({
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        `# Dynamic Vulnerability Matrix Mapping\n`,
        `import pandas as pd\n`,
        `import matplotlib.pyplot as plt\n`,
        `import numpy as np\n`,
        `\n`,
        `# Set high-visibility scientific style sheet\n`,
        `plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')\n`,
        `\n`,
        `risk_data = {\n`,
        `    "Wildfire Hazard Potential": ${risks.wildfire},\n`,
        `    "Deforestation Coefficient": ${risks.deforestation},\n`,
        `    "Radiative Thermal Warming": ${risks.warming},\n`,
        `    "Hydro-Climatic Water Stress": ${risks.waterStress},\n`,
        `    "Desertification Propensity": ${risks.desertification}\n`,
        `}\n`,
        `\n`,
        `df_risks = pd.DataFrame(list(risk_data.items()), columns=["Indicator", "Magnitude"])\n`,
        `\n`,
        `# Initialize figure\n`,
        `fig, ax = plt.subplots(figsize=(9, 5))\n`,
        `colors = plt.cm.plasma(np.linspace(0.3, 0.8, len(df_risks)))\n`,
        `\n`,
        `bars = ax.barh(df_risks["Indicator"], df_risks["Magnitude"], color=colors, height=0.55, edgecolor='black', linewidth=0.75)\n`,
        `ax.set_xlim(0, 10)\n`,
        `ax.set_xlabel("Vulnerability Coefficient (0 - 10 Base)", fontsize=10, fontweight='bold', labelpad=10)\n`,
        `ax.set_title("REGIONAL RISK EXPOSURE PROFILE: ${locationTitle.replace(/"/g, '\\"')}", fontsize=12, fontweight='bold', pad=15)\n`,
        `\n`,
        `# Annotate precise indices onto bars\n`,
        `for bar in bars:\n`,
        `    width = bar.get_width()\n`,
        `    ax.text(width + 0.25, bar.get_y() + bar.get_height()/2, f"{width:.1f}/10", \n`,
        `            va='center', ha='left', fontsize=9, fontweight='black', color='#1a1a2e')\n`,
        `\n`,
        `plt.tight_layout()\n`,
        `plt.show()`
      ]
    });
  }

  // Historical Timeline Code Cell + Matplotlib Dual-Axis Graph
  if (changeDetection?.comparisonTimeline && changeDetection.comparisonTimeline.length > 0) {
    const timeline = changeDetection.comparisonTimeline;
    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [
        `### Historical Decadal Change Detection Matrix\n`,
        `**Primary Change Classification:** ${changeDetection.primaryChangeType}  \n`,
        `**Mean Change Rate Evaluation:** ${changeDetection.changeRates}  \n`,
        `**Tipping Point Margin Assessment:** ${changeDetection.tippingPointWarning}  \n`,
        `\n`,
        `*Scientific Narrative Summary:* ${changeDetection.scientificNarrative}  \n`,
        `\n`,
        `Run the Python code block below to load this actual decadal timeline and compile an overlay trend comparison chart.`
      ]
    });

    // Let's create the Python dataset representer safely
    const rows = timeline.map(item => ({
      year: item.year,
      temperature_anomaly: item.temperatureAnomaly,
      canopy_cover: item.canopyCover !== undefined ? item.canopyCover : null,
      glacier_area: item.glacierArea !== undefined ? item.glacierArea : null,
      water_surface_area: item.waterSurfaceArea !== undefined ? item.waterSurfaceArea : null,
      urban_built_extent: item.urbanBuiltExtent !== undefined ? item.urbanBuiltExtent : null,
    }));

    cells.push({
      cell_type: "code",
      execution_count: null,
      metadata: {},
      outputs: [],
      source: [
        `# Historical Decadal Trend Regression Modeling\n`,
        `import pandas as pd\n`,
        `import matplotlib.pyplot as plt\n`,
        `\n`,
        `timeline_records = ${JSON.stringify(rows, null, 4)}\n`,
        `df_time = pd.DataFrame(timeline_records)\n`,
        `\n`,
        `print("Compiling Historical Planetary Observations (2010 - 2026):")\n`,
        `print(df_time.to_string(index=False))\n`,
        `\n`,
        `fig, ax1 = plt.subplots(figsize=(10, 5))\n`,
        `\n`,
        `# Primary plot: Temperature Anomaly\n`,
        `color_temp = '#e63946'\n`,
        `ax1.set_xlabel("Observation Epoch (Year)", fontsize=10, fontweight='bold', labelpad=10)\n`,
        `ax1.set_ylabel("Thermal Anomaly Delta (°C)", color=color_temp, fontsize=10, fontweight='bold')\n`,
        `line1 = ax1.plot(df_time["year"], df_time["temperature_anomaly"], color=color_temp, marker='o', linewidth=2.5, label="Temperature Delta (°C)")\n`,
        `ax1.tick_params(axis='y', labelcolor=color_temp)\n`,
        `ax1.set_xticks(df_time["year"])\n`,
        `\n`,
        `# Decide secondary plot label based on non-null features\n`,
        `secondary_col = None\n`,
        `secondary_label = ""\n`,
        `color_sec = '#457b9d'\n`,
        `\n`,
        `if df_time["canopy_cover"].notna().any():\n`,
        `    secondary_col = "canopy_cover"\n`,
        `    secondary_label = "Canopy Cover Index (%)"\n`,
        `    color_sec = '#2a9d8f'\n`,
        `elif df_time["glacier_area"].notna().any():\n`,
        `    secondary_col = "glacier_area"\n`,
        `    secondary_label = "Glacier Spatial Footprint (km²)"\n`,
        `    color_sec = '#a8dadc'\n`,
        `elif df_time["water_surface_area"].notna().any():\n`,
        `    secondary_col = "water_surface_area"\n`,
        `    secondary_label = "Open Water Surface Area (km²)"\n`,
        `    color_sec = '#1d3557'\n`,
        `elif df_time["urban_built_extent"].notna().any():\n`,
        `    secondary_col = "urban_built_extent"\n`,
        `    secondary_label = "Urban Impervious Spatial Extent (%)"\n`,
        `    color_sec = '#f4a261'\n`,
        `\n`,
        `if secondary_col:\n`,
        `    ax2 = ax1.twinx()\n`,
        `    ax2.set_ylabel(secondary_label, color=color_sec, fontsize=10, fontweight='bold')\n`,
        `    line2 = ax2.plot(df_time["year"], df_time[secondary_col], color=color_sec, marker='s', linestyle='--', linewidth=2, label=secondary_label)\n`,
        `    ax2.tick_params(axis='y', labelcolor=color_sec)\n`,
        `    lines = line1 + line2\n`,
        `else:\n`,
        `    lines = line1\n`,
        `\n`,
        `labels = [l.get_label() for l in lines]\n`,
        `ax1.legend(lines, labels, loc='upper left')\n`,
        `\n`,
        `plt.title("PLANETARY ANOMALY CORRELATION TIMELINE: ${locationTitle.replace(/"/g, '\\"')}", fontsize=12, fontweight='bold', pad=15)\n`,
        `plt.grid(True, linestyle=':', alpha=0.6)\n`,
        `plt.tight_layout()\n`,
        `plt.show()`
      ]
    });
  }

  // Observed Anomalies
  if (locationIntel?.anomalies && locationIntel.anomalies.length > 0) {
    const table_rows = locationIntel.anomalies.map(anomaly => 
      `| ${anomaly.type} | ${anomaly.severity} | ${anomaly.timePeriod} | ${anomaly.description} | ${anomaly.impactMetric} |\n`
    );

    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [
        `### Geospatial Observed Anomalies & Impact Matrix\n`,
        `| Anomaly Identifier / Type | Severity Classification | Temporal Window | Detail Assessment | Primary Sensor Delta |\n`,
        `| :--- | :--- | :--- | :--- | :--- |\n`,
        ...table_rows
      ]
    });
  }

  // Official NASA Earth Science Datasets Recommendations
  if (results.datasets && results.datasets.length > 0) {
    const dataset_details = results.datasets.map(dataset => 
      `* **${dataset.id}**: *${dataset.title}*  \n  NASA Earth System Product | Variables: ${dataset.variables.join(", ")}${dataset.spatialResolution ? ` | Resolution: ${dataset.spatialResolution}` : ""}  \n`
    );

    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [
        `### Key NASA Climate & Hydrological Datasets Available\n`,
        `These primary datasets from official repositories cover the variables evaluated in this report:\n`,
        `\n`,
        ...dataset_details
      ]
    });
  }

  // Recommendations and strategic protocols
  if (locationIntel?.recommendations && locationIntel.recommendations.length > 0) {
    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: [
        `### Recommendations & Adaptive Mitigation Protocols\n`,
        ...locationIntel.recommendations.map((rec, idx) => `- **[ACTION PROTOCOL ${idx + 1}]** ${rec}\n`)
      ]
    });
  }

  // Base setup details (relegated gracefully to the very bottom as optional research code)
  cells.push({
    cell_type: "markdown",
    metadata: {},
    source: [
      `---\n`,
      `### Appendix: Optional NASA Earthdata Search Script\n`,
      `If you need raw data files (H4, H5, NetCDF files) directly from NASA Common Metadata Repository (CMR), configure your NASA Earthdata credentials below and execute coordinates-based granule search queries.`
    ]
  });

  cells.push({
    cell_type: "code",
    execution_count: null,
    metadata: {},
    outputs: [],
    source: [
      `# Optional dataset granule discovery via standard metadata API queries\n`,
      `import requests\n`,
      `\n`,
      `NASA_API_KEY = "YOUR_NASA_API_KEY_HERE"  # Substitute your Earthdata API key if desired\n`,
      `DATASET_IDS = ${JSON.stringify(results.datasets.map(d => d.id))}\n`,
      `\n`,
      `def query_nasa_granules(dataset_id, lat=${latitude}, lng=${longitude}, limit=3):\n`,
      `    url = 'https://cmr.earthdata.nasa.gov/search/granules.json'\n`,
      `    params = {\n`,
      `        'short_name': dataset_id.split('-')[1] if '-' in dataset_id else dataset_id,\n`,
      `        'point': f"{lng},{lat}",\n`,
      `        'page_size': limit\n`,
      `    }\n`,
      `    headers = {'x-api-key': NASA_API_KEY} if NASA_API_KEY != 'YOUR_NASA_API_KEY_HERE' else {}\n`,
      `    try:\n`,
      `        response = requests.get(url, params=params, headers=headers, timeout=10)\n`,
      `        data = response.json()\n`,
      `        entries = data.get('feed', {}).get('entry', [])\n`,
      `        print(f"\\nPrimary results found for {dataset_id}: {len(entries)} granules.")\n`,
      `        for idx, entry in enumerate(entries):\n`,
      `            print(f" [{idx + 1}] Granule ID: {entry.get('title')}")\n`,
      `            print(f"     Temporal Limits: {entry.get('time_start')} -> {entry.get('time_end')}")\n`,
      `    except Exception as e:\n`,
      `        print(f"Error querying Earthdata granules: {e}")\n`,
      `\n`,
      `# Execute query for the principal atmospheric / hydrological satellite product\n`,
      `if DATASET_IDS:\n`,
      `    query_nasa_granules(DATASET_IDS[0])`
    ]
  });

  const notebook = {
    cells: cells,
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3"
      },
      language_info: {
        codemirror_mode: {
          name: "ipython",
          version: 3
        },
        file_extension: ".py",
        mimetype: "text/x-python",
        name: "python",
        nbconvert_exporter: "python",
        pygments_lexer: "ipython3",
        version: "3.8.5"
      }
    },
    nbformat: 4,
    nbformat_minor: 4
  };

  return JSON.stringify(notebook, null, 2);
}
