import { GoogleGenAI, Type } from "@google/genai";
import { SearchResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeQuery(
  query: string, 
  onExplanationChunk?: (chunk: string) => void
): Promise<SearchResult> {
  try {
    // 1. Start parallel calls for metadata and explanation
    const metadataPromise = getMetadata(query);
    const explanationPromise = getExplanation(query, onExplanationChunk);

    // 2. Wait for metadata first to start fetching datasets
    const metadata = await metadataPromise;
    
    // 3. Fetch datasets in parallel with the rest of the explanation
    const datasetsPromise = fetchNasaDatasets(metadata.suggestedKeywords);
    
    // 4. Wait for explanation and datasets
    const [explanation, datasets] = await Promise.all([
      explanationPromise,
      datasetsPromise
    ]);

    return {
      datasets: datasets.map((d: any, i: number) => ({
        id: d.id,
        title: d.title,
        summary: d.summary,
        variables: metadata.suggestedVariables.slice(0, 3), 
        relevanceScore: 0.95 - (i * 0.05),
        relevanceReason: explanation.split('.')[0] + '.',
        links: d.links
      })),
      explanation: explanation,
      suggestedTimeRange: metadata.suggestedTimeRange,
      suggestedVariables: metadata.suggestedVariables,
      location: metadata.location
    };
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
}

async function getMetadata(query: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following Earth Science research query: "${query}"
    
    Provide the following metadata in JSON format:
    1. suggestedKeywords: A list of 3-5 specific NASA dataset keywords or short names.
    2. suggestedVariables: Relevant environmental signals (e.g., soil moisture, precipitation).
    3. location: The geographic coordinates (lat, lng, zoom) of the location mentioned.
    4. suggestedTimeRange: ISO date strings for start and end.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggestedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedVariables: { type: Type.ARRAY, items: { type: Type.STRING } },
          location: {
            type: Type.OBJECT,
            properties: {
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              zoom: { type: Type.NUMBER }
            },
            required: ["lat", "lng"]
          },
          suggestedTimeRange: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING },
              end: { type: Type.STRING }
            }
          }
        },
        required: ["suggestedKeywords", "suggestedVariables", "location"]
      }
    }
  });
  return JSON.parse(response.text);
}

async function getExplanation(query: string, onChunk?: (chunk: string) => void) {
  const result = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: `Explain why specific NASA Earth Science datasets would be useful for researching this query: "${query}". 
    Focus on the scientific relationship between the event and the environmental signals. 
    Keep it professional and concise (2-3 paragraphs).`
  });

  let fullText = "";
  for await (const chunk of result) {
    const text = chunk.text;
    fullText += text;
    if (onChunk) onChunk(text);
  }
  return fullText;
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
    // Start both specific and broad searches in parallel for speed
    const [specificResponse, broadResponse] = await Promise.all([
      fetch(`/api/nasa/datasets?keyword=${encodeURIComponent(query)}`),
      fetch(`/api/nasa/datasets?keyword=${encodeURIComponent(keywords[0])}`)
    ]);

    const [specificData, broadData] = await Promise.all([
      specificResponse.json(),
      broadResponse.json()
    ]);
    
    const entries = specificData.feed?.entry?.length > 0 
      ? specificData.feed.entry 
      : (broadData.feed?.entry || []);

    return entries.map((entry: any) => ({
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
