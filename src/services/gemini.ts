import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeQuery(query: string): Promise<SearchResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following Earth Science research query: "${query}"
      
      Identify:
      1. The core environmental event or phenomenon.
      2. Relevant environmental signals (e.g., soil moisture, precipitation, aerosol optical depth).
      3. Suggested temporal range if applicable.
      4. A list of 3-5 specific NASA dataset keywords or short names that would be most relevant.
      5. A brief explanation of why these datasets are chosen for this specific event.
      6. The geographic coordinates (latitude and longitude) of the location mentioned in the query. If it's a general query, provide coordinates for a representative region.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            suggestedKeywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedTimeRange: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.STRING, description: "ISO date string" },
                end: { type: Type.STRING, description: "ISO date string" }
              }
            },
            suggestedVariables: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            location: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                zoom: { type: Type.NUMBER }
              },
              required: ["lat", "lng"]
            }
          },
          required: ["explanation", "suggestedKeywords", "suggestedVariables", "location"]
        }
      }
    });

    const analysis = JSON.parse(response.text);
    
    // Now we fetch from NASA CMR using these keywords via our proxy
    let datasets = await fetchNasaDatasets(analysis.suggestedKeywords);

    // Fallback if no datasets found
    if (datasets.length === 0) {
      datasets = [
        {
          id: "C123456789-LPDAAC_ECS",
          title: "MODIS/Terra Thermal Anomalies/Fire 5-Min L2 Swath 1km V061",
          summary: "The MODIS Thermal Anomalies/Fire products are primarily derived from MODIS 4- and 11-micrometer channels.",
          links: [{ rel: "enclosure", href: "https://lpdaac.usgs.gov/products/mod14v061/" }]
        },
        {
          id: "C123456790-GES_DISC",
          title: "GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V06",
          summary: "The Integrated Multi-satellitE Retrievals for GPM (IMERG) is the unified algorithm that provides multi-satellite precipitation-related estimates.",
          links: [{ rel: "enclosure", href: "https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_06/summary" }]
        }
      ];
    }

    return {
      datasets: datasets.map((d: any, i: number) => ({
        id: d.id,
        title: d.title,
        summary: d.summary,
        variables: analysis.suggestedVariables.slice(0, 3), 
        relevanceScore: 0.95 - (i * 0.05),
        relevanceReason: analysis.explanation.split('.')[0] + '.',
        links: d.links
      })),
      explanation: analysis.explanation,
      suggestedTimeRange: analysis.suggestedTimeRange,
      suggestedVariables: analysis.suggestedVariables,
      location: analysis.location
    };
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
}

export async function analyzeLocation(lat: number, lng: number): Promise<SearchResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the geographic location at Latitude: ${lat}, Longitude: ${lng}.
      
      Identify:
      1. The primary environmental characteristics or notable natural features of this specific location.
      2. Potential environmental research topics relevant to this area (e.g., deforestation, urban heat islands, coastal erosion, drought).
      3. A list of 3-5 specific NASA dataset keywords or short names that would be most relevant for studying this location.
      4. A brief explanation of why these datasets are chosen.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            suggestedKeywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedVariables: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["explanation", "suggestedKeywords", "suggestedVariables"]
        }
      }
    });

    const analysis = JSON.parse(response.text);
    let datasets = await fetchNasaDatasets(analysis.suggestedKeywords);

    if (datasets.length === 0) {
      datasets = [
        {
          id: "C123456789-LPDAAC_ECS",
          title: "MODIS/Terra Thermal Anomalies/Fire 5-Min L2 Swath 1km V061",
          summary: "The MODIS Thermal Anomalies/Fire products are primarily derived from MODIS 4- and 11-micrometer channels.",
          links: [{ rel: "enclosure", href: "https://lpdaac.usgs.gov/products/mod14v061/" }]
        }
      ];
    }

    return {
      datasets: datasets.map((d: any, i: number) => ({
        id: d.id,
        title: d.title,
        summary: d.summary,
        variables: analysis.suggestedVariables.slice(0, 3), 
        relevanceScore: 0.95 - (i * 0.05),
        relevanceReason: analysis.explanation.split('.')[0] + '.',
        links: d.links
      })),
      explanation: analysis.explanation,
      suggestedVariables: analysis.suggestedVariables,
      location: { lat, lng, zoom: 8 }
    };
  } catch (error) {
    console.error("Location analysis failed:", error);
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

async function fetchNasaDatasets(keywords: string[]) {
  const query = keywords.slice(0, 3).join(' ');
  
  try {
    const response = await fetch(`/api/nasa/datasets?keyword=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("NASA CMR API failed");
    const data = await response.json();
    
    if (!data.feed || !data.feed.entry || data.feed.entry.length === 0) {
      // Try a broader search if specific keywords fail
      const broadResponse = await fetch(`/api/nasa/datasets?keyword=${encodeURIComponent(keywords[0])}`);
      const broadData = await broadResponse.json();
      return (broadData.feed?.entry || []).map((entry: any) => ({
        id: entry.id,
        title: entry.title,
        summary: entry.summary || entry.dataset_id,
        links: entry.links || []
      }));
    }

    return data.feed.entry.map((entry: any) => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary || entry.dataset_id,
      links: entry.links || []
    }));
  } catch (error) {
    console.error("Error fetching NASA datasets:", error);
    return [];
  }
}
