import { SearchResult, LocationIntelligence, ChangeDetectionResult } from "../types";

export async function analyzeQuery(query: string, fast = false): Promise<SearchResult> {
  try {
    const response = await fetch("/api/research/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, fast })
    });
    if (!response.ok) throw new Error("Backend query failed");
    const data = await response.json();
    
    // Format response to fit SearchResult types
    return {
      explanation: data.scientificAnswer,
      suggestedVariables: data.suggestedKeywords || [],
      location: data.location,
      datasets: (data.matchedDatasets || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        summary: d.summary,
        variables: d.variables,
        relevanceScore: d.totalConfidence / 100,
        relevanceReason: d.justification,
        geographicScore: d.geographicScore,
        topicScore: d.topicScore,
        timeScore: d.timeScore,
        scientificScore: d.scientificScore,
        links: [{ rel: "enclosure", href: `https://cmr.earthdata.nasa.gov/search/concepts/${d.id}` }]
      }))
    };
  } catch (error) {
    console.error("Query analyze error:", error);
    throw error;
  }
}

export async function analyzeLocation(lat: number, lng: number, fast = false): Promise<SearchResult> {
  // To keep back-compatibility, we perform a query with the coordinates
  return analyzeQuery(`Geospatial assessment for coordinates Latitude ${lat.toFixed(4)}, Longitude ${lng.toFixed(4)}`, fast);
}

export async function fetchLocationIntelligence(lat: number, lng: number, fast = false): Promise<LocationIntelligence> {
  try {
    const response = await fetch("/api/research/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, fast })
    });
    if (!response.ok) throw new Error("Location analysis failed");
    return await response.json();
  } catch (error) {
    console.error("fetchLocationIntelligence error:", error);
    throw error;
  }
}

export async function fetchChangeDetection(lat: number, lng: number, fast = false): Promise<ChangeDetectionResult> {
  try {
    const response = await fetch("/api/research/change-detection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, fast })
    });
    if (!response.ok) throw new Error("Change detection request failed");
    return await response.json();
  } catch (error) {
    console.error("fetchChangeDetection error:", error);
    throw error;
  }
}

export async function fetchAgentQuery(agentName: string, query: string, context: any) {
  try {
    const response = await fetch("/api/research/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentName, query, context })
    });
    if (!response.ok) throw new Error("Agent request failed");
    return await response.json();
  } catch (error) {
    console.error("fetchAgentQuery error:", error);
    throw error;
  }
}

export async function fetchActiveEvents() {
  try {
    const response = await fetch("/api/nasa/events");
    if (!response.ok) throw new Error("NASA EONET API failed");
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error("Error fetching EONET events:", error);
    return [];
  }
}
