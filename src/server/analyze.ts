import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

function extractJson(text: string) {
  return text.replace(/```json/g, "").replace(/```/g, "").trim();
}

export const analyzeProfile = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    try {
      if (!(data instanceof FormData)) {
        throw new Error("Invalid input data");
      }

      const file = data.get("file") as File;
      const jd = data.get("jd") as string;
      const role = data.get("role") as string;

      if (!file || !jd || !role) {
        throw new Error("Missing required fields");
      }

      const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "your_gemini_api_key_here") {
        throw new Error("Gemini API key is missing or invalid. Please add VITE_GEMINI_API_KEY to your .env file.");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Save file temporarily to upload it using File API
      const buffer = Buffer.from(await file.arrayBuffer());
      const tempPath = path.join(os.tmpdir(), file.name.replace(/[^a-zA-Z0-9.-]/g, "_"));
      await fs.writeFile(tempPath, buffer);

      console.log(`Uploading ${file.name} to Gemini...`);
      const uploadResponse = await ai.files.upload({
        file: tempPath,
        mimeType: file.type || "application/pdf",
      });

      console.log("Generating analysis...");

      const prompt = `
You are an expert technical recruiter and AI interviewer. Analyze the attached resume against the following Job Description and Target Role.
Target Role: ${role}
Job Description:
${jd}

Output the analysis strictly as a JSON object matching this schema exactly. Do NOT use markdown code blocks like \`\`\`json, just output the raw JSON object.
{
  "hiringProbability": number (0-100),
  "scores": [
    { "l": "Technical", "v": number (0-100) },
    { "l": "Communication", "v": number (0-100) },
    { "l": "Confidence", "v": number (0-100) },
    { "l": "Role Match", "v": number (0-100) }
  ],
  "radarData": [number (Tech 0-100), number (Comm 0-100), number (Depth 0-100), number (Speed 0-100), number (Calm 0-100), number (Fit 0-100)],
  "skills": [
    { "name": string, "level": number (0-100) } // At most 6 key skills mentioned in JD
  ],
  "strengths": [string], // 3 items
  "techStack": [string], // 3-4 items
  "watchOuts": [string], // 3 items (weaknesses or areas of concern)
  "missingForRole": [string] // 3 items (skills in JD not in resume)
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: uploadResponse.uri,
                  mimeType: uploadResponse.mimeType || file.type || "application/pdf",
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      // Cleanup temp file
      await fs.unlink(tempPath).catch(console.error);

      if (!response.text) {
         throw new Error("No response from AI");
      }

      const jsonStr = extractJson(response.text);
      return JSON.parse(jsonStr);

    } catch (err: any) {
      console.error("Analysis Error:", err);
      throw new Error(err.message || "Failed to analyze profile");
    }
  }
);
