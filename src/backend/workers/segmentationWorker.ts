import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import * as jobDb from '../jobDb.js';

export async function processSegmentation(job: any) {
  const { jobId, videoPath, transcriptPath } = job.data;
  jobDb.updateJob(jobId, { status: 'analyzing', message: 'Analyzing transcript for viral hooks...' });

  const transcript = await fs.readFile(transcriptPath, 'utf8');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return { jobId, videoPath, transcriptPath, segments: [
      { start: 0, end: 15, title: "The Hook", score: 95, explanation: "Strong opening" },
      { start: 30, end: 45, title: "The Value Drop", score: 88, explanation: "High value" }
    ]};
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Analyze this transcript. Find the 3 most compelling, engaging, and high-energy segments that would make perfect standalone 15 to 60-second clips for TikTok/Shorts.
    Score them based on: emotional intensity, speech dynamics, pacing, hook potential.
    Transcript: ${transcript.substring(0, 30000)}

    Return EXACTLY a valid JSON array of objects:
    [{
      "start": 0,
      "end": 15,
      "title": "Example Title",
      "score": 90,
      "explanation": "Example explanation"
    }]
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  const segments = JSON.parse(response.text || "[]");
  return { jobId, videoPath, transcriptPath, segments };
}
