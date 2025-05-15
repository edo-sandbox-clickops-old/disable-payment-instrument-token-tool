// app/actions/chatWithAI.ts
'use server';

import { VertexAI } from '@google-cloud/vertexai';

// --- Environment Variables ---
// These should be set in your environment (e.g., .env.local for local development)
// or configured in your deployment environment.
const GCLOUD_PROJECT = process.env.GCLOUD_PROJECT;
const GCLOUD_LOCATION = process.env.GCLOUD_LOCATION; // e.g., 'us-central1', 'europe-west1'
const MODEL_ID = process.env.VERTEX_AI_GEMINI_MODEL_ID || 'gemini-1.5-flash-001'; // Or your preferred Gemini model

if (!GCLOUD_PROJECT || !GCLOUD_LOCATION) {
    console.warn(
        "Missing GCLOUD_PROJECT or GCLOUD_LOCATION environment variables for Vertex AI. " +
        "Chat AI functionality might be impaired or use defaults."
    );
    // Consider throwing an error if these are absolutely required for your setup
    // throw new Error("Missing GCLOUD_PROJECT or GCLOUD_LOCATION for Vertex AI.");
}

// --- Initialize the Vertex AI Client ---
// This assumes Application Default Credentials (ADC) are set up.
let vertex_ai: VertexAI | null = null;
if (GCLOUD_PROJECT && GCLOUD_LOCATION) {
    try {
        vertex_ai = new VertexAI({ project: GCLOUD_PROJECT, location: GCLOUD_LOCATION });
    } catch (error) {
        console.error("Failed to initialize VertexAI client:", error);
        // The chat function will handle the null vertex_ai client
    }
}


// Define the model.
// Models available: gemini-1.5-flash-001, gemini-1.5-pro-001, gemini-1.0-pro, gemini-1.0-pro-vision etc.
// See https://cloud.google.com/vertex-ai/generative-ai/docs/learn/models for available models
const generativeModel = vertex_ai?.getGenerativeModel({
    model: MODEL_ID,
    // Configuration for generation - adjust as needed
    generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7, // Controls randomness. Lower for more factual, higher for more creative.
        topP: 1,
        // topK: 40, // Usually not needed if topP is set
    },
    // Safety settings - adjust as needed
    // See https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/configure-safety-attributes
    safetySettings: [
        // { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        // { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        // { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        // { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ],
});


// --- The Chat Server Action ---
export async function chatWithAIAction(
  userMessage: string,
  logs: string[],
  csvData: Record<string, string>[]
): Promise<string> {

  if (!generativeModel) {
    let errorMessage = "AI Chat functionality is currently unavailable. ";
    if (!GCLOUD_PROJECT || !GCLOUD_LOCATION) {
        errorMessage += "Google Cloud Project ID or Location is not configured.";
    } else {
        errorMessage += "Failed to initialize the AI model client.";
    }
    console.error(errorMessage);
    return errorMessage;
  }

  // --- Prepare Context for the LLM ---
  const systemInstruction = `You are a helpful assistant integrated into a membership administration tool.
Your task is to answer user questions based *only* on the provided Processing Logs and CSV Data.
- Processing Logs show the status of attempts to disable payment instrument tokens for members based on their email and prime status.
- If no payment instrument token found to be disabled, it means the payment instrument must have been possibly already disabled before. 
- CSV Data contains the original information uploaded by the user, including member details like email, Prime status, etc.
- Be concise and accurate.
- If the information isn't in the logs or CSV data, state that clearly.
- Do not guess or make up information.
- Do not offer to perform actions.
- If asked about specific data for an email, find the relevant row(s) in the CSV data and summarize the requested fields.
- The email address column in the CSV data is named "VIP Comms: \\nCustomer's email". Pay close attention to this exact column name when looking up emails in the CSV Data.`;

  // Format Logs (potentially truncate if very long)
  const logContext = `\n--- Processing Logs (newest first) ---\n${logs.join('\n').slice(0, 7000)}`; // Limit log size, show newest

  // Format CSV Data (convert to JSON string, potentially truncate or sample if large)
  const csvDataContext = `\n--- Uploaded CSV Data (Sample of first 50 rows) ---\n${JSON.stringify(csvData.slice(0, 50), null, 2)}`;

  // Construct the prompt parts for Vertex AI Gemini
  // Gemini prefers a structure where context and query are clearly delineated.
  // The 'contents' array follows a conversational turn structure.
  const requestContents = [
    {
        role: 'user', // User role for the initial combined context + query
        parts: [
            { text: systemInstruction },
            { text: logContext },
            { text: csvDataContext },
            { text: `\n--- User Question ---\nUser: ${userMessage}` },
            // No "Assistant:" part needed here as the model will generate the assistant's response
        ]
    }
  ];

  try {
    // --- Call the Vertex AI Gemini API ---
    const result = await generativeModel.generateContent({
        contents: requestContents,
    });

    if (result.response && result.response.candidates && result.response.candidates.length > 0) {
        const candidate = result.response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
            return candidate.content.parts.map(part => part.text).join(""); // Concatenate all text parts
        } else if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            // Handle cases where generation stopped for other reasons (e.g., safety, max tokens)
            return `AI response finished due to: ${candidate.finishReason}. ${candidate.finishMessage || ''}`;
        }
    }
    console.error("AI Response Error: No valid candidates or content parts in response", JSON.stringify(result, null, 2));
    return "Sorry, I couldn't get a valid response from the AI. The response was empty or malformed.";

  } catch (error: any) {
    console.error("Error calling Vertex AI Gemini API:", error);
    let errorMessage = "An error occurred while contacting the AI. ";
    if (error.message) {
        errorMessage += error.message;
    }
    if (error.details) { // Vertex AI errors often have a 'details' field
        errorMessage += ` Details: ${error.details}`;
    }
    return errorMessage;
  }
}