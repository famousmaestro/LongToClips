import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import * as jobDb from '../jobDb.js';

export async function processTranscription(job: any) {
  const { jobId, videoPath } = job.data;
  jobDb.updateJob(jobId, { status: 'analyzing', message: 'Generating transcript...' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    const mockTranscriptPath = `${videoPath}.transcript.json`;
    await fs.writeFile(mockTranscriptPath, JSON.stringify({ text: "Mock transcription...", segments: []}));
    return { jobId, videoPath, transcriptPath: mockTranscriptPath };
  }

  const ai = new GoogleGenAI({ apiKey });
  console.log(`[Job ${jobId}] Uploading to Gemini...`);
  const uploadResult = await ai.files.upload({ file: videoPath, config: { mimeType: "video/mp4" } } as any);
  
  let fileState = await ai.files.get({ name: uploadResult.name });
  while (fileState.state === "PROCESSING") {
    await new Promise(r => setTimeout(r, 5000));
    fileState = await ai.files.get({ name: uploadResult.name });
  }

  if (fileState.state === "FAILED") throw new Error("Transcription upload failed");

  console.log(`[Job ${jobId}] Analyzing for transcription...`);
  const prompt = `Transcribe this video exactly. Output in JSON format with timestamps. Format: [{ "start": 0.0, "end": 2.5, "text": "Hello world" }]`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: [
      { role: "user", parts: [{ fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } }, { text: prompt }] }
    ],
    config: { responseMimeType: "application/json" }
  });

  const transcriptData = response.text || "[]";
  const transcriptPath = `${videoPath}.transcript.json`;
  await fs.writeFile(transcriptPath, transcriptData);
  
  await ai.files.delete({ name: uploadResult.name }).catch(console.error);

  return { jobId, videoPath, transcriptPath };
}
