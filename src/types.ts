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
  relevanceScore: number;
  relevanceReason: string;
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
  explanation: string;
  suggestedTimeRange?: {
    start: string;
    end: string;
  };
  suggestedVariables: string[];
  location?: {
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
