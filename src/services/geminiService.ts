
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Simulates the RAG retrieval process.
 * In a full backend implementation, this would call the Gemini File API or a Vector Database.
 * For this frontend demo, we simulate the "Retrieval" step.
 */
export const simulateRAGRetrieval = async (query: string): Promise<string> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return mock context based on query to simulate "Retrieving relevant chunks"
  return `[CONTEXT RETRIEVED FOR QUERY: "${query}"]
  - Relevant Policy Document A, Section 2.
  - FAQ Database, Item #45.
  - Previous interaction history summary.
  [END CONTEXT]`;
};

// Initialize the API client. 
// Note: In a real production app, keys should be proxied via backend. 
// Here we accept it as an argument to allow dynamic configuration in the demo.
export const generateGeminiResponse = async (
  apiKey: string,
  prompt: string,
  systemInstruction: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure it in Settings.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Simulate RAG retrieval to provide context even in frontend-only mode
    const ragContext = await simulateRAGRetrieval(prompt);
    const augmentedPrompt = `${ragContext}\n\nUser Question: ${prompt}`;

    // Using gemini-2.5-flash as the efficient "Agent" model mentioned in requirements
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: augmentedPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
