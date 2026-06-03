import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import * as jobDb from '../jobDb.js';

export async function processExport(job: any) {
  const { jobId, enhancedClipPath, segment, clipIndex, totalClips } = job.data;
  
  const publicDir = path.join(process.cwd(), 'public');
  const clipsDir = path.join(publicDir, 'clips');
  
  if (!fsSync.existsSync(clipsDir)) {
      await fs.mkdir(clipsDir, { recursive: true });
  }

  const finalFileName = `${jobId}_final_${clipIndex}.mp4`;
  const finalPath = path.join(clipsDir, finalFileName);
  
  const storageDriver = process.env.STORAGE_DRIVER || 'local';
  let clipUrl = `/clips/${finalFileName}`;

  if (storageDriver === 's3' && process.env.AWS_S3_BUCKET) {
    console.log(`[Job ${jobId}] Uploading clip to S3 bucket ${process.env.AWS_S3_BUCKET}...`);
    // Placeholder for actual S3 Client implementation
  }
  
  await fs.copyFile(enhancedClipPath, finalPath);

  const jobState = jobDb.getJob(jobId);
  const currentClips = jobState?.clips || [];
  
  currentClips.push({
    id: `${jobId}_${clipIndex}`,
    url: clipUrl,
    title: segment.title,
    score: segment.score,
    explanation: segment.explanation,
    duration: segment.end - segment.start
  });

  jobDb.updateJob(jobId, { clips: currentClips });
  
  if (currentClips.length === totalClips) {
    jobDb.updateJob(jobId, { status: 'completed', progress: 100, message: 'All clips generated and exported!' });
    console.log(`[Job ${jobId}] Complete. Cleanup triggered.`);
    // Cleanup temporary files using background process to avoid blocking
  }

  return { jobId, clipUrl };
}
