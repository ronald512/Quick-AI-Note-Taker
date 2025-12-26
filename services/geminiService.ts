
import { GoogleGenAI, Type } from "@google/genai";
import { NoteMetadata, SearchFilters, Criticality } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeNote = async (content: string): Promise<NoteMetadata> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following note content and extract metadata. 
    Content: "${content}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING, description: "A short descriptive title/subject of the note" },
          criticality: { type: Type.STRING, enum: ['High', 'Medium', 'Low'], description: "The urgency or criticality" },
          purpose: { type: Type.STRING, description: "The context or category (e.g. Work, Personal, Shopping, Meeting)" },
          importance: { type: Type.INTEGER, description: "Importance score from 1 to 10" },
          tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant keywords" },
        },
        required: ["subject", "criticality", "purpose", "importance", "tags"],
      },
      systemInstruction: "You are an assistant that categorizes and organizes notes. Always return JSON."
    }
  });

  try {
    return JSON.parse(response.text || '{}') as NoteMetadata;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return {
      subject: content.slice(0, 30) + "...",
      criticality: 'Medium',
      purpose: 'General',
      importance: 5,
      tags: []
    };
  }
};

export const parseVoiceSearch = async (transcript: string): Promise<SearchFilters> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate this spoken search query into structured search filters.
    Query: "${transcript}"
    Current Date: ${new Date().toISOString()}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: "General keyword to look for in content" },
          subject: { type: Type.STRING, description: "Specific subject filter" },
          startDate: { type: Type.STRING, description: "ISO start date if mentioned (e.g. 'last week')" },
          endDate: { type: Type.STRING, description: "ISO end date" },
          criticality: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
          purpose: { type: Type.STRING, description: "Category like 'Work' or 'Personal'" },
          minImportance: { type: Type.INTEGER, description: "Minimum importance score 1-10" },
        },
      },
      systemInstruction: "You are a search query interpreter. Convert natural language speech into filters. Return only valid JSON."
    }
  });

  try {
    return JSON.parse(response.text || '{}') as SearchFilters;
  } catch (error) {
    console.error("Failed to parse voice command:", error);
    return { query: transcript };
  }
};
