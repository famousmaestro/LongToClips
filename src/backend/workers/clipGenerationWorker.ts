import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import path from "path";
import * as jobDb from '../jobDb.js';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function processClipGeneration(job: any) {
  const { jobId, videoPath, segment, clipIndex, totalClips } = job.data;
  
  if (clipIndex === 0) {
     jobDb.updateJob(jobId, { status: 'cutting', message: `Cutting and formatting clips...` });
  }
  
  const tempDir = path.join(process.cwd(), 'temp');
  const clipFileName = `${jobId}_clip_${clipIndex}_raw.mp4`;
  const outputPath = path.join(tempDir, clipFileName);

  const duration = segment.end - segment.start;

  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .setStartTime(segment.start)
      .setDuration(duration)
      .outputOptions([
        '-c:v libx264',
        '-preset fast',
        '-crf 18', 
        '-c:a aac',
        '-b:a 192k',
      ])
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });

  return { jobId, clipPath: outputPath, segment, clipIndex, totalClips };
}
