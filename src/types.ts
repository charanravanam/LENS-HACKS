export interface Dataset {
  id: string;
  title: string;
  summary: string;
  variables: string[];
  spatialResolution?: string;
  temporalCoverage?: {
    start: string;
    end?: string;
  };
  relevanceScore: number; // maps to totalConfidence as decimal
  relevanceReason: string; // maps to justification
  geographicScore?: number;
  topicScore?: number;
  timeScore?: number;
  scientificScore?: number;
  links: {
    rel: string;
    href: string;
  }[];
}

export interface MapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'raster' | 'vector' | 'geojson';
  url: string;
  description: string;
  timeEnabled?: boolean;
}

export interface SearchResult {
  datasets: Dataset[];
  explanation: string; // scientificAnswer
  suggestedTimeRange?: {
    start: string;
    end: string;
  };
  suggestedVariables: string[];
  location?: {
    name?: string;
    lat: number;
    lng: number;
    zoom?: number;
  };
}

export interface EventSignal {
  name: string;
  description: string;
  datasets: string[];
}

export interface Anomaly {
  type: string;
  severity: 'Low' | 'Medium' | 'Critical' | 'Extreme' | string;
  timePeriod: string;
  description: string;
  impactMetric: string;
}

export interface LocationIntelligence {
  title: string;
  climateZone: string;
  elevation: number;
  environmentalStatus: string;
  riskIndicators: {
    wildfire: number;
    deforestation: number;
    warming: number;
    waterStress: number;
    desertification: number;
  };
  summary: string;
  climateTrends: string;
  vegetationChanges: string;
  temperatureTrends: string;
  waterInsights: string;
  keyFindings: string[];
  anomalies: Anomaly[];
  recommendations: string[];
}

export interface ChangeTimelineItem {
  year: number;
  canopyCover?: number;
  glacierArea?: number;
  temperatureAnomaly: number;
  waterSurfaceArea?: number;
  urbanBuiltExtent?: number;
}

export interface ChangeDetectionResult {
  title: string;
  primaryChangeType: string;
  scientificNarrative: string;
  changeRates: string;
  tippingPointWarning: string;
  comparisonTimeline: ChangeTimelineItem[];
}
